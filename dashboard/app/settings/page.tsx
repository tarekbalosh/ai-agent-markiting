"use client";

import { useEffect, useState, useCallback } from "react";
import { API_BASE, CampaignConfig } from "@/lib/api";

export default function SettingsPage() {
  const [campaign, setCampaign] = useState<CampaignConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<CampaignConfig>>({});

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/campaigns/active`);
      const data = await res.json() as CampaignConfig | null;
      setCampaign(data);
      if (data) setForm(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCampaign();
  }, [fetchCampaign]);

  const handleSave = async () => {
    if (!campaign) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await fetchCampaign();
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof CampaignConfig, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: "0 auto" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔧 إعدادات الوكيل</h1>
        <p className="page-subtitle">
          تعديل البرومبت الأساسي والإعدادات العامة للحملة التسويقية
        </p>
      </div>

      {!campaign ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
            لا توجد حملة نشطة. قم بتشغيل سكريبت البذر أولاً.
          </p>
          <code style={{ fontSize: 13, background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: 8, display: "block" }}>
            cd backend && npx ts-node prisma/seed.ts
          </code>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 24 }}>
          {/* Campaign Info */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🎯 معلومات الحملة</span>
              {saved && (
                <span style={{ color: "#10b981", fontSize: 13, fontWeight: 600 }}>
                  ✅ تم الحفظ بنجاح
                </span>
              )}
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">اسم الحملة</label>
                  <input
                    className="form-input"
                    value={form.name || ""}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الشركة</label>
                  <input
                    className="form-input"
                    value={form.companyName || ""}
                    onChange={(e) => update("companyName", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">نبذة عن الشركة</label>
                <textarea
                  className="form-textarea"
                  value={form.companyBio || ""}
                  onChange={(e) => update("companyBio", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* AI Prompt Settings */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🧠 إعدادات الذكاء الاصطناعي</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">الجمهور المستهدف</label>
                <textarea
                  className="form-textarea"
                  value={form.targetAudience || ""}
                  onChange={(e) => update("targetAudience", e.target.value)}
                  style={{ minHeight: 80 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">هدف الحملة</label>
                <textarea
                  className="form-textarea"
                  value={form.campaignGoal || ""}
                  onChange={(e) => update("campaignGoal", e.target.value)}
                  style={{ minHeight: 80 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">نبرة الصوت (Tone of Voice)</label>
                <input
                  className="form-input"
                  value={form.toneOfVoice || ""}
                  onChange={(e) => update("toneOfVoice", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">الرسائل الأساسية (Key Messages)</label>
                <textarea
                  className="form-textarea"
                  value={form.keyMessages || ""}
                  onChange={(e) => update("keyMessages", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">نقاط البيع الفريدة (USPs)</label>
                <textarea
                  className="form-textarea"
                  value={form.uniqueSellingPoints || ""}
                  onChange={(e) => update("uniqueSellingPoints", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">المنافسون (اختياري)</label>
                <input
                  className="form-input"
                  value={form.competitors || ""}
                  onChange={(e) => update("competitors", e.target.value)}
                  placeholder="مثال: SAP, Microsoft Dynamics"
                />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📊 حدود النشر اليومي</span>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">أقصى منشورات يومياً</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    max={10}
                    value={form.maxDailyPosts || 2}
                    onChange={(e) => update("maxDailyPosts", parseInt(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">أقصى رسائل بريد يومياً</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    max={200}
                    value={form.maxDailyEmails || 50}
                    onChange={(e) => update("maxDailyEmails", parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* API Keys Guide */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🔑 مفاتيح API (تُعدَّل في ملف .env)</span>
            </div>
            <div className="card-body">
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 16 }}>
                مفاتيح API يجب تحديثها في ملف <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4 }}>backend/.env</code>:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { key: "GEMINI_API_KEY", desc: "مفتاح Google Gemini AI", url: "https://aistudio.google.com/app/apikey" },
                  { key: "RESEND_API_KEY", desc: "مفتاح Resend للبريد الإلكتروني", url: "https://resend.com/api-keys" },
                  { key: "LINKEDIN_ACCESS_TOKEN", desc: "توكن LinkedIn API", url: "https://developer.linkedin.com" },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <code style={{ fontSize: 13, color: "var(--color-accent)", display: "block", marginBottom: 4 }}>
                        {item.key}
                      </code>
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        {item.desc}
                      </span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      الحصول عليه →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button
              className="btn btn-primary"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? <span className="loading-spinner" /> : "💾"}
              حفظ جميع الإعدادات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
