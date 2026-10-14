export type Locale = 'en' | 'bn' | 'ar' | 'hi';
export type TextDirection = 'ltr' | 'rtl';

export interface LocaleMetadata {
  readonly code: Locale;
  readonly label: string;
  readonly nativeName: string;
  readonly dir: TextDirection;
  readonly script: string;
}

export const SUPPORTED_LOCALES: Readonly<Record<Locale, LocaleMetadata>> = Object.freeze({
  en: { code: 'en', label: 'English', nativeName: 'English', dir: 'ltr', script: 'Latn' },
  bn: { code: 'bn', label: 'Bengali', nativeName: 'বাংলা', dir: 'ltr', script: 'Beng' },
  ar: { code: 'ar', label: 'Arabic', nativeName: 'العربية', dir: 'rtl', script: 'Arab' },
  hi: { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', script: 'Deva' },
});

export interface TranslationDictionary {
  readonly nav: {
    readonly dashboard: string;
    readonly chartOfAccounts: string;
    readonly generalLedger: string;
    readonly salesInvoices: string;
    readonly purchasesExpenses: string;
    readonly cashBanking: string;
    readonly financialReports: string;
    readonly auditTrail: string;
    readonly settings: string;
    readonly coreFinancials: string;
    readonly operations: string;
    readonly reportsAndAudit: string;
    readonly enterpriseBadge: string;
  };
  readonly header: {
    readonly companyLabel: string;
    readonly searchPlaceholder: string;
    readonly fiscalYear: string;
    readonly notifications: string;
    readonly profile: string;
    readonly selectCompanyDemo: string;
    readonly activeCompanyNote: string;
    readonly language: string;
    readonly baseCurrency: string;
    readonly notificationsTitle: string;
    readonly notifLedgerBalanced: string;
    readonly notifMongoCluster: string;
    readonly userRole: string;
    readonly sessionActive: string;
  };
  readonly dashboard: {
    readonly title: string;
    readonly subtitle: string;
    readonly exportReports: string;
    readonly newJournalEntry: string;
    readonly cashAndBank: string;
    readonly cashAndBankSubtext: string;
    readonly accountsReceivable: string;
    readonly accountsReceivableSubtext: string;
    readonly accountsPayable: string;
    readonly accountsPayableSubtext: string;
    readonly netOperatingIncome: string;
    readonly recentVouchers: string;
    readonly voucherSubtitle: string;
    readonly balancedLabel: string;
    readonly voucherCol: string;
    readonly dateCol: string;
    readonly descriptionCol: string;
    readonly statusCol: string;
    readonly debitCol: string;
    readonly creditCol: string;
    readonly demoWatermark: string;
    readonly posted: string;
    readonly fxSampleTitle: string;
    readonly fxRateTitle: string;
    readonly fxScopeTitle: string;
    readonly fxScopeList: string;
    readonly zeroFloatLabel: string;
    readonly bankersRoundingBadge: string;
    readonly salesReceiptDesc: string;
    readonly rentUtilitiesDesc: string;
    readonly supplierSettlementDesc: string;
    readonly pettyCashDesc: string;
    readonly taxProvisionDesc: string;
    readonly demoLedgerBadge: string;
    readonly fiscalPeriodLabel: string;
    readonly ledgerStatusLabel: string;
    readonly workingCapitalTitle: string;
    readonly accountingIntegrityTitle: string;
    readonly sampleVouchersBadge: string;
    readonly actionPostVoucher: string;
    readonly actionTrialBalance: string;
    readonly featureNotice: string;
    readonly checksumTitle: string;
    readonly sampleStatus: string;
  };
  readonly status: {
    readonly connected: string;
    readonly disconnected: string;
    readonly probing: string;
    readonly latency: string;
    readonly database: string;
  };
  readonly currency: {
    readonly baseCurrencyLabel: string;
    readonly selectCurrency: string;
    readonly displayCurrencyTitle: string;
    readonly companyBaseNotice: string;
    readonly exchangeRate: string;
    readonly convertedAmount: string;
    readonly effectiveDate: string;
    readonly rateSource: string;
    readonly aedName: string;
    readonly usdName: string;
    readonly bdtName: string;
    readonly inrName: string;
    readonly sarName: string;
    readonly eurName: string;
  };
}
