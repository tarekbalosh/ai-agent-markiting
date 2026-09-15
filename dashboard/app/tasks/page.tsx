"use client";

import { useEffect, useState, useCallback } from "react";
import { API_BASE, AgentTask, getStatusBadgeClass, formatDate, getStatusLabel } from "@/lib/api";

const TASK_TYPE_LABELS: Record<string, string> = {
  GENERATE_DAILY_PLAN: "توليد خطة يومية",
  GENERATE_CONTENT: "توليد محتوى",
  PUBLISH_LINKEDIN: "نشر LinkedIn",
  SEND_EMAIL: "إرسال بريد",
  ANALYZE_PERFORMANCE: "تحليل الأداء",
  REFRESH_TOKENS: "تجديد التوكنات",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);
      const data = await res.json() as AgentTask[];
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">⚙️ مهام الوكيل</h1>
        <p className="page-subtitle">سجل بجميع المهام التي قام بها الوكيل</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">المهام ({tasks.length})</span>
          <button className="btn btn-secondary btn-sm" onClick={() => void fetchTasks()}>
            🔄 تحديث
          </button>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="loading-spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: "0 auto" }} />
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">لا توجد مهام بعد</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>المهمة</th>
                  <th>النوع</th>
                  <th>الحالة</th>
                  <th>المحتوى المولد</th>
                  <th>وقت الإنشاء</th>
                  <th>وقت الاكتمال</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  let result: { durationMs?: number } | null = null;
                  try {
                    if (task.result) result = JSON.parse(task.result) as { durationMs?: number };
                  } catch {}

                  return (
                    <tr key={task.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 14 }}>
                          {task.title}
                        </div>
                        {task.errorMessage && (
                          <div style={{ color: "var(--color-accent)", fontSize: 12, marginTop: 4 }}>
                            ❌ {task.errorMessage}
                          </div>
                        )}
                        {result?.durationMs && (
                          <div style={{ color: "var(--color-text-muted)", fontSize: 11, marginTop: 4 }}>
                            ⏱️ {(result.durationMs / 1000).toFixed(1)}ث
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 13 }}>
                          {TASK_TYPE_LABELS[task.taskType] || task.taskType}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(task.status)}>
                          {getStatusLabel(task.status)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {task._count?.generatedContent || 0}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {formatDate(task.createdAt)}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {task.completedAt ? formatDate(task.completedAt) : (
                          <span style={{ color: "var(--color-text-muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
