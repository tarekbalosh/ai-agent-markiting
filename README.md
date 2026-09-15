# 🤖 CoreLogic AI Marketing Agent

> وكيل تسويقي ذكي مستقل يعمل دون تدخل بشري — يولّد المحتوى، ويجدوله، وينشره تلقائياً.

---

## 🏗️ هيكل المشروع

```
ai-agent-markting/
├── backend/                     # خادم Node.js + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma        # ✅ مخطط قاعدة البيانات (5 جداول)
│   │   ├── dev.db               # ✅ SQLite Database
│   │   └── seed.ts              # ✅ بيانات أولية
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.ts        # ✅ Prisma Client Singleton
│   │   ├── services/
│   │   │   ├── constants.ts     # ✅ Type-safe Constants (Enum بديل)
│   │   │   ├── agentBrain.ts    # ✅ عقل الوكيل (Gemini AI)
│   │   │   ├── scheduler.ts     # ✅ Cron Jobs (9ص + 12ظ)
│   │   │   └── integrations/
│   │   │       ├── emailService.ts     # ✅ Resend API
│   │   │       └── linkedinService.ts # ✅ LinkedIn API v2
│   │   └── index.ts             # ✅ Express Server + REST API
│   ├── dist/                    # ✅ Compiled JavaScript
│   ├── .env                     # ← أضف API Keys هنا
│   └── package.json
├── dashboard/                   # Next.js Dashboard
│   ├── app/
│   │   ├── page.tsx             # ✅ لوحة التحكم الرئيسية
│   │   ├── logs/page.tsx        # ✅ سجل النشاط
│   │   ├── content/page.tsx     # ✅ المحتوى المولد
│   │   ├── tasks/page.tsx       # ✅ المهام
│   │   ├── settings/page.tsx    # ✅ الإعدادات
│   │   ├── layout.tsx           # ✅ Layout عربي RTL
│   │   └── globals.css          # ✅ Design System كامل
│   ├── components/
│   │   └── Sidebar.tsx          # ✅ القائمة الجانبية
│   └── lib/
│       └── api.ts               # ✅ API Client + Types
├── render.yaml                  # ✅ Render.com Deployment
├── vercel.json                  # ✅ Vercel Deployment
└── autonomous_agent_prompts.md  # الخارطة الأصلية
```

---

## 🚀 تشغيل المشروع محلياً

### 1. إعداد Backend

```bash
cd backend

# نسخ وتعديل متغيرات البيئة
cp .env.example .env
# افتح .env وأضف:
# GEMINI_API_KEY=your-key-here
# RESEND_API_KEY=your-key-here (اختياري)
# LINKEDIN_ACCESS_TOKEN=your-token-here (اختياري)

# تشغيل الخادم
npm run dev
```

الخادم سيعمل على: http://localhost:3001

### 2. إعداد Dashboard

```bash
cd dashboard

# إنشاء ملف البيئة
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local

# تشغيل Dashboard
npm run dev
```

Dashboard على: http://localhost:3000

---

## 🗓️ كيف يعمل الوكيل يومياً

```
9:00 ص  → استيقاظ الوكيل
         → قراءة CampaignConfig من قاعدة البيانات
         → استدعاء Gemini AI لتوليد الخطة اليومية
         → توليد محتوى LinkedIn + رسائل بريد
         → حفظ المحتوى في قاعدة البيانات

12:00 ظ → جلب المحتوى المعتمد (APPROVED)
         → نشر منشورات LinkedIn تلقائياً
         → إرسال رسائل البريد الترويجية
         → تحديث الحالة إلى PUBLISHED
         → تسجيل كل شيء في ActivityLog

كل ساعة → فحص المهام الفاشلة
```

---

## 📡 REST API Endpoints

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/health` | فحص حالة الخادم |
| GET | `/api/stats` | إحصائيات الـ Dashboard |
| GET | `/api/logs` | سجل النشاط (مع pagination) |
| GET | `/api/content` | المحتوى المولد |
| PATCH | `/api/content/:id` | تعديل محتوى |
| GET | `/api/campaigns` | الحملات التسويقية |
| PATCH | `/api/campaigns/:id` | تحديث إعدادات الحملة |
| GET | `/api/tasks` | مهام الوكيل |
| POST | `/api/agent/trigger/generate` | تشغيل يدوي: توليد |
| POST | `/api/agent/trigger/publish` | تشغيل يدوي: نشر |

---

## 🌐 النشر (Deployment)

### Backend على Render.com

1. ادفع الكود إلى GitHub
2. اربط المستودع بـ Render.com
3. اختر "Background Worker" (لا Web Service!)
4. أضف متغيرات البيئة في Dashboard
5. استخدم PostgreSQL بدلاً من SQLite في الإنتاج:
   ```
   DATABASE_URL=postgresql://...
   ```
6. غيّر `schema.prisma` provider إلى `postgresql`

### Dashboard على Vercel

1. اربط مجلد `dashboard/` بـ Vercel
2. أضف: `NEXT_PUBLIC_API_URL=https://your-render-url.onrender.com`
3. انشر تلقائياً مع كل push

---

## 🔑 متغيرات البيئة المطلوبة

| المتغير | المصدر | الأولوية |
|---------|--------|----------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) | **ضروري** |
| `DATABASE_URL` | SQLite (محلي) / PostgreSQL (إنتاج) | **ضروري** |
| `RESEND_API_KEY` | [Resend.com](https://resend.com/api-keys) | اختياري |
| `LINKEDIN_ACCESS_TOKEN` | [LinkedIn Developer](https://developer.linkedin.com) | اختياري |

---

## ✅ المراحل المكتملة

- [x] المرحلة 1: Prisma Schema (5 جداول)
- [x] المرحلة 2: عقل الوكيل (Gemini AI)
- [x] المرحلة 3: الجدولة (node-cron)
- [x] المرحلة 4: التكاملات (LinkedIn + Resend)
- [x] المرحلة 5: Dashboard (Next.js + CSS)
- [x] المرحلة 6: إعدادات النشر (Render + Vercel)
