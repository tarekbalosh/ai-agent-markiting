// ===================================================
// Constants - قيم الـ Enum كـ Constants
// بديل عن Prisma Enums لدعم SQLite
// ===================================================

export const TaskType = {
  GENERATE_DAILY_PLAN: "GENERATE_DAILY_PLAN",
  GENERATE_CONTENT: "GENERATE_CONTENT",
  PUBLISH_LINKEDIN: "PUBLISH_LINKEDIN",
  SEND_EMAIL: "SEND_EMAIL",
  ANALYZE_PERFORMANCE: "ANALYZE_PERFORMANCE",
  REFRESH_TOKENS: "REFRESH_TOKENS",
} as const;

export const TaskStatus = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  SKIPPED: "SKIPPED",
} as const;

export const ContentType = {
  LINKEDIN_POST: "LINKEDIN_POST",
  COLD_EMAIL: "COLD_EMAIL",
  TWITTER_POST: "TWITTER_POST",
  BLOG_POST: "BLOG_POST",
  NEWSLETTER: "NEWSLETTER",
} as const;

export const ContentStatus = {
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED",
  ARCHIVED: "ARCHIVED",
} as const;

export const Platform = {
  LINKEDIN: "LINKEDIN",
  TWITTER: "TWITTER",
  EMAIL_SMTP: "EMAIL_SMTP",
  EMAIL_RESEND: "EMAIL_RESEND",
  HUBSPOT: "HUBSPOT",
} as const;

export const LogEventType = {
  AGENT_WAKE_UP: "AGENT_WAKE_UP",
  PLAN_GENERATED: "PLAN_GENERATED",
  CONTENT_GENERATED: "CONTENT_GENERATED",
  CONTENT_PUBLISHED: "CONTENT_PUBLISHED",
  EMAIL_SENT: "EMAIL_SENT",
  TASK_STARTED: "TASK_STARTED",
  TASK_COMPLETED: "TASK_COMPLETED",
  TASK_FAILED: "TASK_FAILED",
  ERROR: "ERROR",
  INFO: "INFO",
  API_CALL: "API_CALL",
} as const;

export const LogLevel = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  CRITICAL: "CRITICAL",
} as const;

export type TaskTypeValue = typeof TaskType[keyof typeof TaskType];
export type TaskStatusValue = typeof TaskStatus[keyof typeof TaskStatus];
export type ContentTypeValue = typeof ContentType[keyof typeof ContentType];
export type ContentStatusValue = typeof ContentStatus[keyof typeof ContentStatus];
export type PlatformValue = typeof Platform[keyof typeof Platform];
export type LogEventTypeValue = typeof LogEventType[keyof typeof LogEventType];
export type LogLevelValue = typeof LogLevel[keyof typeof LogLevel];
