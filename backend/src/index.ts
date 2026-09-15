// ===================================================
// نقطة الدخول الرئيسية - CoreLogic AI Marketing Agent
// ===================================================

import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import prisma from "./lib/prisma";
import { startScheduler, triggerManualContentGeneration, triggerManualPublishing } from "./services/scheduler";

const app = express();
const PORT = process.env.PORT || 3001;

// -------------------------------------------------------
// Middleware
// -------------------------------------------------------
app.use(express.json());
const allowedOrigins = [
  "http://localhost:3000",
  "https://corelogic-dashboard.vercel.app",
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [])
];

app.use(
  cors({
    origin: function (origin, callback) {
      // السماح بالطلبات المحلية، ولوحة تحكم Vercel، وأي نطاق مسموح به
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// -------------------------------------------------------
// Health Check
// -------------------------------------------------------
app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "healthy",
      message: "🤖 CoreLogic AI Agent is running",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", database: "disconnected" });
  }
});

// -------------------------------------------------------
// Activity Log API
// -------------------------------------------------------
app.get("/api/logs", async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page || "1"));
    const limit = parseInt(String(req.query.limit || "50"));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { task: true },
      }),
      prisma.activityLog.count(),
    ]);

    res.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: "فشل في جلب السجلات" });
  }
});

// -------------------------------------------------------
// Generated Content API
// -------------------------------------------------------
app.get("/api/content", async (req: Request, res: Response) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const page = parseInt(String(req.query.page || "1"));
    const limit = parseInt(String(req.query.limit || "20"));
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [content, total] = await Promise.all([
      prisma.generatedContent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { campaign: { select: { name: true } } },
      }),
      prisma.generatedContent.count({ where }),
    ]);

    res.json({ content, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: "فشل في جلب المحتوى" });
  }
});

app.get("/api/content/:id", async (req: Request, res: Response) => {
  try {
    const content = await prisma.generatedContent.findUnique({
      where: { id: String(req.params.id) },
      include: { campaign: true, task: true },
    });

    if (!content) {
      res.status(404).json({ error: "المحتوى غير موجود" });
      return;
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ error: "فشل في جلب المحتوى" });
  }
});

app.patch("/api/content/:id", async (req: Request, res: Response) => {
  try {
    const updateData = req.body as { body?: string; title?: string; status?: string };
    const updated = await prisma.generatedContent.update({
      where: { id: String(req.params.id) },
      data: {
        ...(updateData.body && { body: updateData.body }),
        ...(updateData.title && { title: updateData.title }),
        ...(updateData.status && { status: updateData.status }),
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "فشل في تحديث المحتوى" });
  }
});

// -------------------------------------------------------
// Campaign Config API
// -------------------------------------------------------
app.get("/api/campaigns", async (_req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaignConfig.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: "فشل في جلب الحملات" });
  }
});

app.get("/api/campaigns/active", async (_req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaignConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(campaign || null);
  } catch (error) {
    res.status(500).json({ error: "فشل في جلب الحملة النشطة" });
  }
});

app.post("/api/campaigns", async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaignConfig.create({ data: req.body });
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: "فشل في إنشاء الحملة" });
  }
});

app.patch("/api/campaigns/:id", async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaignConfig.update({
      where: { id: String(req.params.id) },
      data: req.body,
    });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: "فشل في تحديث الحملة" });
  }
});

// -------------------------------------------------------
// Agent Tasks API
// -------------------------------------------------------
app.get("/api/tasks", async (_req: Request, res: Response) => {
  try {
    const tasks = await prisma.agentTask.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        campaign: { select: { name: true } },
        _count: { select: { generatedContent: true } },
      },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "فشل في جلب المهام" });
  }
});

// -------------------------------------------------------
// Manual Trigger API (للاختبار)
// -------------------------------------------------------
app.post("/api/agent/trigger/generate", async (_req: Request, res: Response) => {
  try {
    console.log("🔧 [API] تشغيل يدوي: توليد المحتوى...");
    // تشغيل في الخلفية
    triggerManualContentGeneration().catch(console.error);
    res.json({ message: "✅ بدأت مهمة توليد المحتوى في الخلفية" });
  } catch (error) {
    res.status(500).json({ error: "فشل في تشغيل المهمة" });
  }
});

app.post("/api/agent/trigger/publish", async (_req: Request, res: Response) => {
  try {
    console.log("🔧 [API] تشغيل يدوي: النشر...");
    triggerManualPublishing().catch(console.error);
    res.json({ message: "✅ بدأت مهمة النشر في الخلفية" });
  } catch (error) {
    res.status(500).json({ error: "فشل في تشغيل المهمة" });
  }
});

// -------------------------------------------------------
// Stats API للـ Dashboard
// -------------------------------------------------------
app.get("/api/stats", async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalContent,
      publishedToday,
      pendingContent,
      totalTasks,
      failedTasks,
      recentLogs,
    ] = await Promise.all([
      prisma.generatedContent.count(),
      prisma.generatedContent.count({
        where: { status: "PUBLISHED", publishedAt: { gte: today } },
      }),
      prisma.generatedContent.count({
        where: { status: { in: ["DRAFT", "APPROVED", "SCHEDULED"] } },
      }),
      prisma.agentTask.count(),
      prisma.agentTask.count({ where: { status: "FAILED" } }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    res.json({
      totalContent,
      publishedToday,
      pendingContent,
      totalTasks,
      failedTasks,
      recentLogs,
    });
  } catch (error) {
    res.status(500).json({ error: "فشل في جلب الإحصائيات" });
  }
});

// -------------------------------------------------------
// بدء تشغيل الخادم
// -------------------------------------------------------
async function main() {
  // التحقق من الاتصال بقاعدة البيانات وتهيئة البيانات
  try {
    await prisma.$connect();
    console.log("✅ تم الاتصال بقاعدة البيانات بنجاح");
    
    // Auto-seed if database is empty
    const campaignCount = await prisma.campaignConfig.count();
    if (campaignCount === 0) {
      console.log("🌱 لا توجد حملات تسويقية. يتم تهيئة البيانات الأولية (Seed)...");
      await prisma.campaignConfig.create({
        data: {
          id: "seed-campaign-001",
          name: "حملة Q4 2026 - أتمتة الأعمال",
          isActive: true,
          companyName: "CoreLogic Systems",
          companyBio: "CoreLogic Systems هي شركة برمجيات سعودية رائدة متخصصة في بناء أنظمة أتمتة الأعمال وحلول ERP والذكاء الاصطناعي للمؤسسات والشركات المتوسطة.",
          targetAudience: "مدراء تقنية المعلومات (CTO/CIO) ومدراء العمليات في الشركات المتوسطة والكبيرة في السعودية والخليج العربي، مع تركيز على قطاعات: التصنيع، والتجزئة، والخدمات اللوجستية",
          campaignGoal: "توليد 50 عميل محتمل (Lead) شهرياً مهتمين بشراء نظام أتمتة الأعمال CoreLogic ERP. التركيز على الشركات ذات أكثر من 50 موظفاً",
          toneOfVoice: "مهني وخبير، يتحدث لغة رجال الأعمال، يركز على القيمة والعائد على الاستثمار (ROI)، عربي فصيح مع مصطلحات تقنية إنجليزية مقبولة",
          keyMessages: "وفّر 40% من وقت فريقك مع أتمتة CoreLogic | قرارات أذكى مبنية على بيانات حقيقية في الوقت الفعلي | تكامل سلس مع أنظمتك الحالية خلال أسبوعين فقط | دعم تقني 24/7 باللغة العربية",
          competitors: "SAP Business One, Microsoft Dynamics 365, Oracle NetSuite, Odoo",
          uniqueSellingPoints: "الوحيد المصمم خصيصاً للشركات العربية | تكلفة أقل بـ 60% من SAP | تطبيق خلال أسبوعين (مقارنة بـ 6 أشهر للمنافسين) | واجهة عربية كاملة مع دعم اللغة العربية في التقارير | استضافة على سيرفرات سعودية لضمان سيادة البيانات",
          maxDailyPosts: 2,
          maxDailyEmails: 30,
          preferredPostTime: "09:00",
          preferredEmailTime: "10:00",
        }
      });
      console.log("✅ تم حقن الحملة التسويقية الأساسية بنجاح.");
    }
  } catch (error) {
    console.error("❌ فشل الاتصال بقاعدة البيانات:", error);
    process.exit(1);
  }

  // بدء الخادم
  app.listen(PORT, () => {
    console.log("\n🚀 ========================================");
    console.log(`🚀 CoreLogic AI Marketing Agent`);
    console.log(`🚀 الخادم يعمل على: http://localhost:${PORT}`);
    console.log(`🚀 البيئة: ${process.env.NODE_ENV || "development"}`);
    console.log("🚀 ========================================\n");
  });

  // بدء الجدول الزمني
  startScheduler();

  // معالجة الإنهاء النظيف
  process.on("SIGTERM", async () => {
    console.log("⏹️ إيقاف الخادم...");
    await prisma.$disconnect();
    process.exit(0);
  });
}

main();
