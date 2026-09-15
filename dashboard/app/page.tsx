"use client";

import { useEffect, useState, useCallback } from "react";
import { API_BASE, Stats, ActivityLog, getEventIcon, formatDate } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      const data = await res.json() as Stats;
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
    const interval = setInterval(() => void fetchStats(), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const triggerAgent = async (action: "generate" | "publish") => {
    setTriggering(action);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/agent/trigger/${action}`, {
        method: "POST",
      });
      const data = await res.json() as { message: string };
      setMessage(data.message);
      setTimeout(() => setMessage(null), 5000);
      setTimeout(() => void fetchStats(), 3000);
    } catch {
      setMessage("❌ تعذر الاتصال بالخادم");
    } finally {
      setTriggering(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", flexDirection: "column", gap: "16px" }}>
        <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p style={{ color: "var(--color-text-muted)" }}>جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">🤖 لوحة التحكم الرئيسية</h1>
        <p className="page-subtitle">
          نظرة عامة على أداء الوكيل التسويقي المستقل لـ CoreLogic Systems
        </p>
      </div>

      {/* Agent Status */}
      <div className="agent-status">
        <div className="status-dot" />
        <span className="status-text">
          الوكيل التسويقي نشط ويعمل — الجدولة: 9:00 ص (توليد) | 12:00 ظ (نشر)
        </span>
      </div>

      {/* Manual Trigger Buttons */}
      <div className="trigger-section">
        <button
          className="trigger-btn trigger-btn-generate"
          onClick={() => void triggerAgent("generate")}
          disabled={triggering !== null}
        >
          {triggering === "generate" ? (
            <span className="loading-spinner" />
          ) : (
            "🧠"
          )}
          تشغيل يدوي: توليد المحتوى
        </button>
        <button
          className="trigger-btn trigger-btn-publish"
          onClick={() => void triggerAgent("publish")}
          disabled={triggering !== null}
        >
          {triggering === "publish" ? (
            <span className="loading-spinner" />
          ) : (
            "🚀"
          )}
          تشغيل يدوي: نشر المحتوى
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: 8,
            color: "#10b981",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {message}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card red">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{stats.totalContent}</div>
            <div className="stat-label">إجمالي المحتوى المولد</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">🚀</div>
            <div className="stat-value">{stats.publishedToday}</div>
            <div className="stat-label">منشور اليوم</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{stats.pendingContent}</div>
            <div className="stat-label">في انتظار النشر</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon">⚙️</div>
            <div className="stat-value">{stats.totalTasks}</div>
            <div className="stat-label">إجمالي المهام</div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🕐 آخر نشاطات الوكيل</span>
          <a href="/logs" style={{ fontSize: 13, color: "var(--color-accent)", textDecoration: "none" }}>
            عرض الكل →
          </a>
        </div>
        <div className="card-body">
          {stats?.recentLogs && stats.recentLogs.length > 0 ? (
            stats.recentLogs.map((log: ActivityLog) => (
              <div
                key={log.id}
                className={`log-item level-${log.level.toLowerCase()}`}
              >
                <div className="log-icon">{getEventIcon(log.eventType)}</div>
                <div className="log-content">
                  <div className="log-message">{log.message}</div>
                  <div className="log-meta">
                    <span className="log-time">{formatDate(log.createdAt)}</span>
                    {log.module && (
                      <span className="log-module">{log.module}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">
                لا يوجد نشاط بعد. شغّل الوكيل يدوياً أو انتظر الجدول الزمني.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
