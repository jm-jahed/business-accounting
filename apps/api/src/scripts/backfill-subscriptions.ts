import dotenv from 'dotenv';
import path from 'path';
import { Types } from 'mongoose';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import {
  dbManager,
  Company,
  Subscription,
  Plan,
  assertTestDatabase,
} from '@accounting/database';

export interface BackfillResult {
  totalCompanies: number;
  skippedExisting: number;
  backfilled: number;
  errors: number;
}

export async function runBackfillSubscriptions(options?: {
  allowProduction?: boolean;
}): Promise<BackfillResult> {
  const dbName = process.env.DB_NAME || 'business_accounting_test';

  if (!options?.allowProduction) {
    // Strict safety guard by default
    assertTestDatabase(dbName);
  }

  await dbManager.connect();

  console.log(`[Backfill] Target Database: ${dbName}`);
  console.log('[Backfill] Scanning companies collection for missing subscriptions...');

  // Ensure a fallback default plan exists
  let defaultPlan = await Plan.findOne({ code: 'starter' });
  if (!defaultPlan) {
    defaultPlan = await Plan.findOne();
  }
  if (!defaultPlan) {
    defaultPlan = new Plan({
      code: 'starter',
      nameEn: 'Starter Plan',
      nameBn: 'স্টার্টার প্ল্যান',
      isPublic: true,
      isActive: true,
      modules: ['accounting'],
      limits: {
        users: 3,
        companies: 1,
        invoicesPerMonth: 100,
        storageMb: 512,
      },
      sortOrder: 1,
    });
    await defaultPlan.save();
    console.log('[Backfill] Created fallback starter plan.');
  }

  const companies = await Company.find().lean();
  let skipped = 0;
  let created = 0;
  let errors = 0;

  for (const company of companies) {
    try {
      // Idempotency check: see if subscription already exists
      const existing = await Subscription.findOne({ companyId: company._id });
      if (existing) {
        skipped++;
        continue;
      }

      // Resolve plan
      const planCode = (company.plan || 'starter').toLowerCase();
      let plan = await Plan.findOne({ code: planCode });
      if (!plan) {
        plan = defaultPlan;
      }

      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      const newSub = new Subscription({
        companyId: company._id,
        planId: plan._id,
        planCode: plan.code,
        billingCycle: 'MONTHLY',
        currency: (company.currency || 'AED').toUpperCase(),
        amount: Types.Decimal128.fromString('0.00'),
        seats: company.seatLimit || 3,
        status: company.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE',
        currentPeriodStart: company.createdAt || new Date(),
        currentPeriodEnd: oneYearFromNow,
        notes: 'Backfilled via idempotent backfill-subscriptions script',
      });

      await newSub.save();
      created++;
    } catch (err: any) {
      console.error(`[Backfill] Error processing company ${company._id}: ${err.message}`);
      errors++;
    }
  }

  console.log('\n==========================================');
  console.log('[Backfill Summary]');
  console.log(`Total Companies Scanned : ${companies.length}`);
  console.log(`Skipped (Already Active): ${skipped}`);
  console.log(`Newly Backfilled        : ${created}`);
  console.log(`Errors                  : ${errors}`);
  console.log('==========================================\n');

  return {
    totalCompanies: companies.length,
    skippedExisting: skipped,
    backfilled: created,
    errors,
  };
}

if (require.main === module) {
  runBackfillSubscriptions()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error during backfill:', err.message);
      process.exit(1);
    });
}
