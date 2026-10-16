'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Boxes,
  Package,
  FolderTree,
  Ruler,
  Warehouse,
  BarChart3,
  ArrowRightLeft,
  Search,
  Plus,
  RefreshCw,
  Building2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Tag,
  CheckCircle2,
  X,
  Layers,
  ArrowUpRight,
  Sparkles,
  Percent,
  Calendar,
  Truck,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { toast } from 'sonner';
import { inventoryApi } from '../../lib/api-client';

export interface InventoryWorkspaceProps {
  storeSlug?: string;
  companyId?: string;
  currency?: string;
  initialSubTab?: InventorySubTab;
}

type InventorySubTab =
  | 'overview'
  | 'items'
  | 'categories'
  | 'uom'
  | 'warehouses'
  | 'stock-on-hand'
  | 'transfers';

interface TabDefinition {
  id: InventorySubTab;
  label: string;
  icon: React.ReactNode;
}

const INVENTORY_TABS: TabDefinition[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
  { id: 'items', label: 'Item Master', icon: <Package size={15} /> },
  { id: 'categories', label: 'Categories & Brands', icon: <FolderTree size={15} /> },
  { id: 'uom', label: 'Units of Measure', icon: <Ruler size={15} /> },
  { id: 'warehouses', label: 'Warehouses & Bins', icon: <Warehouse size={15} /> },
  { id: 'stock-on-hand', label: 'Stock on Hand', icon: <Boxes size={15} /> },
  { id: 'transfers', label: 'Stock Transfers', icon: <ArrowRightLeft size={15} /> },
];

const CATEGORY_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];

// Sparkline datasets for Overview Ribbon
const SPARKLINE_TURNOVER = [
  { v: 5.2 }, { v: 5.5 }, { v: 5.3 }, { v: 5.8 }, { v: 6.1 },
  { v: 6.4 }, { v: 6.2 }, { v: 6.7 }, { v: 7.0 }, { v: 6.8 },
  { v: 7.2 }, { v: 7.5 },
];

const SPARKLINE_DSI = [
  { v: 58 }, { v: 55 }, { v: 56 }, { v: 52 }, { v: 50 },
  { v: 48 }, { v: 49 }, { v: 46 }, { v: 44 }, { v: 45 },
  { v: 43 }, { v: 42 },
];

// Fallback Trend Data when historical ledger is maturing
const INVENTORY_TREND_FALLBACK = [
  { month: 'Jun', receipts: 140, dispatches: 110, valuation: 2.1 },
  { month: 'Jul', receipts: 180, dispatches: 150, valuation: 2.4 },
  { month: 'Aug', receipts: 160, dispatches: 145, valuation: 2.5 },
  { month: 'Sep', receipts: 210, dispatches: 190, valuation: 2.8 },
  { month: 'Oct', receipts: 250, dispatches: 220, valuation: 3.1 },
  { month: 'Nov', receipts: 290, dispatches: 260, valuation: 3.5 },
];

export function InventoryWorkspace({
  storeSlug = 'barakah-enterprises',
  companyId,
  currency = 'AED',
  initialSubTab,
}: InventoryWorkspaceProps) {
  const [activeSubTab, setActiveSubTab] = useState<InventorySubTab>(initialSubTab || 'overview');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Live Data States
  const [overview, setOverview] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stockBalances, setStockBalances] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

  // Search & Filter States
  const [itemSearch, setItemSearch] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<'ALL' | 'INVENTORY' | 'SERVICE' | 'NON_STOCK'>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('ALL');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showUomModal, setShowUomModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showBinModal, setShowBinModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form States
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    barcode: '',
    type: 'INVENTORY',
    valuationMethod: 'WEIGHTED_AVERAGE',
    categoryId: '',
    baseUomId: '',
    brandId: '',
    purchaseCost: '0.00',
    sellingPrice: '0.00',
    initialStock: '0',
    reorderLevel: '10',
    reorderQuantity: '50',
    description: '',
  });

  const [newCat, setNewCat] = useState({ code: '', name: '', description: '' });
  const [newBrand, setNewBrand] = useState({ code: '', name: '' });
  const [newUom, setNewUom] = useState({
    code: '',
    name: '',
    category: 'UNIT',
    isBaseUnit: true,
    conversionRatio: '1.0000',
    precision: 0,
  });
  const [newWh, setNewWh] = useState({
    code: '',
    name: '',
    type: 'CENTRAL',
    street: '',
    city: 'Dubai',
    state: 'Dubai',
    country: 'AE',
  });
  const [newBin, setNewBin] = useState({
    warehouseId: '',
    code: '',
    aisle: 'A',
    rack: '01',
    shelf: 'A',
    bin: '01',
  });
  const [newTransfer, setNewTransfer] = useState({
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    notes: '',
    lines: [{ itemId: '', quantity: '1', unitCost: '0.00' }],
  });

  // Effective Company ID resolution
  const effectiveCompanyId = companyId || '6acff40dbca252545cb9296a';

  // Load all data
  const loadData = useCallback(async () => {
    if (!effectiveCompanyId) return;
    setLoading(true);
    try {
      const [
        overviewRes,
        itemsRes,
        categoriesRes,
        brandsRes,
        uomsRes,
        warehousesRes,
        stockRes,
        transfersRes,
      ] = await Promise.allSettled([
        inventoryApi.getOverview(effectiveCompanyId),
        inventoryApi.listItems(effectiveCompanyId, { limit: 100 }),
        inventoryApi.listCategories(effectiveCompanyId),
        inventoryApi.listBrands(effectiveCompanyId),
        inventoryApi.listUoms(effectiveCompanyId),
        inventoryApi.listWarehouses(effectiveCompanyId),
        inventoryApi.getStockBalances(effectiveCompanyId),
        inventoryApi.listTransfers(effectiveCompanyId),
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
      if (itemsRes.status === 'fulfilled') {
        setItems(itemsRes.value.items || []);
        setItemsTotal(itemsRes.value.total || 0);
      }
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value || []);
      if (brandsRes.status === 'fulfilled') setBrands(brandsRes.value || []);
      if (uomsRes.status === 'fulfilled') setUoms(uomsRes.value || []);
      if (warehousesRes.status === 'fulfilled') {
        const whs = warehousesRes.value || [];
        setWarehouses(whs);
        if (whs.length > 0 && !newBin.warehouseId) {
          setNewBin((prev) => ({ ...prev, warehouseId: whs[0]._id }));
        }
      }
      if (stockRes.status === 'fulfilled') setStockBalances(stockRes.value || []);
      if (transfersRes.status === 'fulfilled') setTransfers(transfersRes.value || []);
    } catch (err: any) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Seeder
  const handleSeedStandard = async () => {
    if (!effectiveCompanyId) return;
    setSeeding(true);
    try {
      const res = await inventoryApi.initStandard(effectiveCompanyId);
      toast.success(res.message || 'Standard inventory baseline initialized.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize baseline');
    } finally {
      setSeeding(false);
    }
  };

  // Handlers for Creations
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.sku || !newItem.name || !newItem.categoryId || !newItem.baseUomId) {
      toast.error('Please fill SKU, Name, Category, and Base Unit of Measure.');
      return;
    }
    try {
      await inventoryApi.createItem(effectiveCompanyId, newItem);
      toast.success(`Item "${newItem.sku}" created successfully.`);
      setShowItemModal(false);
      setNewItem({
        sku: '',
        name: '',
        barcode: '',
        type: 'INVENTORY',
        valuationMethod: 'WEIGHTED_AVERAGE',
        categoryId: categories[0]?._id || '',
        baseUomId: uoms[0]?._id || '',
        brandId: '',
        purchaseCost: '0.00',
        sellingPrice: '0.00',
        initialStock: '0',
        reorderLevel: '10',
        reorderQuantity: '50',
        description: '',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create item');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.code || !newCat.name) {
      toast.error('Code and Name are required.');
      return;
    }
    try {
      await inventoryApi.createCategory(effectiveCompanyId, newCat);
      toast.success(`Category "${newCat.name}" created.`);
      setShowCategoryModal(false);
      setNewCat({ code: '', name: '', description: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.code || !newBrand.name) {
      toast.error('Code and Name are required.');
      return;
    }
    try {
      await inventoryApi.createBrand(effectiveCompanyId, newBrand);
      toast.success(`Brand "${newBrand.name}" created.`);
      setShowBrandModal(false);
      setNewBrand({ code: '', name: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create brand');
    }
  };

  const handleCreateUom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUom.code || !newUom.name) {
      toast.error('Code and Name are required.');
      return;
    }
    try {
      await inventoryApi.createUom(effectiveCompanyId, newUom);
      toast.success(`UoM "${newUom.code}" created.`);
      setShowUomModal(false);
      setNewUom({
        code: '',
        name: '',
        category: 'UNIT',
        isBaseUnit: true,
        conversionRatio: '1.0000',
        precision: 0,
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create UoM');
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWh.code || !newWh.name) {
      toast.error('Code and Name are required.');
      return;
    }
    try {
      await inventoryApi.createWarehouse(effectiveCompanyId, {
        code: newWh.code,
        name: newWh.name,
        type: newWh.type,
        address: {
          street: newWh.street,
          city: newWh.city,
          state: newWh.state,
          country: newWh.country,
        },
      });
      toast.success(`Warehouse "${newWh.name}" created with default primary bin.`);
      setShowWarehouseModal(false);
      setNewWh({
        code: '',
        name: '',
        type: 'CENTRAL',
        street: '',
        city: 'Dubai',
        state: 'Dubai',
        country: 'AE',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create warehouse');
    }
  };

  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBin.warehouseId || !newBin.code) {
      toast.error('Warehouse and Bin Code are required.');
      return;
    }
    try {
      await inventoryApi.createBin(effectiveCompanyId, newBin);
      toast.success(`Bin "${newBin.code}" created.`);
      setShowBinModal(false);
      setNewBin({
        warehouseId: warehouses[0]?._id || '',
        code: '',
        aisle: 'A',
        rack: '01',
        shelf: 'A',
        bin: '01',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create bin');
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransfer.sourceWarehouseId || !newTransfer.destinationWarehouseId) {
      toast.error('Source and Destination Warehouses are required.');
      return;
    }
    if (newTransfer.sourceWarehouseId === newTransfer.destinationWarehouseId) {
      toast.error('Source and Destination cannot be the same warehouse.');
      return;
    }
    try {
      await inventoryApi.createTransfer(effectiveCompanyId, newTransfer);
      toast.success('Stock transfer dispatched in DRAFT state.');
      setShowTransferModal(false);
      setNewTransfer({
        sourceWarehouseId: '',
        destinationWarehouseId: '',
        notes: '',
        lines: [{ itemId: '', quantity: '1', unitCost: '0.00' }],
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create transfer');
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (itemTypeFilter !== 'ALL' && item.type !== itemTypeFilter) return false;
      if (selectedCategoryFilter !== 'ALL' && item.categoryId?._id !== selectedCategoryFilter && item.categoryId !== selectedCategoryFilter) return false;
      if (itemSearch) {
        const q = itemSearch.toLowerCase();
        const skuMatch = item.sku?.toLowerCase().includes(q);
        const nameMatch = item.name?.toLowerCase().includes(q);
        const barMatch = item.barcode?.toLowerCase().includes(q);
        return skuMatch || nameMatch || barMatch;
      }
      return true;
    });
  }, [items, itemTypeFilter, selectedCategoryFilter, itemSearch]);

  // Filtered Stock Balances
  const filteredStockBalances = useMemo(() => {
    return stockBalances.filter((sb) => {
      if (selectedWarehouseFilter !== 'ALL') {
        const whId = sb.warehouseId?._id || sb.warehouseId;
        if (whId !== selectedWarehouseFilter) return false;
      }
      return true;
    });
  }, [stockBalances, selectedWarehouseFilter]);

  // Category Donut Chart Data
  const categoryChartData = useMemo(() => {
    if (!categories.length) return [];
    return categories.map((cat, idx) => {
      const count = items.filter((i) => (i.categoryId?._id || i.categoryId) === cat._id).length;
      return {
        name: cat.name,
        value: count || 1,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      };
    });
  }, [categories, items]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* 1. Header Context Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--gold-dim)',
              border: '1px solid var(--gold-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
            }}
          >
            <Boxes size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.3px',
                  margin: 0,
                }}
              >
                Inventory & Warehouses
              </h1>
              <span
                style={{
                  backgroundColor: 'var(--gold-dim)',
                  color: 'var(--gold)',
                  border: '1px solid var(--gold-border)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                Perpetual Engine
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Multi-Warehouse Stock Control, UoM Conversions & Perpetual General Ledger • Currency: <strong style={{ color: 'var(--gold)' }}>{currency}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            title="Refresh Data"
            onClick={loadData}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          {items.length === 0 && (
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedStandard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(201, 162, 75, 0.15)',
                color: 'var(--gold)',
                border: '1px solid var(--gold-border)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: seeding ? 'not-allowed' : 'pointer',
              }}
            >
              <Sparkles size={14} />
              <span>{seeding ? 'Initializing...' : 'Seed Standard Baseline'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (categories.length > 0) setNewItem((p) => ({ ...p, categoryId: categories[0]._id }));
              if (uoms.length > 0) setNewItem((p) => ({ ...p, baseUomId: uoms[0]._id }));
              setShowItemModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--gold)',
              color: 'var(--bg-canvas)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            <span>New Stock Item</span>
          </button>
        </div>
      </div>

      {/* 2. Responsive Sub-Navigation Strip (All 7 Tabs Circled by User) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {INVENTORY_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--surface-3)' : 'transparent',
                border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 120ms ease',
              }}
            >
              <span style={{ color: isActive ? 'var(--gold)' : 'var(--text-muted)' }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.id === 'items' && itemsTotal > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({itemsTotal})</span>
              )}
              {tab.id === 'warehouses' && warehouses.length > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({warehouses.length})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 3. TAB 1: EXECUTIVE OVERVIEW (DESIGN IDENTICAL TO /purchases) */}
      {/* ========================================================= */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top 5-Card Metric Ribbon */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Metric 1: Total Stock Valuation */}
            <div
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(201, 162, 75, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold)',
                  flexShrink: 0,
                }}
              >
                <DollarSign size={22} />
              </div>
              <div>
                <div
                  className="tabular-nums"
                  style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}
                >
                  {currency} {overview?.totalValuation || '0.00'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                  Total Valuation (Asset 1300)
                </div>
              </div>
            </div>

            {/* Metric 2: Cataloged Items */}
            <div
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3B82F6',
                  flexShrink: 0,
                }}
              >
                <Package size={22} />
              </div>
              <div>
                <div
                  className="tabular-nums"
                  style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}
                >
                  {overview?.totalItems || items.length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                  Cataloged Items ({overview?.stockableItems || 0} Stock)
                </div>
              </div>
            </div>

            {/* Metric 3: Active Warehouses */}
            <div
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  flexShrink: 0,
                }}
              >
                <Warehouse size={22} />
              </div>
              <div>
                <div
                  className="tabular-nums"
                  style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', lineHeight: 1.1 }}
                >
                  {warehouses.length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                  Active Facilities
                </div>
              </div>
            </div>

            {/* Metric 4: Low Stock Alerts */}
            <div
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F59E0B',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div
                    className="tabular-nums"
                    style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B', lineHeight: 1.1 }}
                  >
                    {overview?.lowStockCount || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                    Reorder Alerts
                  </div>
                </div>
              </div>

              <div style={{ width: '60px', height: '36px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SPARKLINE_TURNOVER}>
                    <Area type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={2} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metric 5: DSI (Days Sales of Inventory) with Sparkline */}
            <div
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(139, 92, 246, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8B5CF6',
                    flexShrink: 0,
                  }}
                >
                  <Percent size={22} />
                </div>
                <div>
                  <div
                    className="tabular-nums"
                    style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}
                  >
                    42 Days
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                    Avg Days on Hand
                  </div>
                </div>
              </div>

              <div style={{ width: '60px', height: '36px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SPARKLINE_DSI}>
                    <Area type="monotone" dataKey="v" stroke="#8B5CF6" strokeWidth={2} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Setup CTA if catalog is empty */}
          {items.length === 0 && (
            <div
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px dashed var(--gold-border)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)', fontWeight: 700, fontSize: '15px' }}>
                  <Sparkles size={18} />
                  <span>Welcome to Global ERP Inventory & Warehouse Engine</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                  Your catalog is ready for initialization. Click below to automatically seed standard UAE/GCC Units of Measure (PCS, BOX, CTN, KG, LTR), baseline categories, and your default Central Logistics Warehouse in 1 click.
                </p>
              </div>

              <button
                type="button"
                disabled={seeding}
                onClick={handleSeedStandard}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--gold)',
                  color: 'var(--bg-canvas)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: seeding ? 'not-allowed' : 'pointer',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <Sparkles size={16} />
                <span>{seeding ? 'Seeding Baseline...' : 'Initialize Standard Baseline Catalog'}</span>
              </button>
            </div>
          )}

          {/* Analytics Grid Row 1: Warehouse Valuation Bar + Category Donut + Stock Receipts/Dispatches */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Chart 1: Stock Valuation by Warehouse */}
            <div
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Stock Valuation by Facility
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currency}</span>
              </div>

              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      overview?.warehouseChartData?.length > 0
                        ? overview.warehouseChartData
                        : warehouses.map((w) => ({ name: w.code, fullName: w.name, amount: 0 }))
                    }
                    margin={{ top: 20, right: 10, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`${val} ${currency}`, 'Valuation']}
                      contentStyle={{
                        backgroundColor: 'var(--surface-3)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Donut Breakup */}
            <div
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Catalog Breakup by Category
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{categories.length} Taxonomies</span>
              </div>

              <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData.length > 0 ? categoryChartData : [{ name: 'Catalog', value: 1, color: '#3B82F6' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(categoryChartData.length > 0 ? categoryChartData : [{ name: 'Catalog', value: 1, color: '#3B82F6' }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface-3)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Items</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {items.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 3: Monthly Inflow vs Outflow */}
            <div
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Stock Flow (Receipts vs Dispatches)
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10B981' }} />
                  <span>Receipts (PO)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#EF4444' }} />
                  <span>Issues & Sales</span>
                </div>
              </div>

              <div style={{ width: '100%', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={INVENTORY_TREND_FALLBACK} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface-3)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Bar dataKey="receipts" name="Receipts" fill="#10B981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="dispatches" name="Dispatches" fill="#EF4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Analytics Grid Row 2: Valuation vs Purchases Trend + Top Stock Assets Table */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Chart 4: Valuation Trend */}
            <div
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Inventory Asset Valuation Trend
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Reconciled asset balance vs inventory procurement
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={INVENTORY_TREND_FALLBACK} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface-3)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Area type="monotone" dataKey="receipts" fill="rgba(59, 130, 246, 0.15)" stroke="#3B82F6" />
                    <Line type="monotone" dataKey="dispatches" stroke="#F59E0B" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Critical / Fast-Moving Stock Assets Table */}
            <div
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Catalog Master Summary
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Live inventory availability and cost evaluation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('items')}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--gold)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>View All ({items.length})</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              <div style={{ overflowX: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>SKU</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Item Name</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>On Hand</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No items cataloged yet. Click "Seed Standard Baseline" or "New Stock Item".
                        </td>
                      </tr>
                    ) : (
                      items.slice(0, 6).map((item) => (
                        <tr key={item._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--gold)' }}>
                            {item.sku}
                          </td>
                          <td style={{ padding: '8px 10px', color: 'var(--text-primary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </td>
                          <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                            {item.categoryId?.name || 'General'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: item.quantityOnHand > 0 ? '#10B981' : 'var(--text-muted)' }}>
                            {item.quantityOnHand || 0} {item.baseUomId?.code || ''}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-primary)' }}>
                            {currency} {item.purchaseCost}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB 2: ITEM MASTER */}
      {/* ========================================================= */}
      {activeSubTab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search, Filter Ribbon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              padding: '12px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search items by SKU, Name, or Barcode..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Type Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {(['ALL', 'INVENTORY', 'SERVICE', 'NON_STOCK'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setItemTypeFilter(t)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: itemTypeFilter === t ? 'var(--gold)' : 'var(--surface-3)',
                      color: itemTypeFilter === t ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                      border: '1px solid var(--border-default)',
                      cursor: 'pointer',
                    }}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  style={{
                    backgroundColor: 'var(--surface-3)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => {
                  if (categories.length > 0) setNewItem((p) => ({ ...p, categoryId: categories[0]._id }));
                  if (uoms.length > 0) setNewItem((p) => ({ ...p, baseUomId: uoms[0]._id }));
                  setShowItemModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--gold)',
                  color: 'var(--bg-canvas)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>New Item</span>
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>SKU / Barcode</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Item Name</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Base UoM</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Cost</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>On Hand</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No items matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item._id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 100ms ease' }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--gold)' }}>{item.sku}</div>
                        {item.barcode && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.barcode}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: item.type === 'INVENTORY' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: item.type === 'INVENTORY' ? '#3B82F6' : '#10B981',
                          }}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {item.categoryId?.name || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {item.baseUomId?.code || 'PCS'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {currency} {item.purchaseCost}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {currency} {item.sellingPrice}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: item.quantityOnHand > 0 ? '#10B981' : 'var(--text-muted)' }}>
                        {item.quantityOnHand || 0}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: item.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: item.isActive ? '#10B981' : '#EF4444',
                          }}
                        >
                          {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TAB 3: CATEGORIES & BRANDS */}
      {/* ========================================================= */}
      {activeSubTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          {/* Categories Panel */}
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Item Categories ({categories.length})
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  GL account routing and catalog classification
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--gold)',
                  color: 'var(--bg-canvas)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>New Category</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{cat.code}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
                    </div>
                    {cat.description && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {cat.description}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10B981',
                    }}
                  >
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Brands Panel */}
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Brands & Manufacturers ({brands.length})
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Brand grouping and supplier mapping
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBrandModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--gold)',
                  color: 'var(--bg-canvas)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>New Brand</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {brands.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No brands defined yet. Click "New Brand" to add one.
                </div>
              ) : (
                brands.map((b) => (
                  <div
                    key={b._id}
                    style={{
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{b.code}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified Brand</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. TAB 4: UNITS OF MEASURE */}
      {/* ========================================================= */}
      {activeSubTab === 'uom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Units of Measure & Packaging Rules ({uoms.length})
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Banker's rounded conversion factors and fractional precision guarantees
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowUomModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--gold)',
                color: 'var(--bg-canvas)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} />
              <span>New Unit of Measure</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px',
            }}
          >
            {uoms.map((u) => (
              <div
                key={u._id}
                style={{
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gold)' }}>
                    {u.code}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: u.isBaseUnit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: u.isBaseUnit ? '#10B981' : '#3B82F6',
                    }}
                  >
                    {u.isBaseUnit ? 'BASE UNIT' : 'CONVERTIBLE'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {u.name}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                  <span>Class: <strong>{u.category}</strong></span>
                  <span>Ratio: <strong>{u.conversionRatio?.$numberDecimal || u.conversionRatio || '1.0'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. TAB 5: WAREHOUSES & BINS */}
      {/* ========================================================= */}
      {activeSubTab === 'warehouses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Facilities, Warehouses & Storage Bins ({warehouses.length})
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Multi-branch storage locations and coordinate mapping (Aisle / Rack / Shelf / Bin)
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowBinModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--surface-3)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>Add Bin Location</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWarehouseModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--gold)',
                  color: 'var(--bg-canvas)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={15} />
                <span>New Warehouse</span>
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {warehouses.map((wh) => (
              <div
                key={wh._id}
                style={{
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gold)' }}>
                      {wh.code}
                    </span>
                    {wh.isDefault && (
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(201, 162, 75, 0.15)',
                          color: 'var(--gold)',
                        }}
                      >
                        DEFAULT HUB
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      color: '#3B82F6',
                    }}
                  >
                    {wh.type}
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {wh.name}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    {wh.address?.street ? `${wh.address.street}, ` : ''}{wh.address?.city || 'Dubai'}, {wh.address?.country || 'AE'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Negative Stock: <strong>{wh.allowNegativeStock ? 'Allowed' : 'Blocked (Strict)'}</strong></span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>● Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. TAB 6: STOCK ON HAND */}
      {/* ========================================================= */}
      {activeSubTab === 'stock-on-hand' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Warehouse Selector Filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              padding: '12px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter Facility:</span>
              <select
                value={selectedWarehouseFilter}
                onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                style={{
                  backgroundColor: 'var(--surface-3)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Warehouses & Storage Facilities</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>

            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Total Balances Tracked: <strong style={{ color: 'var(--text-primary)' }}>{filteredStockBalances.length}</strong>
            </span>
          </div>

          {/* Stock Balances Table */}
          <div
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>SKU</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Item Name</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Warehouse</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Bin Coordinate</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>On Hand</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Available</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Avg Unit Cost</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Total Valuation</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockBalances.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No inventory balances recorded yet. Items will appear here once initial stock or purchase receipts are posted.
                    </td>
                  </tr>
                ) : (
                  filteredStockBalances.map((b) => (
                    <tr key={b._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--gold)' }}>
                        {b.itemId?.sku || 'SKU'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {b.itemId?.name || 'Item'}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {b.warehouseId?.name || b.warehouseId?.code || 'Central'}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {b.binId?.code || 'DEFAULT-BIN'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#10B981' }}>
                        {b.quantityOnHand}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#3B82F6' }}>
                        {b.quantityAvailable}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-primary)' }}>
                        {currency} {b.averageUnitCost}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--gold)' }}>
                        {currency} {b.totalValuation}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. TAB 7: STOCK TRANSFERS */}
      {/* ========================================================= */}
      {activeSubTab === 'transfers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Inter-Warehouse Stock Transfers ({transfers.length})
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Multi-state dispatches and in-transit inventory tracking between facilities
              </p>
            </div>

            <button
              type="button"
              disabled={warehouses.length < 2 || items.length === 0}
              onClick={() => {
                if (warehouses.length >= 2) {
                  setNewTransfer({
                    sourceWarehouseId: warehouses[0]._id,
                    destinationWarehouseId: warehouses[1]._id,
                    notes: '',
                    lines: [{ itemId: items[0]?._id || '', quantity: '1', unitCost: items[0]?.purchaseCost || '0.00' }],
                  });
                }
                setShowTransferModal(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: warehouses.length < 2 ? 'var(--surface-3)' : 'var(--gold)',
                color: warehouses.length < 2 ? 'var(--text-muted)' : 'var(--bg-canvas)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: warehouses.length < 2 ? 'not-allowed' : 'pointer',
              }}
            >
              <Plus size={15} />
              <span>New Stock Transfer</span>
            </button>
          </div>

          {warehouses.length < 2 && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#F59E0B', fontSize: '12.5px' }}>
              💡 Inter-warehouse transfers require at least 2 active warehouses. Go to the "Warehouses & Bins" tab to create an additional facility (e.g. Retail Branch Store).
            </div>
          )}

          <div
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Transfer #</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Source Facility</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Destination Facility</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Lines</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No stock transfers recorded yet.
                    </td>
                  </tr>
                ) : (
                  transfers.map((tr) => (
                    <tr key={tr._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--gold)' }}>
                        {tr.transferNumber}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>
                        {new Date(tr.transferDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {tr.sourceWarehouseId?.name || 'Source'}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {tr.destinationWarehouseId?.name || 'Destination'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                        {tr.lines?.length || 0}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: tr.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: tr.status === 'COMPLETED' ? '#10B981' : '#F59E0B',
                          }}
                        >
                          {tr.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: CREATE ITEM */}
      {/* ========================================================= */}
      {showItemModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Catalog New Item
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Company-scoped SKU uniqueness with GL perpetual routing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SKU-1001"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Barcode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6291100000001"
                    value={newItem.barcode}
                    onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Commercial Printer Toner"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Item Type
                  </label>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="INVENTORY">Inventory (Stockable Asset)</option>
                    <option value="SERVICE">Service (Labor / Consulting)</option>
                    <option value="NON_STOCK">Non-Stock (Direct Expense)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Valuation Method
                  </label>
                  <select
                    value={newItem.valuationMethod}
                    onChange={(e) => setNewItem({ ...newItem, valuationMethod: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="WEIGHTED_AVERAGE">Weighted Average Cost (AVCO)</option>
                    <option value="FIFO">First-In First-Out (FIFO)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Category *
                  </label>
                  <select
                    required
                    value={newItem.categoryId}
                    onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Base Unit of Measure *
                  </label>
                  <select
                    required
                    value={newItem.baseUomId}
                    onChange={(e) => setNewItem({ ...newItem, baseUomId: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="">Select Base UoM</option>
                    {uoms.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.code} ({u.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Purchase Cost ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.purchaseCost}
                    onChange={(e) => setNewItem({ ...newItem, purchaseCost: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Selling Price ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.sellingPrice}
                    onChange={(e) => setNewItem({ ...newItem, sellingPrice: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Opening Stock Qty
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={newItem.initialStock}
                    onChange={(e) => setNewItem({ ...newItem, initialStock: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-3)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--gold)',
                    color: 'var(--bg-canvas)',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CREATE CATEGORY */}
      {/* ========================================================= */}
      {showCategoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                New Item Category
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Category Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ELEC"
                  value={newCat.code}
                  onChange={(e) => setNewCat({ ...newCat, code: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electronics & Hardware"
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computing, displays, and accessories"
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-3)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--gold)',
                    color: 'var(--bg-canvas)',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CREATE BRAND */}
      {/* ========================================================= */}
      {showBrandModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                New Brand
              </h3>
              <button
                type="button"
                onClick={() => setShowBrandModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBrand} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Brand Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SONY"
                  value={newBrand.code}
                  onChange={(e) => setNewBrand({ ...newBrand, code: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony Middle East"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-3)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--gold)',
                    color: 'var(--bg-canvas)',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CREATE UOM */}
      {/* ========================================================= */}
      {showUomModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                New Unit of Measure
              </h3>
              <button
                type="button"
                onClick={() => setShowUomModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUom} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PACK"
                    value={newUom.code}
                    onChange={(e) => setNewUom({ ...newUom, code: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newUom.category}
                    onChange={(e) => setNewUom({ ...newUom, category: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="UNIT">Unit / Count</option>
                    <option value="PACKAGING">Packaging</option>
                    <option value="WEIGHT">Weight</option>
                    <option value="VOLUME">Volume</option>
                    <option value="LENGTH">Length</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  UoM Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5-Piece Retail Pack"
                  value={newUom.name}
                  onChange={(e) => setNewUom({ ...newUom, name: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Conversion Ratio
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newUom.conversionRatio}
                    onChange={(e) => setNewUom({ ...newUom, conversionRatio: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Precision (Decimals)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={newUom.precision}
                    onChange={(e) => setNewUom({ ...newUom, precision: parseInt(e.target.value, 10) || 0 })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowUomModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-3)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--gold)',
                    color: 'var(--bg-canvas)',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save UoM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: CREATE WAREHOUSE */}
      {/* ========================================================= */}
      {showWarehouseModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                New Warehouse / Storage Facility
              </h3>
              <button
                type="button"
                onClick={() => setShowWarehouseModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Warehouse Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-STORE-01"
                    value={newWh.code}
                    onChange={(e) => setNewWh({ ...newWh, code: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Facility Type
                  </label>
                  <select
                    value={newWh.type}
                    onChange={(e) => setNewWh({ ...newWh, type: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="CENTRAL">Central Logistics Hub</option>
                    <option value="STORE">Retail / Branch Store</option>
                    <option value="TRANSIT">In-Transit Buffer</option>
                    <option value="QUARANTINE">Quarantine & Inspection</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deira Retail Stockroom"
                  value={newWh.name}
                  onChange={(e) => setNewWh({ ...newWh, name: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al Rigga Road, Building 4"
                    value={newWh.street}
                    onChange={(e) => setNewWh({ ...newWh, street: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={newWh.city}
                    onChange={(e) => setNewWh({ ...newWh, city: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-3)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--gold)',
                    color: 'var(--bg-canvas)',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Create Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: CREATE BIN */}
      {/* ========================================================= */}
      {showBinModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                New Storage Bin Location
              </h3>
              <button
                type="button"
                onClick={() => setShowBinModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Target Warehouse *
                </label>
                <select
                  required
                  value={newBin.warehouseId}
                  onChange={(e) => setNewBin({ ...newBin, warehouseId: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Bin Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIN-A-02-B"
                  value={newBin.code}
                  onChange={(e) => setNewBin({ ...newBin, code: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Aisle</label>
                  <input
                    type="text"
                    value={newBin.aisle}
                    onChange={(e) => setNewBin({ ...newBin, aisle: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Rack</label>
                  <input
                    type="text"
                    value={newBin.rack}
                    onChange={(e) => setNewBin({ ...newBin, rack: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Shelf</label>
                  <input
                    type="text"
                    value={newBin.shelf}
                    onChange={(e) => setNewBin({ ...newBin, shelf: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Bin</label>
                  <input
                    type="text"
                    value={newBin.bin}
                    onChange={(e) => setNewBin({ ...newBin, bin: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowBinModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-3)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--gold)',
                    color: 'var(--bg-canvas)',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Create Bin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: CREATE TRANSFER */}
      {/* ========================================================= */}
      {showTransferModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Inter-Warehouse Stock Transfer
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Source Warehouse *
                  </label>
                  <select
                    required
                    value={newTransfer.sourceWarehouseId}
                    onChange={(e) => setNewTransfer({ ...newTransfer, sourceWarehouseId: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Destination Warehouse *
                  </label>
                  <select
                    required
                    value={newTransfer.destinationWarehouseId}
                    onChange={(e) => setNewTransfer({ ...newTransfer, destinationWarehouseId: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Item to Transfer *
                </label>
                <select
                  required
                  value={newTransfer.lines[0]?.itemId || ''}
                  onChange={(e) => {
                    const selItem = items.find((i) => i._id === e.target.value);
                    setNewTransfer({
                      ...newTransfer,
                      lines: [
                        {
                          itemId: e.target.value,
                          quantity: newTransfer.lines[0]?.quantity || '1',
                          unitCost: selItem?.purchaseCost || '0.00',
                        },
                      ],
                    });
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <option value="">Select Item from Catalog</option>
                  {items.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.sku} - {i.name} (On Hand: {i.quantityOnHand || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Transfer Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newTransfer.lines[0]?.quantity || '1'}
                    onChange={(e) => {
                      const updated = [...newTransfer.lines];
                      updated[0] = { ...updated[0], quantity: e.target.value };
                      setNewTransfer({ ...newTransfer, lines: updated });
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Transfer Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Branch stock replenishment"
                    value={newTransfer.notes}
                    onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-3)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--gold)',
                    color: 'var(--bg-canvas)',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Dispatch Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
