import { BusinessPack } from '../business-pack.schema.js';

export const ALL_BUSINESS_PACKS: BusinessPack[] = [
  // ==========================================
  // 5 FULLY IMPLEMENTED PACKS IN THIS PHASE
  // ==========================================
  {
    id: 'trading',
    nameEn: 'Trading & Commercial Supply',
    nameBn: 'ট্রেডিং ও বাণিজ্যিক সরবরাহ',
    descriptionEn: 'Wholesale buying and selling, supplier commercial terms, customer credit and trading inventory.',
    descriptionBn: 'পণ্য কেনাবেচা, মালামাল সরবরাহ, ডিলার ক্রেডিট ও বাণিজ্যিক ট্রেডিং।',
    icon: 'TrendingUp',
    category: 'Trade & Wholesale',
    isFullyImplemented: true,
    requiredModules: ['accounting', 'inventory'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'taxPosition', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Commercial Invoices", bn: 'আজকের বাণিজ্যিক বিক্রি' },
      mtdRevenue: { en: 'Monthly Commercial Turnover', bn: 'চলতি মাসের মোট ট্রেডিং বিক্রি' },
      receivables: { en: 'Trade Receivables (Customer Credit)', bn: 'ক্রেতাদের কাছে মোট বকেয়া' },
      payables: { en: 'Trade Payables (Supplier Credit)', bn: 'সাপ্লায়ারদের পাওনা টাকা' },
      inventoryValuation: { en: 'Commercial Trading Stock', bn: 'গুদামে মজুদ বাণিজ্যিক পণ্য' },
    },
    quickActions: [
      { id: 'trade-sale', labelEn: 'New Sales Invoice', labelBn: 'নতুন বিক্রয় চালান', icon: 'FileText', tab: 'sales' },
      { id: 'trade-purchase', labelEn: 'Supplier Purchase Bill', labelBn: 'সাপ্লায়ার বিল ভাউচার', icon: 'ShoppingCart', tab: 'purchases' },
      { id: 'new-jv', labelEn: 'Journal Voucher', labelBn: 'জার্নাল ভাউচার', icon: 'BookOpen', tab: 'general-ledger' },
    ],
    checklist: [
      { id: 'c1', titleEn: 'Setup Trading Ledger Accounts', titleBn: 'ট্রেডিং লেজার সেটআপ', descEn: 'Configure commercial sales and purchase ledger codes.', descBn: 'বাণিজ্যিক বিক্রয় ও ক্রয়ের লেজার সেটআপ করুন।', isCompletedKey: 'chartOfAccountsSeeded', actionTab: 'accounts' },
      { id: 'c2', titleEn: 'Record Opening Trade Inventory', titleBn: 'শুরুর মজুদ পণ্য যোগ করুন', descEn: 'Import initial warehouse goods and opening balance.', descBn: 'গুদামের প্রারম্ভিক স্টক রেকর্ড করুন।', isCompletedKey: 'inventoryCatalogued', actionTab: 'inventory' },
      { id: 'c3', titleEn: 'Post First Trading Voucher', titleBn: 'প্রথম চালান বা ভাউচার লিখুন', descEn: 'Create first sales invoice or opening balance journal.', descBn: 'আপনার প্রথম বাণিজ্যিক বিক্রি বা জাবেদা ভাউচার রেকর্ড করুন।', isCompletedKey: 'openingBalancePosted', actionTab: 'general-ledger' },
    ],
    tips: [
      { ruleId: 'receivables-turnover', templateEn: 'Track customer credit aging regularly to maintain high liquidity.', templateBn: 'কাস্টমারদের বকেয়া দ্রুত আদায়ের নজরদারি বজায় রাখুন।' },
    ],
  },
  {
    id: 'retail',
    nameEn: 'Retail Shop & Store',
    nameBn: 'খুচরা দোকান ও স্টোর',
    descriptionEn: 'Daily counter retail, supermarket aisles, grocery, fashion & shelf inventory management.',
    descriptionBn: 'মুদি দোকান, পোশাক, মনিহারী ও খুচরা বিক্রয় কেন্দ্র।',
    icon: 'ShoppingBag',
    category: 'Retail & Consumer',
    isFullyImplemented: true,
    requiredModules: ['accounting', 'inventory'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'topExpenses', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Counter Sales", bn: 'আজকের কাউন্টার বিক্রি' },
      mtdRevenue: { en: 'Month-to-Date Store Sales', bn: 'চলতি মাসের মোট দোকান বিক্রি' },
      inventoryValuation: { en: 'Shelf Stock Value', bn: 'দোকান ও গুদামের পণ্যের মূল্য' },
      grossProfit: { en: 'Gross Retail Margin', bn: 'খুচরা গ্রস লাভ (ক্রয় বাদে)' },
    },
    quickActions: [
      { id: 'new-sale', labelEn: 'New Retail Sale', labelBn: 'নতুন খুচরা বিক্রি', icon: 'ShoppingCart', tab: 'sales' },
      { id: 'stock-check', labelEn: 'Check Stock', labelBn: 'মজুদ পণ্য পরীক্ষা', icon: 'Layers', tab: 'inventory' },
      { id: 'record-expense', labelEn: 'Shop Expense', labelBn: 'দোকানের খরচ লিখুন', icon: 'CreditCard', tab: 'general-ledger' },
    ],
    checklist: [
      { id: 'c1', titleEn: 'Configure Product Accounts', titleBn: 'পণ্য ও বিক্রয় হিসাব কনফিগার', descEn: 'Ensure sales and inventory accounts are ready in General Ledger.', descBn: 'লেজারে বিক্রয় ও মজুদ পণ্যের হিসাব চালু করুন।', isCompletedKey: 'chartOfAccountsSeeded', actionTab: 'accounts' },
      { id: 'c2', titleEn: 'Enter Opening Shelf Stock', titleBn: 'শুরুর মজুদ পণ্য যোগ করুন', descEn: 'Record your opening stock balances.', descBn: 'দোকানে থাকা পণ্যের বর্তমান স্টক রেকর্ড করুন।', isCompletedKey: 'inventoryCatalogued', actionTab: 'inventory' },
      { id: 'c3', titleEn: 'Record First Counter Sale', titleBn: 'প্রথম বিক্রির ভাউচার যোগ করুন', descEn: 'Post your first sales invoice or retail journal.', descBn: 'আপনার প্রথম বিক্রি এন্ট্রি সম্পন্ন করুন।', isCompletedKey: 'openingBalancePosted', actionTab: 'sales' },
    ],
    tips: [
      { ruleId: 'low-stock-check', templateEn: 'Keep fast-moving items stocked to avoid lost counter sales.', templateBn: 'বেশি বিক্রয় হওয়া পণ্য সবসময় স্টকে রাখুন।' },
    ],
  },
  {
    id: 'office_service',
    nameEn: 'Corporate Office & Services',
    nameBn: 'কর্পোরেট অফিস ও পেশাদার সেবা',
    descriptionEn: 'Professional services, legal, consultancy, audit firms, staff payroll and overheads.',
    descriptionBn: 'আইনি, হিসাবরক্ষণ, পরামর্শক, আইটি ও বাণিজ্যিক সেবা প্রতিষ্ঠান।',
    icon: 'Building2',
    category: 'Professional Services',
    isFullyImplemented: true,
    requiredModules: ['accounting'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Professional Service Fees", bn: 'আজকের সেবা বিল ও ফি' },
      mtdRevenue: { en: 'Month Professional Billing', bn: 'চলতি মাসের মোট সার্ভিস আয়' },
      receivables: { en: 'Corporate Client Unpaid Bills', bn: 'কর্পোরেট ক্লায়েন্টদের বকেয়া' },
      grossProfit: { en: 'Service Operating Margin', bn: 'সেবা পরিচালন লাভ' },
    },
    quickActions: [
      { id: 'service-bill', labelEn: 'Service Invoice', labelBn: 'সার্ভিস ইনভয়েস', icon: 'FileText', tab: 'sales' },
      { id: 'office-expense', labelEn: 'Office Admin Expense', labelBn: 'অফিস খরচ লিপিবদ্ধ করুন', icon: 'CreditCard', tab: 'general-ledger' },
      { id: 'bank-check', labelEn: 'Bank Balances', labelBn: 'ব্যাংক হিসাব পরীক্ষা', icon: 'Building2', tab: 'banking' },
    ],
    checklist: [
      { id: 'c1', titleEn: 'Setup Service COA', titleBn: 'সার্ভিস লেজার সেটআপ', descEn: 'Configure professional fee income and office rent accounts.', descBn: 'পেশাদার ফি ও অফিস ব্যয় লেজার রেডি করুন।', isCompletedKey: 'chartOfAccountsSeeded', actionTab: 'accounts' },
      { id: 'c2', titleEn: 'Post Opening Balances', titleBn: 'প্রারম্ভিক ব্যালেন্স এন্ট্রি', descEn: 'Post your bank and capital opening balances.', descBn: 'ব্যাংক ব্যালেন্স ও মূলধনের জাবেদা লিখুন।', isCompletedKey: 'openingBalancePosted', actionTab: 'general-ledger' },
    ],
    tips: [
      { ruleId: 'overhead-watch', templateEn: 'Track rent and retainer costs against monthly billing volume.', templateBn: 'মাসিক আয়ের অনুপাতে অফিস পরিচালন খরচ নিয়ন্ত্রণে রাখুন।' },
    ],
  },
  {
    id: 'distribution_wholesale',
    nameEn: 'Distribution & Wholesale',
    nameBn: 'ডিস্ট্রিবিউশন ও হোলসেল',
    descriptionEn: 'High-volume B2B deliveries, factory consignments, dealer credit and regional routes.',
    descriptionBn: 'পাইকারি ব্যবসা, ডিলার নেটওয়ার্ক ও ডিস্ট্রিবিউশন সাপ্লাই।',
    icon: 'Truck',
    category: 'Trade & Wholesale',
    isFullyImplemented: true,
    requiredModules: ['accounting', 'inventory'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'taxPosition', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Wholesale Shipments", bn: 'আজকের পাইকারি চালান' },
      mtdRevenue: { en: 'Month Distribution Turnover', bn: 'চলতি মাসের পাইকারি টার্নওভার' },
      receivables: { en: 'Dealer & Retailer Credit Balances', bn: 'ডিলার ও খুচরা পার্টির বকেয়া' },
      payables: { en: 'Principal Factory / Manufacturer Dues', bn: 'কোম্পানি বা ফ্যাক্টরি প্রদেয়' },
      inventoryValuation: { en: 'Central Warehouse Inventory', bn: 'সেন্ট্রাল গুদামের মোট মজুদ' },
    },
    quickActions: [
      { id: 'wholesale-order', labelEn: 'Wholesale Invoice', labelBn: 'পাইকারি ইনভয়েস', icon: 'FileText', tab: 'sales' },
      { id: 'receive-factory', labelEn: 'Receive Consignment', labelBn: 'ফ্যাক্টরি চালান গ্রহণ', icon: 'Layers', tab: 'inventory' },
    ],
    checklist: [
      { id: 'c1', titleEn: 'Setup Wholesale Accounts', titleBn: 'পাইকারি লেজার সেটআপ', descEn: 'Configure accounts for wholesale sales and freight.', descBn: 'পাইকারি বিক্রয় ও পরিবহন হিসাব সেটআপ করুন।', isCompletedKey: 'chartOfAccountsSeeded', actionTab: 'accounts' },
      { id: 'c2', titleEn: 'Catalog Bulk Warehouse Goods', titleBn: 'গুদামের স্টক তালিকাভুক্ত করুন', descEn: 'Input bulk product catalogs.', descBn: 'পাইকারি পণ্যের তালিকা এন্ট্রি করুন।', isCompletedKey: 'inventoryCatalogued', actionTab: 'inventory' },
    ],
    tips: [],
  },
  {
    id: 'other_custom',
    nameEn: 'Other / Custom Enterprise',
    nameBn: 'অন্যান্য বা কাস্টম প্রতিষ্ঠান',
    descriptionEn: 'Flexible general accounting configuration adaptable to any custom business model.',
    descriptionBn: 'যেকোনো ধরনের ব্যবসা প্রতিষ্ঠানের জন্য সার্বজনীন হিসাব ব্যবস্থাপনা।',
    icon: 'Briefcase',
    category: 'General',
    isFullyImplemented: true,
    requiredModules: ['accounting'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'taxPosition', 'topExpenses', 'recentEntries'],
    labelOverrides: {},
    quickActions: [
      { id: 'new-jv', labelEn: 'New Journal Voucher', labelBn: 'নতুন জার্নাল ভাউচার', icon: 'FileText', tab: 'general-ledger' },
      { id: 'new-inv', labelEn: 'Commercial Invoice', labelBn: 'কমার্শিয়াল ইনভয়েস', icon: 'ShoppingCart', tab: 'sales' },
    ],
    checklist: [
      { id: 'c1', titleEn: 'Configure General Ledger', titleBn: 'জেনারেল লেজার কনফিগার', descEn: 'Ensure base double-entry accounts are initialized.', descBn: 'প্রাথমিক আর্থিক হিসাব কোড চালু করুন।', isCompletedKey: 'chartOfAccountsSeeded', actionTab: 'accounts' },
    ],
    tips: [],
  },

  // ==========================================
  // 21 STRUCTURAL PACKS (LOCKED SPECIFIC CARDS)
  // ==========================================
  {
    id: 'restaurant_cafe',
    nameEn: 'Restaurant & Cafe',
    nameBn: 'রেস্তোরাঁ ও ক্যাফে',
    descriptionEn: 'Dine-in table orders, kitchen tickets (KOT), recipe food cost and banquet management.',
    descriptionBn: 'রেস্তোরাঁ, ক্যাফেটেরিয়া, ডাইনিং টেবিল ও কিচেন খাবার হিসাব।',
    icon: 'Utensils',
    category: 'Hospitality & Food',
    isFullyImplemented: false,
    requiredModules: ['table_kot'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'topExpenses', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Table & Takeaway Sales", bn: 'আজকের ডাইনিং ও পার্সেল বিক্রি' },
      grossProfit: { en: 'Kitchen Profit (Raw Food Cost Deducted)', bn: 'রান্নাঘরের লাভ (খাবার খরচ বাদে)' },
      inventoryValuation: { en: 'Pantry & Raw Ingredients Stock', bn: 'কিচেন ও প্যান্ট্রির কাঁচামাল' },
    },
    quickActions: [
      { id: 'food-sale', labelEn: 'Record Dining Sales', labelBn: 'ডাইনিং বিক্রি লিখুন', icon: 'Utensils', tab: 'sales' },
    ],
    checklist: [],
    tips: [],
  },
  {
    id: 'education_school',
    nameEn: 'Education, School & Academy',
    nameBn: 'স্কুল, কলেজ ও একাডেমি',
    descriptionEn: 'Student tuition fees, term admissions, teacher payroll and institutional grants.',
    descriptionBn: 'শিক্ষা প্রতিষ্ঠান, কোচিং, মাদরাসা ও একাডেমিয়া।',
    icon: 'GraduationCap',
    category: 'Education',
    isFullyImplemented: false,
    requiredModules: ['student_fees'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Student Fee Collection", bn: 'আজকের টিউশন ফি সংগ্রহ' },
      mtdRevenue: { en: 'Monthly Fee Collection', bn: 'চলতি মাসের মোট ছাত্র বেতন' },
      receivables: { en: 'Unpaid Student Tuition Dues', bn: 'ছাত্র-ছাত্রীদের বকেয়া বেতন' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'clinic_pharmacy',
    nameEn: 'Clinic & Pharmacy',
    nameBn: 'ক্লিনিক ও ফার্মেসি',
    descriptionEn: 'Doctor patient consultations, diagnostic testing and medicine batch/expiry tracking.',
    descriptionBn: 'ডাক্তার চেম্বার, ডায়াগনস্টিক ও ওষুধ ফার্মেসির হিসাব।',
    icon: 'Activity',
    category: 'Healthcare',
    isFullyImplemented: false,
    requiredModules: ['patient_emr', 'pharmacy_batches'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Consultations & Pharmacy", bn: 'আজকের রোগী সেবা ও ওষুধ বিক্রি' },
      receivables: { en: 'Pending Insurance & Patient Dues', bn: 'রোগী ও ইন্স্যুরেন্স বকেয়া' },
      inventoryValuation: { en: 'Medicine & Surgical Stock Value', bn: 'ওষুধ ও মেডিকেল সামগ্রীর মূল্য' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'supermarket',
    nameEn: 'Supermarket & Multi-Aisle Store',
    nameBn: 'সুপারশপ ও ডিপার্টমেন্টাল স্টোর',
    descriptionEn: 'High-speed multi-lane barcode checkout, weigh-scale integration and perishable food items.',
    descriptionBn: 'বৃহৎ সুপারশপ ও বহুমুখী পণ্যের ডিপার্টমেন্টাল স্টোর।',
    icon: 'Store',
    category: 'Retail & Consumer',
    isFullyImplemented: false,
    requiredModules: ['pos_multi_lane'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Checkout Lane Sales", bn: 'আজকের চেকআউট লেন বিক্রি' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'hotel',
    nameEn: 'Hotel & Guest House',
    nameBn: 'হোটেল, মোটেল ও রিসোর্ট',
    descriptionEn: 'Room nights occupancy, housekeeping supplies, guest laundry and hospitality billing.',
    descriptionBn: 'আবাসিক হোটেল, গেস্ট হাউস ও রিসোর্ট ব্যবস্থাপনা।',
    icon: 'BedDouble',
    category: 'Hospitality & Food',
    isFullyImplemented: false,
    requiredModules: ['room_booking'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Room Bookings & Tariffs", bn: 'আজকের রুম ভাড়া ও বুকিং আয়' },
      receivables: { en: 'OTA & Corporate Travel Dues', bn: 'এজেন্সি ও ট্রাভেলার বকেয়া' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'construction',
    nameEn: 'Construction & Contracting',
    nameBn: 'নির্মাণ ও প্রজেক্ট কন্ট্রাক্টিং',
    descriptionEn: 'Civil project job costing, steel/cement materials, site labor and running client bills.',
    descriptionBn: 'বিল্ডিং কনস্ট্রাকশন, ঠিকাদারি ও প্রজেক্ট নির্মাণ ব্যয়।',
    icon: 'HardHat',
    category: 'Industrial',
    isFullyImplemented: false,
    requiredModules: ['project_costing'],
    kpiList: ['mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Project Certified Billing", bn: 'আজকের প্রজেক্ট বিল' },
      receivables: { en: 'Client Retention & Certified Dues', bn: 'ক্লায়েন্ট বিল ও রিটেনশন বকেয়া' },
      inventoryValuation: { en: 'Site Construction Material Stock', bn: 'সাইটে থাকা নির্মাণ সামগ্রীর মূল্য' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'ecommerce',
    nameEn: 'E-commerce & Online Shop',
    nameBn: 'অনলাইন শপ ও ই-কমার্স',
    descriptionEn: 'Web shopping carts, courier cash-on-delivery (COD), return rates and packaging boxes.',
    descriptionBn: 'ওয়েবসাইট, ফেসবুক পেজ ও অনলাইন অর্ডারের হিসাব।',
    icon: 'Globe',
    category: 'Retail & Consumer',
    isFullyImplemented: false,
    requiredModules: ['courier_api'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Dispatched Orders", bn: 'আজকের ডেলিভারি অর্ডার' },
      receivables: { en: 'Courier COD Pending Settlements', bn: 'কুরিয়ার সিওডি বকেয়া টাকা' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'garments_manufacturing',
    nameEn: 'Garments & Manufacturing',
    nameBn: 'পোশাক ও উৎপাদন শিল্প',
    descriptionEn: 'Factory work-in-progress (WIP), bill of materials, yarn/fabric cutting and stitching lines.',
    descriptionBn: 'গার্মেন্টস, টেক্সটাইল, কারখানা ও উৎপাদন শিল্প।',
    icon: 'Factory',
    category: 'Industrial',
    isFullyImplemented: false,
    requiredModules: ['bill_of_materials', 'production'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Factory Shipments", bn: 'আজকের কারখানা ডেলিভারি' },
      inventoryValuation: { en: 'Raw Fabric, WIP & Finished Goods', bn: 'কাঁচামাল ও উৎপাদিত ফিনিশড স্টক' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'freelancer_agency',
    nameEn: 'Freelancer & Digital Agency',
    nameBn: 'ফ্রিল্যান্সার ও ডিজিটাল এজেন্সি',
    descriptionEn: 'Client software milestones, hourly timesheets, foreign remittances and SaaS subscriptions.',
    descriptionBn: 'সফটওয়্যার, ডিজাইন, মার্কেটিং এজেন্সি ও ফ্রিল্যান্সিং।',
    icon: 'Laptop',
    category: 'Professional Services',
    isFullyImplemented: false,
    requiredModules: ['timesheets'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Milestone Invoices", bn: 'আজকের মাইলস্টোন ইনভয়েস' },
      receivables: { en: 'Unpaid Client Retainers', bn: 'ক্লায়েন্টদের বকেয়া ইনভয়েস' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'bakery',
    nameEn: 'Bakery & Food Making',
    nameBn: 'বেকারি ও মিষ্টির দোকান',
    descriptionEn: 'Flour/sugar batch recipes, daily oven bread, confectionery shelf life and fast retail.',
    descriptionBn: 'বেকারি পণ্য, কেক, মিষ্টি ও ফাস্টফুড তৈরি ও বিক্রয়।',
    icon: 'Coffee',
    category: 'Hospitality & Food',
    isFullyImplemented: false,
    requiredModules: ['kitchen_recipe'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'topExpenses', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Baked Goods Sales", bn: 'আজকের বেকারি পণ্য বিক্রি' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'import_export',
    nameEn: 'Import & Export',
    nameBn: 'আমদানি ও রপ্তানি বাণিজ্য',
    descriptionEn: 'Letter of credit (LC), customs duty assessment, shipping containers and foreign currency clearance.',
    descriptionBn: 'এলসি, আন্তর্জাতিক বাণিজ্য ও আমদানি-রপ্তানি সরবরাহ।',
    icon: 'Ship',
    category: 'Trade & Wholesale',
    isFullyImplemented: false,
    requiredModules: ['lc_customs'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Export Billings", bn: 'আজকের রপ্তানি বিলিং' },
      receivables: { en: 'Foreign Buyer Trade LC Due', bn: 'বিদেশি ক্রেতার বকেয়া এলসি' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'jewelry',
    nameEn: 'Jewelry & Gold House',
    nameBn: 'জুয়েলারি ও স্বর্ণের ব্যবসা',
    descriptionEn: 'Karat purity, bullion rates, craft making charges and secure vault inventory.',
    descriptionBn: 'স্বর্ণালংকার, ডায়মন্ড ও জুয়েলারি তৈরি ও বিক্রয়।',
    icon: 'Gem',
    category: 'Retail & Consumer',
    isFullyImplemented: false,
    requiredModules: ['gold_vault'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Gold & Jewelry Sales", bn: 'আজকের স্বর্ণ ও অলংকার বিক্রি' },
      inventoryValuation: { en: 'Vault Gold & Bullion Value', bn: 'ভল্টের স্বর্ণ ও রত্নের মোট মূল্য' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'logistics',
    nameEn: 'Logistics & Transport',
    nameBn: 'পরিবহন, কুরিয়ার ও লজিস্টিকস',
    descriptionEn: 'Truck freight trips, fuel consumption, driver allowances, toll cards and cargo waybills.',
    descriptionBn: 'ট্রাক ভাড়া, ট্রান্সপোর্ট ও পার্সেল কুরিয়ার সার্ভিস।',
    icon: 'Package',
    category: 'Trade & Wholesale',
    isFullyImplemented: false,
    requiredModules: ['fleet_management'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Freight Trip Billing", bn: 'আজকের ট্রিপ ও ডেলিভারি বিল' },
      receivables: { en: 'Consignee Outstanding Freight', bn: 'ক্লায়েন্টদের বকেয়া ভাড়া' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'mobile_electronics',
    nameEn: 'Mobile & Electronics Shop',
    nameBn: 'মোবাইল ও ইলেকট্রনিক্স গ্যাজেট',
    descriptionEn: 'IMEI handset registration, device warranties, gadget accessories and repair service charges.',
    descriptionBn: 'স্মার্টফোন, ল্যাপটপ, ইলেকট্রনিক্স ও গ্যাজেট সামগ্রী।',
    icon: 'Smartphone',
    category: 'Retail & Consumer',
    isFullyImplemented: false,
    requiredModules: ['imei_tracking'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'topExpenses', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Handset & Device Sales", bn: 'আজকের মোবাইল ও গ্যাজেট বিক্রি' },
      inventoryValuation: { en: 'Handsets & Electronics Stock', bn: 'শো-রুমের মোবাইল ও গ্যাজেট মূল্য' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'ngo',
    nameEn: 'NGO & Charity',
    nameBn: 'এনজিও ও চ্যারিটি সংস্থা',
    descriptionEn: 'Donor funding grants, humanitarian aid distribution, project tracking and audit compliance.',
    descriptionBn: 'সমাজসেবা, দান-অনুদানের তহবিল ও প্রজেক্ট ত্রাণ ব্যয়।',
    icon: 'Heart',
    category: 'Non-Profit',
    isFullyImplemented: false,
    requiredModules: ['donor_grants'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'payables'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Donor Contributions", bn: 'আজকের দান ও অনুদান' },
      mtdRevenue: { en: 'Monthly Donor Grants Received', bn: 'চলতি মাসের মোট প্রজেক্ট অনুদান' },
      netProfit: { en: 'Net Unrestricted Fund Surplus', bn: 'তহবিলের উদ্বৃত্ত (সারপ্লাস)' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'printing',
    nameEn: 'Printing & Press',
    nameBn: 'প্রিন্টিং ও প্যাকেজিং প্রেস',
    descriptionEn: 'Paper ream stock, ink plates, die cutting and commercial printing contract delivery.',
    descriptionBn: 'ছাপাখানা, বিজ্ঞাপন প্রিন্ট, কার্টুন ও প্যাকেজিং কারখানা।',
    icon: 'Printer',
    category: 'Industrial',
    isFullyImplemented: false,
    requiredModules: ['print_press_jobs'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'topExpenses', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Printed Press Billings", bn: 'আজকের প্রিন্টিং ডেলিভারি বিল' },
      inventoryValuation: { en: 'Paper, Plate & Ink Stock Value', bn: 'কাগজ, কালি ও প্লেটের মজুদ মূল্য' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'real_estate',
    nameEn: 'Real Estate & Property',
    nameBn: 'জমি, রিয়েল এস্টেট ও ফ্ল্যাট',
    descriptionEn: 'Plot sale installments, tenant lease contracts, broker commissions and building development.',
    descriptionBn: 'জমি ক্রয়-বিক্রয়, ফ্ল্যাট নির্মাণ ও বাড়ি ভাড়া ব্যবস্থাপনা।',
    icon: 'Home',
    category: 'Real Estate',
    isFullyImplemented: false,
    requiredModules: ['property_installments'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Property Bookings & Rent", bn: 'আজকের বুকিং মানি ও ভাড়া' },
      receivables: { en: 'Buyer Installment Due Balances', bn: 'ক্রেতাদের বকেয়া কিস্তির টাকা' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'salon_spa',
    nameEn: 'Salon & Spa',
    nameBn: 'সেলুন, পার্লার ও স্পা',
    descriptionEn: 'Customer grooming services, stylist appointments and cosmetics treatment retail.',
    descriptionBn: 'বিউটি পার্লার, হেয়ার কাটিং সেলুন ও রূপচর্চা কেন্দ্র।',
    icon: 'Sparkles',
    category: 'Personal Care',
    isFullyImplemented: false,
    requiredModules: ['appointment_booking'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'topExpenses', 'taxPosition', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Styling & Spa Revenue", bn: 'আজকের পার্লার ও সার্ভিস আয়' },
      inventoryValuation: { en: 'Cosmetics & Styling Products', bn: 'কসমেটিকস ও প্রসাধন পণ্যের মূল্য' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'tailor_boutique',
    nameEn: 'Tailor & Boutique',
    nameBn: 'দর্জি, বুটিক ও পোশাক নকশা',
    descriptionEn: 'Custom bespoke sewing, customer measurements, fabrics and fashion accessories.',
    descriptionBn: 'পোশাক সেলাই, বুটিক ড্রেস ও ট্রেইলারিং শপ।',
    icon: 'Scissors',
    category: 'Retail & Consumer',
    isFullyImplemented: false,
    requiredModules: ['measurement_orders'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Tailoring & Boutique Sales", bn: 'আজকের সেলাই ও বুটিক অর্ডার' },
      inventoryValuation: { en: 'Fabric, Lace & Button Stock', bn: 'থান কাপড়, লেইস ও বোতামের মূল্য' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'workshop_garage',
    nameEn: 'Workshop & Garage',
    nameBn: 'গ্যারেজ, অটোমোবাইল ও ওয়ার্কশপ',
    descriptionEn: 'Automobile repair job cards, vehicle spare parts and mechanic labor fees.',
    descriptionBn: 'গাড়ি মেরামত, অটো পার্টস বিক্রয় ও মেকানিক সার্ভিস।',
    icon: 'Wrench',
    category: 'Services',
    isFullyImplemented: false,
    requiredModules: ['job_cards'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Repair & Spare Parts Billing", bn: 'আজকের গাড়ি মেরামত ও পার্টস বিক্রি' },
      inventoryValuation: { en: 'Auto Spare Parts & Lubes Stock', bn: 'অটো পার্টস ও মবিল-তেল স্টক' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
  {
    id: 'agriculture',
    nameEn: 'Agriculture & Farm Produce',
    nameBn: 'কৃষি, খামার ও ডেইরি ফার্ম',
    descriptionEn: 'Crop harvests, seed/fertilizer inputs, dairy livestock & agricultural wholesale.',
    descriptionBn: 'ফসল উৎপাদন, বীজ-সার ক্রয় ও ডেইরি খামারের হিসাব।',
    icon: 'Tractor',
    category: 'Agriculture',
    isFullyImplemented: false,
    requiredModules: ['agriculture_crops'],
    kpiList: ['todaySales', 'mtdRevenue', 'grossProfit', 'netProfit', 'cashAndBank', 'receivables', 'payables', 'inventoryValuation'],
    widgetList: ['revenueTrend', 'cashFlow', 'topExpenses', 'recentEntries'],
    labelOverrides: {
      todaySales: { en: "Today's Produce & Milk Sales", bn: 'আজকের ফসল ও দুধ বিক্রি' },
      inventoryValuation: { en: 'Stored Grain, Feed & Fertilizer Stock', bn: 'মজুদ ফসল, বীজ ও সার মূল্য' },
    },
    quickActions: [],
    checklist: [],
    tips: [],
  },
];

/**
 * Find pack definition by identifier
 */
export function getBusinessPack(id: string): BusinessPack | undefined {
  return ALL_BUSINESS_PACKS.find((p) => p.id === id);
}

/**
 * Merges multiple selected business packs into a unified dashboard configuration
 * without duplicates, applying label overrides and resolving module locks.
 */
export function mergeBusinessPacks(
  packIds: string[],
  enabledModules: string[] = ['accounting']
): {
  activePacks: BusinessPack[];
  kpiList: string[];
  widgetList: string[];
  labelOverrides: Record<string, { en: string; bn: string; tooltipEn?: string; tooltipBn?: string }>;
  quickActions: Array<{ id: string; labelEn: string; labelBn: string; icon: string; tab: string }>;
  checklist: Array<{ id: string; titleEn: string; titleBn: string; descEn: string; descBn: string; isCompletedKey: string; actionTab: string }>;
  lockedFeatures: Array<{ id: string; packId: string; requiredModule: string; reasonEn: string; reasonBn: string }>;
} {
  const selectedPacks = (packIds.length > 0 ? packIds : ['retail'])
    .map((id) => getBusinessPack(id))
    .filter((p): p is BusinessPack => !!p);

  const activePacks = selectedPacks.length > 0 ? selectedPacks : [ALL_BUSINESS_PACKS[0]];

  // Always include standard base 5 KPIs
  const baseKpis = ['cashAndBank', 'receivables', 'payables', 'grossProfit', 'netProfit'];
  const kpiSet = new Set<string>(baseKpis);

  // If inventory module enabled or requested by pack
  const hasInventoryModule = enabledModules.includes('inventory');
  if (hasInventoryModule) {
    kpiSet.add('inventoryValuation');
  }

  // Add pack KPIs
  for (const pack of activePacks) {
    for (const kpi of pack.kpiList) {
      if (kpi === 'inventoryValuation' && !hasInventoryModule) {
        continue;
      }
      kpiSet.add(kpi);
    }
  }

  // Merge Widgets
  const baseWidgets = ['revenueTrend', 'topExpenses', 'taxPosition', 'recentEntries'];
  const widgetSet = new Set<string>(baseWidgets);
  for (const pack of activePacks) {
    for (const w of pack.widgetList) {
      widgetSet.add(w);
    }
  }

  // Merge Label Overrides (first active pack takes highest priority)
  const labelOverrides: Record<string, { en: string; bn: string; tooltipEn?: string; tooltipBn?: string }> = {};
  for (let i = activePacks.length - 1; i >= 0; i--) {
    const pack = activePacks[i];
    for (const [kpiKey, val] of Object.entries(pack.labelOverrides)) {
      labelOverrides[kpiKey] = val;
    }
  }

  // Merge Quick Actions without duplicates
  const actionMap = new Map<string, any>();
  for (const pack of activePacks) {
    for (const action of pack.quickActions) {
      if (!actionMap.has(action.id)) {
        actionMap.set(action.id, action);
      }
    }
  }

  // Merge Checklists without duplicates
  const checklistMap = new Map<string, any>();
  for (const pack of activePacks) {
    for (const item of pack.checklist) {
      if (!checklistMap.has(item.id)) {
        checklistMap.set(item.id, item);
      }
    }
  }

  // Check for locked features due to missing requiredModules
  const lockedFeatures: Array<{ id: string; packId: string; requiredModule: string; reasonEn: string; reasonBn: string }> = [];
  for (const pack of activePacks) {
    for (const reqMod of pack.requiredModules) {
      if (!enabledModules.includes(reqMod)) {
        lockedFeatures.push({
          id: `${pack.id}:${reqMod}`,
          packId: pack.id,
          requiredModule: reqMod,
          reasonEn: `Available after ${reqMod.replace(/_/g, ' ').toUpperCase()} module is activated.`,
          reasonBn: `${reqMod.replace(/_/g, ' ').toUpperCase()} মডিউল চালু করার পর পাওয়া যাবে।`,
        });
      }
    }
  }

  return {
    activePacks,
    kpiList: Array.from(kpiSet),
    widgetList: Array.from(widgetSet),
    labelOverrides,
    quickActions: Array.from(actionMap.values()),
    checklist: Array.from(checklistMap.values()),
    lockedFeatures,
  };
}
