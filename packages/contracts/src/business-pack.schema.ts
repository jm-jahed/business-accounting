import { z } from 'zod';

export const BusinessPackQuickActionSchema = z.object({
  id: z.string(),
  labelEn: z.string(),
  labelBn: z.string(),
  icon: z.string(),
  tab: z.string(),
});
export type BusinessPackQuickAction = z.infer<typeof BusinessPackQuickActionSchema>;

export const BusinessPackChecklistItemSchema = z.object({
  id: z.string(),
  titleEn: z.string(),
  titleBn: z.string(),
  descEn: z.string(),
  descBn: z.string(),
  isCompletedKey: z.string(),
  actionTab: z.string(),
});
export type BusinessPackChecklistItem = z.infer<typeof BusinessPackChecklistItemSchema>;

export const BusinessPackLabelOverrideSchema = z.object({
  en: z.string(),
  bn: z.string(),
  tooltipEn: z.string().optional(),
  tooltipBn: z.string().optional(),
});
export type BusinessPackLabelOverride = z.infer<typeof BusinessPackLabelOverrideSchema>;

export const BusinessPackTipRuleSchema = z.object({
  ruleId: z.string(),
  templateEn: z.string(),
  templateBn: z.string(),
  actionTab: z.string().optional(),
});
export type BusinessPackTipRule = z.infer<typeof BusinessPackTipRuleSchema>;

export const BusinessPackSchema = z.object({
  id: z.string(),
  nameEn: z.string(),
  nameBn: z.string(),
  descriptionEn: z.string(),
  descriptionBn: z.string(),
  icon: z.string(),
  category: z.string().default('General'),
  kpiList: z.array(z.string()).default([]),
  widgetList: z.array(z.string()).default([]),
  labelOverrides: z.record(BusinessPackLabelOverrideSchema).default({}),
  quickActions: z.array(BusinessPackQuickActionSchema).default([]),
  checklist: z.array(BusinessPackChecklistItemSchema).default([]),
  requiredModules: z.array(z.string()).default([]),
  tips: z.array(BusinessPackTipRuleSchema).default([]),
  isFullyImplemented: z.boolean().default(false),
});
export type BusinessPack = z.infer<typeof BusinessPackSchema>;

export const UpdateBusinessTypesDtoSchema = z.object({
  businessTypes: z.array(z.string()).min(1, 'At least one business pack must be selected'),
});
export type UpdateBusinessTypesDto = z.infer<typeof UpdateBusinessTypesDtoSchema>;

// Business Health Score
export const HealthIndicatorSchema = z.object({
  id: z.string(),
  nameEn: z.string(),
  nameBn: z.string(),
  weight: z.number(),
  score: z.number(),
  maxScore: z.number(),
  status: z.enum(['HEALTHY', 'WARNING', 'CRITICAL', 'INSUFFICIENT_DATA']),
  valueDisplay: z.string(),
  explanationEn: z.string(),
  explanationBn: z.string(),
});
export type HealthIndicator = z.infer<typeof HealthIndicatorSchema>;

export const BusinessHealthScoreSchema = z.object({
  score: z.number().nullable(),
  status: z.enum(['HEALTHY', 'WARNING', 'CRITICAL', 'INSUFFICIENT_DATA']),
  statusTextEn: z.string(),
  statusTextBn: z.string(),
  needMoreData: z.boolean(),
  needMoreDataReasonEn: z.string().optional(),
  needMoreDataReasonBn: z.string().optional(),
  indicators: z.array(HealthIndicatorSchema),
  formulaEn: z.string(),
  formulaBn: z.string(),
});
export type BusinessHealthScore = z.infer<typeof BusinessHealthScoreSchema>;

// Smart Tip Result
export const SmartTipSchema = z.object({
  id: z.string(),
  type: z.enum(['OPPORTUNITY', 'WARNING', 'INFO']),
  titleEn: z.string(),
  titleBn: z.string(),
  messageEn: z.string(),
  messageBn: z.string(),
  numbersUsed: z.record(z.string()),
  actionTab: z.string().optional(),
});
export type SmartTip = z.infer<typeof SmartTipSchema>;
