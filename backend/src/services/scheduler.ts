// ===================================================
// Scheduler - الجدولة الزمنية للوكيل
// يستخدم node-cron لتشغيل المهام تلقائياً
// ===================================================

import cron from "node-cron";
import prisma from "../lib/prisma";
import { runDailyAgentCycle } from "./agentBrain";
import { publishToLinkedIn } from "./integrations/linkedinService";
import { sendColdEmail } from "./integrations/emailService";
import { LogEventType, LogLevel, ContentStatus, TaskType, TaskStatus } from "./constants";

// -------------------------------------------------------
// تسجيل النشاط
// -------------------------------------------------------
async function log(
  eventType: string,
  message: string,
  level: string = LogLevel.INFO,
  details?: object
) {
  console.log(`[Scheduler] ${message}`);
  await prisma.activityLog.create({
    data: {
      eventType,
      level,
      message,
      module: "scheduler",
      details: details ? JSON.stringify(details) : null,
    },
  });
}

// -------------------------------------------------------
// 🕘 Cron Job 1: 9:00 صباحاً - توليد المحتوى اليومي
// -------------------------------------------------------
async function runContentGenerationJob() {
  console.log("\n⏰ ================================");
  console.log("⏰ [Scheduler] 9:00 ص - بدء مهمة توليد المحتوى");
  console.log("⏰ ================================\n");

  try {
    await runDailyAgentCycle();
    console.log("✅ [Scheduler] انتهت مهمة توليد المحتوى بنجاح");
  } catch (error) {
    const err = error as Error;
    console.error("❌ [Scheduler] فشلت مهمة التوليد:", err.message);
    await log(
      LogEventType.TASK_FAILED,
      `❌ فشلت مهمة توليد المحتوى: ${err.message}`,
      LogLevel.ERROR,
      { error: err.message, stack: err.stack }
    );
  }
}

// -------------------------------------------------------
// 🕛 Cron Job 2: 12:00 ظهراً - النشر التلقائي
// -------------------------------------------------------
async function runPublishingJob() {
  console.log("\n⏰ ================================");
  console.log("⏰ [Scheduler] 12:00 ظ - بدء مهمة النشر التلقائي");
  console.log("⏰ ================================\n");

  const startTime = Date.now();
  let publishedCount = 0;
  let failedCount = 0;

  try {
    // جلب المحتوى المعتمد والجاهز للنشر
    const contentToPublish = await prisma.generatedContent.findMany({
      where: {
        status: ContentStatus.APPROVED,
        scheduledAt: {
          lte: new Date(),
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    if (contentToPublish.length === 0) {
      console.log("ℹ️ [Scheduler] لا يوجد محتوى جاهز للنشر الآن");
      await log(
        LogEventType.INFO,
        "ℹ️ لا يوجد محتوى جاهز للنشر في هذه الدورة",
        LogLevel.INFO
      );
      return;
    }

    console.log(
      `📦 [Scheduler] وجد ${contentToPublish.length} محتوى للنشر`
    );

    // تحديث حالة المحتوى إلى SCHEDULED
    for (const content of contentToPublish) {
      await prisma.generatedContent.update({
        where: { id: content.id },
        data: { status: ContentStatus.SCHEDULED },
      });
    }

    // نشر كل محتوى
    for (const content of contentToPublish) {
      console.log(
        `\n📤 [Scheduler] نشر: "${content.title}" (${content.contentType})`
      );

      try {
        if (content.contentType === "LINKEDIN_POST") {
          const result = await publishToLinkedIn(
            content.body,
            content.hashtags || "",
            content.id
          );

          if (result.success) {
            publishedCount++;
            console.log(`✅ [Scheduler] نُشر على LinkedIn بنجاح`);
          } else {
            failedCount++;
            console.error(`❌ [Scheduler] فشل النشر على LinkedIn: ${result.error}`);
          }
        } else if (content.contentType === "COLD_EMAIL") {
          // للتطوير: إرسال بريد تجريبي
          const testEmail =
            process.env.TEST_EMAIL || "test@corelogic-systems.com";

          const result = await sendColdEmail(
            testEmail,
            content.subject || content.title || "رسالة من CoreLogic Systems",
            content.body,
            content.id
          );

          if (result.success) {
            publishedCount++;
            console.log(`✅ [Scheduler] أُرسل البريد إلى ${testEmail}`);
          } else {
            failedCount++;
            console.error(`❌ [Scheduler] فشل إرسال البريد: ${result.error}`);
          }
        } else {
          console.log(
            `⚠️ [Scheduler] نوع غير مدعوم للنشر: ${content.contentType}`
          );
          await prisma.generatedContent.update({
            where: { id: content.id },
            data: { status: ContentStatus.APPROVED }, // إعادة لـ APPROVED
          });
        }
      } catch (itemError) {
        const err = itemError as Error;
        failedCount++;
        console.error(`❌ [Scheduler] خطأ في نشر "${content.title}":`, err.message);

        await prisma.generatedContent.update({
          where: { id: content.id },
          data: { status: "FAILED" },
        });
      }

      // تأخير قصير بين كل نشر
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const durationMs = Date.now() - startTime;
    const summary = `📊 انتهى النشر: ${publishedCount} نجح، ${failedCount} فشل`;
    console.log(`\n${summary}`);

    await log(LogEventType.TASK_COMPLETED, summary, LogLevel.INFO, {
      publishedCount,
      failedCount,
      totalContent: contentToPublish.length,
      durationMs,
    });
  } catch (error) {
    const err = error as Error;
    console.error("❌ [Scheduler] خطأ كبير في مهمة النشر:", err.message);
    await log(
      LogEventType.TASK_FAILED,
      `❌ خطأ حرج في مهمة النشر: ${err.message}`,
      LogLevel.ERROR,
      { error: err.message }
    );
  }
}

// -------------------------------------------------------
// تشغيل جميع الـ Cron Jobs
// -------------------------------------------------------
export function startScheduler() {
  console.log("\n🗓️ [Scheduler] بدء تشغيل الجدول الزمني للوكيل...");

  // ===== مهمة 1: توليد المحتوى - كل يوم الساعة 9:00 صباحاً =====
  cron.schedule(
    "0 9 * * *",
    async () => {
      await runContentGenerationJob();
    },
    {
      timezone: "Asia/Riyadh",
    }
  );

  // ===== مهمة 2: النشر التلقائي - كل يوم الساعة 12:00 ظهراً =====
  cron.schedule(
    "0 12 * * *",
    async () => {
      await runPublishingJob();
    },
    {
      timezone: "Asia/Riyadh",
    }
  );

  // ===== مهمة 3: فحص دوري للمهام الفاشلة - كل ساعة =====
  cron.schedule(
    "0 * * * *",
    async () => {
      const failedTasks = await prisma.agentTask.count({
        where: {
          status: TaskStatus.FAILED,
          retryCount: { lt: 3 },
        },
      });

      if (failedTasks > 0) {
        console.log(
          `⚠️ [Scheduler] وجد ${failedTasks} مهمة فاشلة قابلة للإعادة`
        );
        await log(
          LogEventType.INFO,
          `⚠️ ${failedTasks} مهمة فاشلة تحتاج مراجعة`,
          LogLevel.WARN,
          { failedTasks }
        );
      }
    },
    {
      timezone: "Asia/Riyadh",
    }
  );

  console.log("✅ [Scheduler] الجدول الزمني جاهز:");
  console.log("   📅 9:00 ص  → توليد المحتوى اليومي");
  console.log("   📅 12:00 ظ → النشر التلقائي");
  console.log("   📅 كل ساعة → فحص المهام الفاشلة");
  console.log("   🌍 التوقيت: Asia/Riyadh\n");
}

// -------------------------------------------------------
// تشغيل يدوي للاختبار
// -------------------------------------------------------
export async function triggerManualContentGeneration() {
  console.log("🔧 [Scheduler] تشغيل يدوي: توليد المحتوى...");
  await runContentGenerationJob();
}

export async function triggerManualPublishing() {
  console.log("🔧 [Scheduler] تشغيل يدوي: النشر...");
  await runPublishingJob();
}
