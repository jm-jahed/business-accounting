import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  inventoryMasterService,
  InventoryValidationError,
  TenantContext,
  AuditLog,
} from '@accounting/database';
import { JwtUserPayload } from '../auth/jwt.service.js';

interface RequestMetadata {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class InventoryService {
  async initializeStandardMaster(
    tenant: TenantContext,
    user: JwtUserPayload,
    meta?: RequestMetadata
  ) {
    try {
      const result = await inventoryMasterService.initializeStandardInventoryMaster(tenant.companyId, tenant);

      await AuditLog.create({
        actorId: user.sub,
        actorEmail: user.email || '',
        action: 'inventory.standard_initialized',
        targetType: 'InventoryMaster',
        targetId: tenant.companyId,
        companyId: new Types.ObjectId(tenant.companyId),
        outcome: 'success',
        ipAddress: meta?.ip || '',
        userAgent: meta?.userAgent || '',
        metadata: { ...result },
      });

      return {
        success: true,
        message: 'Standard inventory baseline successfully initialized.',
        data: result,
      };
    } catch (err: any) {
      if (err instanceof InventoryValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  async getOverviewStats(tenant: TenantContext) {
    return inventoryMasterService.getInventoryOverviewStats(tenant.companyId, tenant);
  }

  // UOMs
  async listUoms(tenant: TenantContext) {
    return inventoryMasterService.listUoms(tenant.companyId, tenant);
  }

  async createUom(tenant: TenantContext, user: JwtUserPayload, data: any, meta?: RequestMetadata) {
    try {
      const uom = await inventoryMasterService.createUom(tenant.companyId, data, tenant);
      await AuditLog.create({
        actorId: user.sub,
        actorEmail: user.email || '',
        action: 'uom.created',
        targetType: 'UnitOfMeasure',
        targetId: uom._id.toString(),
        companyId: new Types.ObjectId(tenant.companyId),
        outcome: 'success',
        ipAddress: meta?.ip || '',
        userAgent: meta?.userAgent || '',
        metadata: { code: uom.code, name: uom.name },
      });
      return uom;
    } catch (err: any) {
      if (err instanceof InventoryValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  // Categories & Brands
  async listCategories(tenant: TenantContext) {
    return inventoryMasterService.listCategories(tenant.companyId, tenant);
  }

  async createCategory(tenant: TenantContext, user: JwtUserPayload, data: any, meta?: RequestMetadata) {
    try {
      const cat = await inventoryMasterService.createCategory(tenant.companyId, data, tenant);
      await AuditLog.create({
        actorId: user.sub,
        actorEmail: user.email || '',
        action: 'category.created',
        targetType: 'ItemCategory',
        targetId: cat._id.toString(),
        companyId: new Types.ObjectId(tenant.companyId),
        outcome: 'success',
        ipAddress: meta?.ip || '',
        userAgent: meta?.userAgent || '',
        metadata: { code: cat.code, name: cat.name },
      });
      return cat;
    } catch (err: any) {
      if (err instanceof InventoryValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  async listBrands(tenant: TenantContext) {
    return inventoryMasterService.listBrands(tenant.companyId, tenant);
  }

  async createBrand(tenant: TenantContext, user: JwtUserPayload, data: any, meta?: RequestMetadata) {
    try {
      const brand = await inventoryMasterService.createBrand(tenant.companyId, data, tenant);
      await AuditLog.create({
        actorId: user.sub,
        actorEmail: user.email || '',
        action: 'brand.created',
        targetType: 'ItemBrand',
        targetId: brand._id.toString(),
        companyId: new Types.ObjectId(tenant.companyId),
        outcome: 'success',
        ipAddress: meta?.ip || '',
        userAgent: meta?.userAgent || '',
        metadata: { code: brand.code, name: brand.name },
      });
      return brand;
    } catch (err: any) {
      if (err instanceof InventoryValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  // Warehouses & Bins
  async listWarehouses(tenant: TenantContext) {
    return inventoryMasterService.listWarehouses(tenant.companyId, tenant);
  }

  async createWarehouse(tenant: TenantContext, user: JwtUserPayload, data: any, meta?: RequestMetadata) {
    try {
      const wh = await inventoryMasterService.createWarehouse(tenant.companyId, data, tenant);
      await AuditLog.create({
        actorId: user.sub,
        actorEmail: user.email || '',
        action: 'warehouse.created',
        targetType: 'Warehouse',
        targetId: wh._id.toString(),
        companyId: new Types.ObjectId(tenant.companyId),
        outcome: 'success',
        ipAddress: meta?.ip || '',
        userAgent: meta?.userAgent || '',
        metadata: { code: wh.code, name: wh.name },
      });
      return wh;
    } catch (err: any) {
      if (err instanceof InventoryValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  async listBins(tenant: TenantContext, warehouseId: string) {
    return inventoryMasterService.listBins(tenant.companyId, warehouseId, tenant);
  }

  async createBin(tenant: TenantContext, user: JwtUserPayload, data: any, meta?: RequestMetadata) {
    try {
      const bin = await inventoryMasterService.createBin(tenant.companyId, data, tenant);
      await AuditLog.create({
        actorId: user.sub,
        actorEmail: user.email || '',
        action: 'bin.created',
        targetType: 'WarehouseBin',
        targetId: bin._id.toString(),
        companyId: new Types.ObjectId(tenant.companyId),
        outcome: 'success',
        ipAddress: meta?.ip || '',
        userAgent: meta?.userAgent || '',
        metadata: { code: bin.code },
      });
      return bin;
    } catch (err: any) {
      if (err instanceof InventoryValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  // Items
  async listItems(tenant: TenantContext, query: any) {
    return inventoryMasterService.listItems(tenant.companyId, query, tenant);
  }

  async getItemById(tenant: TenantContext, id: string) {
    const item = await inventoryMasterService.getItemById(tenant.companyId, id, tenant);
    if (!item) {
      throw new NotFoundException(`Item not found.`);
    }
    return item;
  }

  async createItem(tenant: TenantContext, user: JwtUserPayload, data: any, meta?: RequestMetadata) {
    try {
      const item = await inventoryMasterService.createItem(tenant.companyId, data, tenant);
      await AuditLog.create({
        actorId: user.sub,
        actorEmail: user.email || '',
        action: 'item.created',
        targetType: 'Item',
        targetId: item._id.toString(),
        companyId: new Types.ObjectId(tenant.companyId),
        outcome: 'success',
        ipAddress: meta?.ip || '',
        userAgent: meta?.userAgent || '',
        metadata: { sku: item.sku, name: item.name },
      });
      return item;
    } catch (err: any) {
      if (err instanceof InventoryValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  // Stock Balances
  async getStockBalances(tenant: TenantContext, filters: { warehouseId?: string; itemId?: string }) {
    return inventoryMasterService.getStockBalances(tenant.companyId, filters, tenant);
  }

  // Stock Transfers
  async listTransfers(tenant: TenantContext) {
    return inventoryMasterService.listTransfers(tenant.companyId, tenant);
  }

  async createTransfer(tenant: TenantContext, user: JwtUserPayload, data: any, meta?: RequestMetadata) {
    try {
      const transfer = await inventoryMasterService.createTransfer(tenant.companyId, data, tenant);
      await AuditLog.create({
        actorId: user.sub,
        actorEmail: user.email || '',
        action: 'transfer.created',
        targetType: 'StockTransfer',
        targetId: transfer._id.toString(),
        companyId: new Types.ObjectId(tenant.companyId),
        outcome: 'success',
        ipAddress: meta?.ip || '',
        userAgent: meta?.userAgent || '',
        metadata: { transferNumber: transfer.transferNumber },
      });
      return transfer;
    } catch (err: any) {
      if (err instanceof InventoryValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }
}
