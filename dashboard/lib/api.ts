// API configuration for backend connection
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

// Types
export interface ActivityLog {
  id: string;
  eventType: string;
  level: string;
  message: string;
  module: string | null;
  action: string | null;
  details: string | null;
  durationMs: number | null;
  createdAt: string;
  task?: { title: string; taskType: string } | null;
}

export interface GeneratedContent {
  id: string;
  contentType: string;
  status: string;
  title: string | null;
  body: string;
  subject: string | null;
  hashtags: string | null;
  callToAction: string | null;
  targetPlatform: string | null;
  publishedUrl: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  campaign?: { name: string };
}

export interface AgentTask {
  id: string;
  taskType: string;
  status: string;
  title: string;
  result: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  campaign?: { name: string };
  _count?: { generatedContent: number };
}

export interface Stats {
  totalContent: number;
  publishedToday: number;
  pendingContent: number;
  totalTasks: number;
  failedTasks: number;
  recentLogs: ActivityLog[];
}

export interface CampaignConfig {
  id: string;
  name: string;
  isActive: boolean;
  companyName: string;
  companyBio: string;
  targetAudience: string;
  campaignGoal: string;
  toneOfVoice: string;
  keyMessages: string;
  competitors: string | null;
  uniqueSellingPoints: string;
  maxDailyPosts: number;
  maxDailyEmails: number;
}

// Helper functions
export function getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    AGENT_WAKE_UP: "🌅",
    PLAN_GENERATED: "📋",
    CONTENT_GENERATED: "✍️",
    CONTENT_PUBLISHED: "🚀",
    EMAIL_SENT: "📧",
    TASK_STARTED: "▶️",
    TASK_COMPLETED: "✅",
    TASK_FAILED: "❌",
    ERROR: "🔴",
    INFO: "ℹ️",
    API_CALL: "🔗",
  };
  return icons[eventType] || "📌";
}

export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    PUBLISHED: "badge-published",
    APPROVED: "badge-approved",
    DRAFT: "badge-draft",
    FAILED: "badge-failed",
    SCHEDULED: "badge-scheduled",
    PENDING: "badge-pending",
    COMPLETED: "badge-completed",
    RUNNING: "badge-running",
  };
  return `badge ${classes[status] || "badge-draft"}`;
}

export function getPlatformBadgeClass(platform: string): string {
  if (platform?.includes("LINKEDIN") || platform === "LinkedIn") return "badge badge-linkedin";
  if (platform?.includes("EMAIL") || platform === "Email") return "badge badge-email";
  return "badge badge-draft";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PUBLISHED: "منشور",
    APPROVED: "معتمد",
    DRAFT: "مسودة",
    FAILED: "فشل",
    SCHEDULED: "مجدول",
    PENDING: "انتظار",
    COMPLETED: "مكتمل",
    RUNNING: "جاري",
    CANCELLED: "ملغي",
  };
  return labels[status] || status;
}

export function getContentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LINKEDIN_POST: "منشور LinkedIn",
    COLD_EMAIL: "بريد ترويجي",
    TWITTER_POST: "منشور Twitter",
    BLOG_POST: "مقال مدونة",
  };
  return labels[type] || type;
}
