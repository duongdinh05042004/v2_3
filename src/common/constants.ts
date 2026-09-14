export const CONFIG_KEYS = {
  FIELD_MAPPING: 'field_mapping',
  DEAL_RULES: 'deal_rules',
  ASSIGNMENT_RULES: 'assignment_rules',
  PIPELINE: 'pipeline',
  QUALITY_WEIGHTS: 'quality_weights',
  CAMPAIGN_COSTS: 'campaign_costs',
} as const;

export const QUEUE_NAMES = {
  LEAD_INGESTION: 'lead-ingestion',
  BITRIX_SYNC: 'bitrix-sync',
  TIKTOK_CONVERSION: 'tiktok-conversion',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  DEAD_LETTER: 'dead-letter',
} as const;

export const JOB_NAMES = {
  PROCESS_LEAD: 'process-lead',
  SYNC_LEAD: 'sync-lead',
  SYNC_DEAL: 'sync-deal',
  CONVERT_LEAD: 'convert-lead',
  SEND_CONVERSION: 'send-conversion',
  DAILY_REPORT: 'daily-report',
  STALE_LEAD_ALERT: 'stale-lead-alert',
  NOTIFY: 'notify',
} as const;

export const TIKTOK_EVENTS = {
  LEAD_GENERATE: 'lead.generate',
  FORM_COMPLETE: 'form.complete',
  USER_INTERACTION: 'user.interaction',
} as const;

/** Sample payload uses lead.generate; đề bài also names lead submission / form completion. */
export const TIKTOK_EVENT_ALIASES: Record<string, string> = {
  'lead.generate': TIKTOK_EVENTS.LEAD_GENERATE,
  'lead.submission': TIKTOK_EVENTS.LEAD_GENERATE,
  'lead submission': TIKTOK_EVENTS.LEAD_GENERATE,
  'form.complete': TIKTOK_EVENTS.FORM_COMPLETE,
  'form.completion': TIKTOK_EVENTS.FORM_COMPLETE,
  'form completion': TIKTOK_EVENTS.FORM_COMPLETE,
  'user.interaction': TIKTOK_EVENTS.USER_INTERACTION,
  'user interaction': TIKTOK_EVENTS.USER_INTERACTION,
};

export const LEAD_STATUS = {
  NEW: 'new',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  JUNK: 'junk',
  MERGED: 'merged',
} as const;

export const DEAL_STATUS = {
  OPEN: 'open',
  WON: 'won',
  LOST: 'lost',
} as const;

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
} as const;

export const CACHE_KEYS = {
  MAPPINGS: 'config:mappings',
  RULES: 'config:rules',
  ASSIGNMENT: 'config:assignment',
  PIPELINE: 'config:pipeline',
  DASHBOARD: 'analytics:dashboard',
  CONVERSION_RATES: 'analytics:conversion-rates',
  CAMPAIGN_PERF: 'analytics:campaign-performance',
} as const;
