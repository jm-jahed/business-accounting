import { Types, ClientSession } from 'mongoose';
import { UnitOfMeasure } from '../models/UnitOfMeasure.js';
import { ItemCategory } from '../models/ItemCategory.js';
import { ItemBrand } from '../models/ItemBrand.js';
import { Warehouse } from '../models/Warehouse.js';
import { WarehouseBin } from '../models/WarehouseBin.js';
import { Item } from '../models/Item.js';
import { StockBalance } from '../models/StockBalance.js';
import { StockMovement } from '../models/StockMovement.js';
import { StockTransfer } from '../models/StockTransfer.js';
import { TenantContext, validateTenantAccess } from './tenant.context.js';
import { toDecimal, roundHalfEven } from '@accounting/core';
import { invalidateCompanyDashboardCache } from './dashboard.service.js';

export class InventoryValidationError extends Error {
  constructor(message: string) {
    super(`[InventoryValidation] ${message}`);
    this.name = 'InventoryValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InventoryMasterService {
  /**
   * Initializes standard baseline inventory records for a tenant company:
   * Standard UoMs, standard product categories, and a default central logistics warehouse.
   */
  async initializeStandardInventoryMaster(
    companyId: string,
    context: TenantContext,
    session?: ClientSession
  ): Promise<{
    uomsCreated: number;
    categoriesCreated: number;
    warehousesCreated: number;
    binsCreated: number;
  }> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    let uomsCreated = 0;
    let categoriesCreated = 0;
    let warehousesCreated = 0;
    let binsCreated = 0;

    // 1. Seed Base UoMs
    const existingUomCount = await UnitOfMeasure.countDocuments({ companyId: companyObjId }).session(session || null);

    if (existingUomCount === 0) {
      const standardUoms = [
        { code: 'PCS', name: 'Pieces / Units', category: 'UNIT', isBaseUnit: true, conversionRatio: '1.0000', precision: 0 },
        { code: 'BOX', name: 'Standard Box (10 pcs)', category: 'PACKAGING', isBaseUnit: false, conversionRatio: '10.0000', precision: 0 },
        { code: 'CTN', name: 'Carton (24 pcs)', category: 'PACKAGING', isBaseUnit: false, conversionRatio: '24.0000', precision: 0 },
        { code: 'KG', name: 'Kilograms', category: 'WEIGHT', isBaseUnit: true, conversionRatio: '1.0000', precision: 3 },
        { code: 'G', name: 'Grams', category: 'WEIGHT', isBaseUnit: false, conversionRatio: '0.0010', precision: 3 },
        { code: 'LTR', name: 'Liters', category: 'VOLUME', isBaseUnit: true, conversionRatio: '1.0000', precision: 3 },
        { code: 'MTR', name: 'Meters', category: 'LENGTH', isBaseUnit: true, conversionRatio: '1.0000', precision: 2 },
        { code: 'SET', name: 'Assembly Set', category: 'UNIT', isBaseUnit: true, conversionRatio: '1.0000', precision: 0 },
      ];

      for (const u of standardUoms) {
        const doc = new UnitOfMeasure({
          companyId: companyObjId,
          code: u.code,
          name: u.name,
          category: u.category,
          isBaseUnit: u.isBaseUnit,
          conversionRatio: Types.Decimal128.fromString(u.conversionRatio),
          precision: u.precision,
          isActive: true,
        });
        await doc.save({ session });
        uomsCreated++;
      }
    }

    // 2. Seed Base Categories
    const existingCatCount = await ItemCategory.countDocuments({ companyId: companyObjId }).session(session || null);
    if (existingCatCount === 0) {
      const standardCategories = [
        { code: 'GEN', name: 'General Merchandise', description: 'Finished goods and standard catalog items' },
        { code: 'RAW', name: 'Raw Materials & Components', description: 'Production and manufacturing inputs' },
        { code: 'PKG', name: 'Packaging & Shipping Materials', description: 'Cartons, boxes, bubble wrap and logistics supplies' },
        { code: 'SRV', name: 'Services & Labor', description: 'Consulting, maintenance and non-physical services' },
        { code: 'AST', name: 'Capital Equipment & Assets', description: 'Tools, fixtures and equipment assets' },
      ];

      for (const cat of standardCategories) {
        const doc = new ItemCategory({
          companyId: companyObjId,
          code: cat.code,
          name: cat.name,
          description: cat.description,
          isActive: true,
        });
        await doc.save({ session });
        categoriesCreated++;
      }
    }

    // 3. Seed Central Logistics Warehouse & Default Bin
    const existingWhCount = await Warehouse.countDocuments({ companyId: companyObjId }).session(session || null);
    if (existingWhCount === 0) {
      const centralWarehouse = new Warehouse({
        companyId: companyObjId,
        code: 'WH-MAIN',
        name: 'Central Logistics & Distribution Hub',
        type: 'CENTRAL',
        isDefault: true,
        allowNegativeStock: false,
        address: {
          street: 'Main Warehouse Zone 1',
          city: 'Dubai',
          state: 'Dubai',
          country: 'AE',
        },
        isActive: true,
      });
      await centralWarehouse.save({ session });
      warehousesCreated++;

      const defaultBin = new WarehouseBin({
        companyId: companyObjId,
        warehouseId: centralWarehouse._id,
        code: 'BIN-01-A',
        aisle: 'A',
        rack: '01',
        shelf: 'A',
        bin: '01',
        isDefault: true,
        isActive: true,
      });
      await defaultBin.save({ session });
      binsCreated++;
    }

    return { uomsCreated, categoriesCreated, warehousesCreated, binsCreated };
  }

  // ==========================================
  // UNITS OF MEASURE
  // ==========================================

  async listUoms(companyId: string, context: TenantContext): Promise<any[]> {
    validateTenantAccess(context, companyId);
    return UnitOfMeasure.find({ companyId: new Types.ObjectId(companyId) })
      .sort({ category: 1, isBaseUnit: -1, code: 1 })
      .lean();
  }

  async createUom(companyId: string, data: any, context: TenantContext): Promise<any> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    const existing = await UnitOfMeasure.findOne({ companyId: companyObjId, code: data.code.trim().toUpperCase() });
    if (existing) {
      throw new InventoryValidationError(`UoM code "${data.code}" already exists.`);
    }

    const doc = new UnitOfMeasure({
      ...data,
      companyId: companyObjId,
      code: data.code.trim().toUpperCase(),
      conversionRatio: Types.Decimal128.fromString(data.conversionRatio ? String(data.conversionRatio) : '1.0000'),
    });
    return doc.save();
  }

  async updateUom(companyId: string, id: string, data: any, context: TenantContext): Promise<any> {
    validateTenantAccess(context, companyId);
    const updatePayload = { ...data };
    if (data.conversionRatio !== undefined) {
      updatePayload.conversionRatio = Types.Decimal128.fromString(String(data.conversionRatio));
    }
    return UnitOfMeasure.findOneAndUpdate(
      { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) },
      { $set: updatePayload },
      { new: true }
    );
  }

  // ==========================================
  // CATEGORIES & BRANDS
  // ==========================================

  async listCategories(companyId: string, context: TenantContext): Promise<any[]> {
    validateTenantAccess(context, companyId);
    return ItemCategory.find({ companyId: new Types.ObjectId(companyId) })
      .sort({ code: 1 })
      .lean();
  }

  async createCategory(companyId: string, data: any, context: TenantContext): Promise<any> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    const existing = await ItemCategory.findOne({ companyId: companyObjId, code: data.code.trim().toUpperCase() });
    if (existing) {
      throw new InventoryValidationError(`Category code "${data.code}" already exists.`);
    }

    const doc = new ItemCategory({
      ...data,
      companyId: companyObjId,
      code: data.code.trim().toUpperCase(),
    });
    return doc.save();
  }

  async listBrands(companyId: string, context: TenantContext): Promise<any[]> {
    validateTenantAccess(context, companyId);
    return ItemBrand.find({ companyId: new Types.ObjectId(companyId) })
      .sort({ name: 1 })
      .lean();
  }

  async createBrand(companyId: string, data: any, context: TenantContext): Promise<any> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    const existing = await ItemBrand.findOne({ companyId: companyObjId, code: data.code.trim().toUpperCase() });
    if (existing) {
      throw new InventoryValidationError(`Brand code "${data.code}" already exists.`);
    }

    const doc = new ItemBrand({
      ...data,
      companyId: companyObjId,
      code: data.code.trim().toUpperCase(),
    });
    return doc.save();
  }

  // ==========================================
  // WAREHOUSES & BINS
  // ==========================================

  async listWarehouses(companyId: string, context: TenantContext): Promise<any[]> {
    validateTenantAccess(context, companyId);
    return Warehouse.find({ companyId: new Types.ObjectId(companyId) })
      .sort({ isDefault: -1, code: 1 })
      .lean();
  }

  async createWarehouse(companyId: string, data: any, context: TenantContext): Promise<any> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    const existing = await Warehouse.findOne({ companyId: companyObjId, code: data.code.trim().toUpperCase() });
    if (existing) {
      throw new InventoryValidationError(`Warehouse code "${data.code}" already exists.`);
    }

    const doc = new Warehouse({
      ...data,
      companyId: companyObjId,
      code: data.code.trim().toUpperCase(),
    });
    const saved = await doc.save();

    // Auto-create default primary bin for warehouse
    const defaultBin = new WarehouseBin({
      companyId: companyObjId,
      warehouseId: saved._id,
      code: `${saved.code}-BIN-01`,
      isDefault: true,
      isActive: true,
    });
    await defaultBin.save();

    return saved;
  }

  async listBins(companyId: string, warehouseId: string, context: TenantContext): Promise<any[]> {
    validateTenantAccess(context, companyId);
    return WarehouseBin.find({
      companyId: new Types.ObjectId(companyId),
      warehouseId: new Types.ObjectId(warehouseId),
    })
      .sort({ isDefault: -1, code: 1 })
      .lean();
  }

  async createBin(companyId: string, data: any, context: TenantContext): Promise<any> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    const existing = await WarehouseBin.findOne({
      companyId: companyObjId,
      warehouseId: new Types.ObjectId(data.warehouseId),
      code: data.code.trim().toUpperCase(),
    });
    if (existing) {
      throw new InventoryValidationError(`Bin code "${data.code}" already exists in this warehouse.`);
    }

    const doc = new WarehouseBin({
      ...data,
      companyId: companyObjId,
      warehouseId: new Types.ObjectId(data.warehouseId),
      code: data.code.trim().toUpperCase(),
    });
    return doc.save();
  }

  // ==========================================
  // ITEM MASTER
  // ==========================================

  async listItems(
    companyId: string,
    query: { search?: string; categoryId?: string; type?: string; limit?: number; offset?: number },
    context: TenantContext
  ): Promise<{ items: any[]; total: number }> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    const filter: any = { companyId: companyObjId };
    if (query.type) {
      filter.type = query.type;
    }
    if (query.categoryId && Types.ObjectId.isValid(query.categoryId)) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }
    if (query.search) {
      const q = query.search.trim();
      filter.$or = [
        { sku: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { barcode: { $regex: q, $options: 'i' } },
      ];
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const [items, total] = await Promise.all([
      Item.find(filter)
        .populate('categoryId', 'name code')
        .populate('brandId', 'name code')
        .populate('baseUomId', 'code name precision')
        .sort({ updatedAt: -1, sku: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Item.countDocuments(filter),
    ]);

    // Enhance with stock balances if stockable item
    const itemIds = items.map((i: any) => i._id);
    const balances = await StockBalance.find({
      companyId: companyObjId,
      itemId: { $in: itemIds },
    }).lean();

    const balanceMap = new Map<string, { onHand: number; reserved: number; available: number }>();
    for (const b of balances) {
      const key = b.itemId.toString();
      const current = balanceMap.get(key) || { onHand: 0, reserved: 0, available: 0 };
      const onHand = parseFloat(b.onHandQty ? b.onHandQty.toString() : '0');
      const reserved = parseFloat(b.reservedQty ? b.reservedQty.toString() : '0');
      const available = parseFloat(b.availableQty ? b.availableQty.toString() : '0');
      balanceMap.set(key, {
        onHand: current.onHand + onHand,
        reserved: current.reserved + reserved,
        available: current.available + available,
      });
    }

    const enrichedItems = items.map((item: any) => {
      const bal = balanceMap.get(item._id.toString()) || { onHand: 0, reserved: 0, available: 0 };
      return {
        ...item,
        quantityOnHand: bal.onHand,
        quantityReserved: bal.reserved,
        quantityAvailable: bal.available,
        purchaseCost: item.purchaseCost ? item.purchaseCost.toString() : '0.00',
        sellingPrice: item.sellingPrice ? item.sellingPrice.toString() : '0.00',
        reorderLevel: item.reorderLevel ? item.reorderLevel.toString() : '0.00',
        reorderQuantity: item.reorderQuantity ? item.reorderQuantity.toString() : '0.00',
      };
    });

    return { items: enrichedItems, total };
  }

  async getItemById(companyId: string, id: string, context: TenantContext): Promise<any> {
    validateTenantAccess(context, companyId);
    const item = await Item.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    })
      .populate('categoryId', 'name code')
      .populate('brandId', 'name code')
      .populate('baseUomId', 'code name precision')
      .lean();

    if (!item) return null;

    const balances = await StockBalance.find({
      companyId: new Types.ObjectId(companyId),
      itemId: item._id,
    })
      .populate('warehouseId', 'code name')
      .populate('binId', 'code')
      .lean();

    return {
      ...item,
      purchaseCost: item.purchaseCost ? item.purchaseCost.toString() : '0.00',
      sellingPrice: item.sellingPrice ? item.sellingPrice.toString() : '0.00',
      reorderLevel: item.reorderLevel ? item.reorderLevel.toString() : '0.00',
      reorderQuantity: item.reorderQuantity ? item.reorderQuantity.toString() : '0.00',
      balances: balances.map((b: any) => ({
        ...b,
        quantityOnHand: b.onHandQty ? b.onHandQty.toString() : '0',
        quantityReserved: b.reservedQty ? b.reservedQty.toString() : '0',
        quantityAvailable: b.availableQty ? b.availableQty.toString() : '0',
        totalValuation: b.totalValuation ? b.totalValuation.toString() : '0.00',
      })),
    };
  }

  async createItem(companyId: string, data: any, context: TenantContext): Promise<any> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    const existingSku = await Item.findOne({ companyId: companyObjId, sku: data.sku.trim().toUpperCase() });
    if (existingSku) {
      throw new InventoryValidationError(`Item with SKU "${data.sku}" already exists.`);
    }

    if (data.barcode && data.barcode.trim()) {
      const existingBarcode = await Item.findOne({ companyId: companyObjId, barcode: data.barcode.trim() });
      if (existingBarcode) {
        throw new InventoryValidationError(`Item with barcode "${data.barcode}" already exists.`);
      }
    }

    const doc = new Item({
      ...data,
      companyId: companyObjId,
      sku: data.sku.trim().toUpperCase(),
      purchaseCost: Types.Decimal128.fromString(data.purchaseCost ? String(data.purchaseCost) : '0.00'),
      sellingPrice: Types.Decimal128.fromString(data.sellingPrice ? String(data.sellingPrice) : '0.00'),
      reorderLevel: Types.Decimal128.fromString(data.reorderLevel ? String(data.reorderLevel) : '0.00'),
      reorderQuantity: Types.Decimal128.fromString(data.reorderQuantity ? String(data.reorderQuantity) : '0.00'),
      categoryId: new Types.ObjectId(data.categoryId),
      brandId: data.brandId ? new Types.ObjectId(data.brandId) : null,
      baseUomId: new Types.ObjectId(data.baseUomId),
    });

    const saved = await doc.save();

    // If initial stock was provided, create initial stock balance in default warehouse
    if (data.initialStock && parseFloat(String(data.initialStock)) > 0) {
      const defaultWh = await Warehouse.findOne({ companyId: companyObjId, isDefault: true }) ||
        await Warehouse.findOne({ companyId: companyObjId });

      if (defaultWh) {
        const defaultBin = await WarehouseBin.findOne({ companyId: companyObjId, warehouseId: defaultWh._id, isDefault: true });
        const qtyDec = toDecimal(data.initialStock);
        const costDec = toDecimal(data.purchaseCost || '0.00');
        const totalValuation = roundHalfEven(qtyDec.mul(costDec));

        const balance = new StockBalance({
          companyId: companyObjId,
          warehouseId: defaultWh._id,
          itemId: saved._id,
          binId: defaultBin ? defaultBin._id : null,
          onHandQty: Types.Decimal128.fromString(qtyDec.toString()),
          availableQty: Types.Decimal128.fromString(qtyDec.toString()),
          reservedQty: Types.Decimal128.fromString('0.00'),
          onOrderQty: Types.Decimal128.fromString('0.00'),
          averageUnitCost: Types.Decimal128.fromString(costDec.toString()),
          totalValuation: Types.Decimal128.fromString(totalValuation.toString()),
        });
        await balance.save();

        // Record stock movement
        const movement = new StockMovement({
          companyId: companyObjId,
          movementNumber: `MOV-${Date.now()}`,
          movementType: 'OPENING_BALANCE',
          itemId: saved._id,
          warehouseId: defaultWh._id,
          binId: defaultBin ? defaultBin._id : null,
          quantity: Types.Decimal128.fromString(qtyDec.toString()),
          unitCost: Types.Decimal128.fromString(costDec.toString()),
          totalCost: Types.Decimal128.fromString(totalValuation.toString()),
          runningBalance: Types.Decimal128.fromString(qtyDec.toString()),
          referenceType: 'MANUAL',
          referenceNumber: 'INITIAL_IMPORT',
          notes: 'Opening stock balance',
        });
        await movement.save();
        invalidateCompanyDashboardCache(companyId);
      }
    }

    return saved;
  }

  // ==========================================
  // STOCK ON HAND & VALUATION OVERVIEW
  // ==========================================

  async getStockBalances(
    companyId: string,
    filters: { warehouseId?: string; itemId?: string },
    context: TenantContext
  ): Promise<any[]> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    const query: any = { companyId: companyObjId };
    if (filters.warehouseId && Types.ObjectId.isValid(filters.warehouseId)) {
      query.warehouseId = new Types.ObjectId(filters.warehouseId);
    }
    if (filters.itemId && Types.ObjectId.isValid(filters.itemId)) {
      query.itemId = new Types.ObjectId(filters.itemId);
    }

    const balances = await StockBalance.find(query)
      .populate('itemId', 'sku name barcode type purchaseCost sellingPrice reorderLevel')
      .populate('warehouseId', 'code name')
      .populate('binId', 'code aisle rack shelf')
      .sort({ updatedAt: -1 })
      .lean();

    return balances.map((b: any) => ({
      ...b,
      quantityOnHand: b.onHandQty ? b.onHandQty.toString() : '0',
      quantityReserved: b.reservedQty ? b.reservedQty.toString() : '0',
      quantityAvailable: b.availableQty ? b.availableQty.toString() : '0',
      averageUnitCost: b.averageUnitCost ? b.averageUnitCost.toString() : '0.00',
      totalValuation: b.totalValuation ? b.totalValuation.toString() : '0.00',
    }));
  }

  async getInventoryOverviewStats(companyId: string, context: TenantContext): Promise<any> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    const [
      totalItems,
      stockableItems,
      serviceItems,
      warehouses,
      categories,
      balances,
      recentMovements,
    ] = await Promise.all([
      Item.countDocuments({ companyId: companyObjId }),
      Item.countDocuments({ companyId: companyObjId, type: 'INVENTORY' }),
      Item.countDocuments({ companyId: companyObjId, type: 'SERVICE' }),
      Warehouse.find({ companyId: companyObjId }).lean(),
      ItemCategory.find({ companyId: companyObjId }).lean(),
      StockBalance.find({ companyId: companyObjId }).populate('warehouseId', 'name code').lean(),
      StockMovement.find({ companyId: companyObjId }).sort({ movementDate: -1 }).limit(10).populate('itemId', 'name sku').lean(),
    ]);

    // Calculate total valuation
    let totalValuation = toDecimal(0);
    let lowStockCount = 0;
    const warehouseValMap = new Map<string, { code: string; name: string; valuation: number; count: number }>();

    for (const w of warehouses) {
      warehouseValMap.set(w._id.toString(), {
        code: w.code,
        name: w.name,
        valuation: 0,
        count: 0,
      });
    }

    for (const b of balances) {
      const valStr = b.totalValuation ? b.totalValuation.toString() : '0.00';
      const balVal = toDecimal(valStr);
      totalValuation = totalValuation.plus(balVal);

      const whId = b.warehouseId?._id ? b.warehouseId._id.toString() : b.warehouseId?.toString();
      if (whId && warehouseValMap.has(whId)) {
        const current = warehouseValMap.get(whId)!;
        current.valuation += parseFloat(valStr);
        current.count += 1;
      }
    }

    // Format warehouse valuation chart data
    const warehouseChartData = Array.from(warehouseValMap.values()).map((wh) => ({
      name: wh.code,
      fullName: wh.name,
      amount: parseFloat(wh.valuation.toFixed(2)),
      count: wh.count,
    }));

    return {
      totalItems,
      stockableItems,
      serviceItems,
      activeWarehouses: warehouses.length,
      lowStockCount,
      totalValuation: roundHalfEven(totalValuation).toFixed(2),
      warehouseChartData,
      categoriesCount: categories.length,
      recentMovements: recentMovements.map((m: any) => ({
        ...m,
        quantity: m.quantity ? m.quantity.toString() : '0',
        unitCost: m.unitCost ? m.unitCost.toString() : '0.00',
        totalCost: m.totalCost ? m.totalCost.toString() : '0.00',
      })),
    };
  }

  // ==========================================
  // STOCK TRANSFERS
  // ==========================================

  async listTransfers(companyId: string, context: TenantContext): Promise<any[]> {
    validateTenantAccess(context, companyId);
    return StockTransfer.find({ companyId: new Types.ObjectId(companyId) })
      .populate('sourceWarehouseId', 'code name')
      .populate('destinationWarehouseId', 'code name')
      .populate('lines.itemId', 'sku name')
      .sort({ createdAt: -1 })
      .lean();
  }

  async createTransfer(companyId: string, data: any, context: TenantContext): Promise<any> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    const count = await StockTransfer.countDocuments({ companyId: companyObjId });
    const transferNumber = `TRF-${String(count + 1).padStart(5, '0')}`;

    const formattedLines = (data.lines || []).map((line: any) => ({
      itemId: new Types.ObjectId(line.itemId),
      sourceBinId: line.sourceBinId ? new Types.ObjectId(line.sourceBinId) : null,
      destinationBinId: line.destinationBinId ? new Types.ObjectId(line.destinationBinId) : null,
      quantity: Types.Decimal128.fromString(String(line.quantity || '1')),
      unitCost: Types.Decimal128.fromString(String(line.unitCost || '0.00')),
      totalCost: Types.Decimal128.fromString(
        roundHalfEven(toDecimal(line.quantity || '1').mul(toDecimal(line.unitCost || '0.00'))).toString()
      ),
      notes: line.notes || null,
    }));

    const doc = new StockTransfer({
      companyId: companyObjId,
      transferNumber,
      sourceWarehouseId: new Types.ObjectId(data.sourceWarehouseId),
      destinationWarehouseId: new Types.ObjectId(data.destinationWarehouseId),
      transferDate: data.transferDate ? new Date(data.transferDate) : new Date(),
      status: 'DRAFT',
      notes: data.notes || null,
      lines: formattedLines,
    });

    return doc.save();
  }
}

export const inventoryMasterService = new InventoryMasterService();
