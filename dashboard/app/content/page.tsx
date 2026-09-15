"use client";

import { useEffect, useState, useCallback } from "react";
import {
  API_BASE,
  GeneratedContent,
  getStatusBadgeClass,
  formatDate,
  getStatusLabel,
  getContentTypeLabel,
} from "@/lib/api";

const STATUS_FILTERS = [
  { value: "", label: "الكل" },
  { value: "DRAFT", label: "مسودة" },
  { value: "APPROVED", label: "معتمد" },
  { value: "SCHEDULED", label: "مجدول" },
  { value: "PUBLISHED", label: "منشور" },
  { value: "FAILED", label: "فشل" },
];

export default function ContentPage() {
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<GeneratedContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [editBody, setEditBody] = useState("");

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`${API_BASE}/api/content${query}`);
      const data = await res.json() as { content: GeneratedContent[]; total: number };
      setContent(data.content);
      setTotal(data.total);
    } catch {
      setContent([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  const openContent = (item: GeneratedContent) => {
    setSelected(item);
    setEditBody(item.body);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/content/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody }),
      });
      await fetchContent();
      setSelected(null);
    } finally {
      setSaving(false);
    }
  };

  const approveContent = async (id: string) => {
    await fetch(`${API_BASE}/api/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    await fetchContent();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">✍️ المحتوى المولد</h1>
        <p className="page-subtitle">
          عرض وتعديل كل المحتوى الذي ولّده الوكيل ({total} عنصر)
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`btn btn-sm ${statusFilter === f.value ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px" }}>
          <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: "0 auto" }} />
        </div>
      ) : content.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">
            لا يوجد محتوى بعد. شغّل الوكيل لتوليد المحتوى التسويقي.
          </div>
        </div>
      ) : (
        <div>
          {content.map((item) => (
            <div
              key={item.id}
              className="content-card"
              onClick={() => openContent(item)}
            >
              <div className="content-card-header">
                <div className="content-card-title">
                  {item.title || item.subject || "محتوى بدون عنوان"}
                </div>
                <span className={getStatusBadgeClass(item.status)}>
                  {getStatusLabel(item.status)}
                </span>
              </div>
              <div className="content-card-body">{item.body}</div>
              <div className="content-card-footer">
                <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)", fontSize: 11 }}>
                  {getContentTypeLabel(item.contentType)}
                </span>
                {item.targetPlatform && (
                  <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)", fontSize: 11 }}>
                    📍 {item.targetPlatform}
                  </span>
                )}
                <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginRight: "auto" }}>
                  {formatDate(item.createdAt)}
                </span>
                {item.publishedUrl && (
                  <a
                    href={item.publishedUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: "var(--color-accent)", textDecoration: "none" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    🔗 عرض المنشور
                  </a>
                )}
              </div>
              {item.status === "DRAFT" && (
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      void approveContent(item.id);
                    }}
                  >
                    ✅ اعتماد للنشر
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content Modal */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 16,
              padding: 32,
              maxWidth: 700,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                  {selected.title || selected.subject || "تعديل المحتوى"}
                </h2>
                <span className={getStatusBadgeClass(selected.status)}>
                  {getStatusLabel(selected.status)}
                </span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelected(null)}
              >
                ✕ إغلاق
              </button>
            </div>

            {selected.subject && (
              <div className="form-group">
                <label className="form-label">الموضوع (Subject)</label>
                <input className="form-input" value={selected.subject} readOnly />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">نص المحتوى (قابل للتعديل)</label>
              <textarea
                className="form-textarea"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                style={{ minHeight: 200 }}
              />
            </div>

            {selected.hashtags && (
              <div className="form-group">
                <label className="form-label">الهاشتاقات</label>
                <input className="form-input" value={selected.hashtags} readOnly />
              </div>
            )}

            {selected.callToAction && (
              <div className="form-group">
                <label className="form-label">الدعوة للتصرف</label>
                <input className="form-input" value={selected.callToAction} readOnly />
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => void saveEdit()}
                disabled={saving}
              >
                {saving ? <span className="loading-spinner" /> : "💾 حفظ التعديلات"}
              </button>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
