// ===================================================
// Agent Brain - عقل الوكيل التسويقي المستقل
// يستخدم Gemini AI لتوليد المحتوى التسويقي يومياً
// ===================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../lib/prisma";
import {
  ContentType,
  ContentStatus,
  TaskType,
  TaskStatus,
  LogEventType,
  LogLevel,
} from "./constants";
import { CampaignConfig } from "@prisma/client";

// -------------------------------------------------------
// تهيئة Gemini AI
// -------------------------------------------------------
function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  return genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
}

// -------------------------------------------------------
// الأنواع المساعدة
// -------------------------------------------------------
interface DailyPlanItem {
  type: string;
  platform: string;
  title: string;
  priority: number;
  reasoning: string;
}

interface DailyPlan {
  date: string;
  contentItems: DailyPlanItem[];
  summary: string;
}

interface GeneratedContentData {
  title: string;
  body: string;
  subject?: string;
  hashtags?: string;
  callToAction?: string;
  targetAudience: string;
}

// -------------------------------------------------------
// دالة تسجيل النشاط في قاعدة البيانات
// -------------------------------------------------------
async function logActivity(
  eventType: string,
  message: string,
  options: {
    level?: string;
    taskId?: string;
    module?: string;
    action?: string;
    details?: object;
    durationMs?: number;
    errorCode?: string;
    stackTrace?: string;
  } = {}
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      eventType,
      level: options.level || LogLevel.INFO,
      message,
      taskId: options.taskId || null,
      module: options.module || "agentBrain",
      action: options.action || null,
      details: options.details ? JSON.stringify(options.details) : null,
      durationMs: options.durationMs || null,
      errorCode: options.errorCode || null,
      stackTrace: options.stackTrace || null,
    },
  });
}

// -------------------------------------------------------
// 1. توليد الخطة اليومية
// -------------------------------------------------------
export async function generateDailyPlan(
  campaign: CampaignConfig
): Promise<DailyPlan> {
  const startTime = Date.now();
  const today = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  console.log(
    `\n🧠 [AgentBrain] بدء توليد الخطة اليومية لـ ${campaign.name}...`
  );

  const planningPrompt = `
أنت مدير تسويق رقمي متخصص وخبير في الـ B2B لشركة برمجيات عربية.

## معلومات الشركة والحملة:
- الشركة: ${campaign.companyName}
- نبذة: ${campaign.companyBio}
- الجمهور المستهدف: ${campaign.targetAudience}
- هدف الحملة: ${campaign.campaignGoal}
- نبرة الصوت: ${campaign.toneOfVoice}
- الرسائل الأساسية: ${campaign.keyMessages}
- نقاط البيع الفريدة: ${campaign.uniqueSellingPoints}
${campaign.competitors ? `- المنافسون: ${campaign.competitors}` : ""}

## المهمة:
اليوم هو ${today}. قم بإنشاء خطة تسويقية يومية دقيقة ومتنوعة.
الحد الأقصى: ${campaign.maxDailyPosts} منشورات و${campaign.maxDailyEmails} رسالة بريد.

أجب بـ JSON فقط بهذا الشكل الدقيق:
{
  "date": "${new Date().toISOString().split("T")[0]}",
  "contentItems": [
    {
      "type": "LINKEDIN_POST",
      "platform": "LinkedIn",
      "title": "عنوان قصير للمحتوى",
      "priority": 1,
      "reasoning": "سبب اختيار هذا المحتوى اليوم"
    },
    {
      "type": "COLD_EMAIL",
      "platform": "Email",
      "title": "موضوع الرسالة",
      "priority": 2,
      "reasoning": "سبب اختيار هذه الرسالة"
    }
  ],
  "summary": "ملخص قصير لخطة اليوم بالعربية"
}
`;

  const model = getModel();
  const result = await model.generateContent(planningPrompt);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("فشل في استخراج JSON من رد Gemini");
  }

  const plan: DailyPlan = JSON.parse(jsonMatch[0]);
  const durationMs = Date.now() - startTime;

  await logActivity(
    LogEventType.PLAN_GENERATED,
    `✅ تم توليد الخطة اليومية: ${plan.contentItems.length} محتوى`,
    {
      action: "GENERATE_DAILY_PLAN",
      details: { plan, campaignId: campaign.id },
      durationMs,
    }
  );

  console.log(`✅ [AgentBrain] تم توليد الخطة: ${plan.summary}`);
  return plan;
}

// -------------------------------------------------------
// 2. توليد محتوى LinkedIn Post
// -------------------------------------------------------
export async function generateLinkedInPost(
  campaign: CampaignConfig,
  contentTitle: string
): Promise<GeneratedContentData> {
  const startTime = Date.now();

  const prompt = `
أنت كاتب محتوى تسويقي B2B متخصص في LinkedIn.

## السياق:
- الشركة: ${campaign.companyName}
- هدف الحملة: ${campaign.campaignGoal}
- الجمهور المستهدف: ${campaign.targetAudience}
- نبرة الصوت: ${campaign.toneOfVoice}
- نقاط القوة: ${campaign.uniqueSellingPoints}
- الرسائل الأساسية: ${campaign.keyMessages}

## موضوع المنشور المطلوب:
${contentTitle}

## قواعد كتابة المنشور:
1. ابدأ بجملة افتتاحية قوية تثير الفضول (Hook)
2. اكتب المحتوى باللغة العربية مع مصطلحات تقنية إنجليزية عند الحاجة
3. اجعل المنشور بين 150-300 كلمة
4. أضف 3-5 نقاط قيمة
5. اختم بـ Call to Action واضح
6. أضف 5-7 هاشتاقات ذات صلة

أجب بـ JSON فقط:
{
  "title": "عنوان المنشور",
  "body": "نص المنشور الكامل",
  "hashtags": "#هاشتاق1 #هاشتاق2 #TechAr #B2B #Automation",
  "callToAction": "الدعوة للتصرف",
  "targetAudience": "${campaign.targetAudience}"
}
`;

  const model = getModel();
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch)
    throw new Error("فشل في استخراج JSON من رد Gemini (LinkedIn Post)");

  const content: GeneratedContentData = JSON.parse(jsonMatch[0]);

  await logActivity(
    LogEventType.CONTENT_GENERATED,
    `📝 تم توليد منشور LinkedIn: "${content.title}"`,
    {
      action: "GENERATE_LINKEDIN_POST",
      details: { title: content.title, campaignId: campaign.id },
      durationMs: Date.now() - startTime,
    }
  );

  return content;
}

// -------------------------------------------------------
// 3. توليد بريد إلكتروني ترويجي (Cold Email)
// -------------------------------------------------------
export async function generateColdEmail(
  campaign: CampaignConfig,
  contentTitle: string
): Promise<GeneratedContentData> {
  const startTime = Date.now();

  const prompt = `
أنت متخصص في كتابة رسائل البريد الإلكتروني التسويقية الباردة (Cold Email) للشركات B2B.

## السياق:
- الشركة المرسِلة: ${campaign.companyName}
- هدف الحملة: ${campaign.campaignGoal}
- الجمهور المستهدف: ${campaign.targetAudience}
- نبرة الصوت: ${campaign.toneOfVoice}
- نقاط البيع الفريدة: ${campaign.uniqueSellingPoints}

## موضوع الرسالة:
${contentTitle}

## قواعد الكتابة:
1. اجعل سطر الموضوع فضولياً وشخصياً
2. ابدأ الرسالة بشكل شخصي
3. كن مختصراً (100-150 كلمة)
4. ركز على مشكلة العميل وكيف تحلها
5. اختم بسؤال سهل الإجابة لفتح حوار
6. اكتب باللغة العربية الفصحى

أجب بـ JSON فقط:
{
  "title": "عنوان داخلي للرسالة",
  "subject": "سطر الموضوع",
  "body": "نص الرسالة الكامل",
  "callToAction": "الدعوة للتصرف",
  "targetAudience": "${campaign.targetAudience}"
}
`;

  const model = getModel();
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch)
    throw new Error("فشل في استخراج JSON من رد Gemini (Cold Email)");

  const content: GeneratedContentData = JSON.parse(jsonMatch[0]);

  await logActivity(
    LogEventType.CONTENT_GENERATED,
    `📧 تم توليد رسالة بريد: "${content.subject}"`,
    {
      action: "GENERATE_COLD_EMAIL",
      details: { subject: content.subject, campaignId: campaign.id },
      durationMs: Date.now() - startTime,
    }
  );

  return content;
}

// -------------------------------------------------------
// 4. الدالة الرئيسية: تشغيل دورة الوكيل اليومية الكاملة
// -------------------------------------------------------
export async function runDailyAgentCycle(): Promise<void> {
  const startTime = Date.now();
  console.log("\n🤖 ============================");
  console.log("🤖 الوكيل التسويقي استيقظ!");
  console.log(`🤖 ${new Date().toLocaleString("ar-SA")}`);
  console.log("🤖 ============================\n");

  await logActivity(
    LogEventType.AGENT_WAKE_UP,
    "🌅 الوكيل التسويقي المستقل استيقظ وبدأ دورته اليومية",
    {
      level: LogLevel.INFO,
      action: "DAILY_CYCLE_START",
    }
  );

  try {
    // 1. جلب الحملة النشطة
    const campaign = await prisma.campaignConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!campaign) {
      console.log("⚠️ [AgentBrain] لا توجد حملة نشطة. إيقاف الدورة.");
      await logActivity(
        LogEventType.INFO,
        "⚠️ لا توجد حملة تسويقية نشطة",
        {
          level: LogLevel.WARN,
          action: "NO_ACTIVE_CAMPAIGN",
        }
      );
      return;
    }

    console.log(`📋 [AgentBrain] الحملة النشطة: "${campaign.name}"`);

    // 2. إنشاء مهمة التوليد في DB
    const generationTask = await prisma.agentTask.create({
      data: {
        campaignId: campaign.id,
        taskType: TaskType.GENERATE_DAILY_PLAN,
        status: TaskStatus.RUNNING,
        title: `خطة يوم ${new Date().toLocaleDateString("ar-SA")}`,
        scheduledAt: new Date(),
        startedAt: new Date(),
      },
    });

    // 3. توليد الخطة اليومية
    const dailyPlan = await generateDailyPlan(campaign);

    // 4. توليد المحتوى لكل عنصر في الخطة
    for (const item of dailyPlan.contentItems) {
      console.log(`\n📝 [AgentBrain] توليد: ${item.title} (${item.type})`);

      let contentData: GeneratedContentData;

      if (item.type === ContentType.LINKEDIN_POST) {
        contentData = await generateLinkedInPost(campaign, item.title);
      } else if (item.type === ContentType.COLD_EMAIL) {
        contentData = await generateColdEmail(campaign, item.title);
      } else {
        console.log(`⚠️ [AgentBrain] نوع محتوى غير مدعوم: ${item.type}`);
        continue;
      }

      // 5. حفظ المحتوى في قاعدة البيانات
      const scheduledTime = new Date();
      scheduledTime.setHours(
        item.type === ContentType.LINKEDIN_POST ? 12 : 10,
        0,
        0,
        0
      );

      await prisma.generatedContent.create({
        data: {
          campaignId: campaign.id,
          taskId: generationTask.id,
          contentType: item.type,
          status: ContentStatus.APPROVED,
          title: contentData.title,
          body: contentData.body,
          subject: contentData.subject || null,
          hashtags: contentData.hashtags || null,
          callToAction: contentData.callToAction || null,
          targetPlatform: item.platform,
          targetAudience: contentData.targetAudience,
          aiModel: "gemini-3.6-flash",
          scheduledAt: scheduledTime,
        },
      });

      console.log(`✅ [AgentBrain] تم حفظ: "${contentData.title}"`);
    }

    // 6. تحديث حالة المهمة إلى مكتملة
    const totalDuration = Date.now() - startTime;
    await prisma.agentTask.update({
      where: { id: generationTask.id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        result: JSON.stringify({
          planSummary: dailyPlan.summary,
          contentCount: dailyPlan.contentItems.length,
          durationMs: totalDuration,
        }),
      },
    });

    console.log(`\n🎉 [AgentBrain] اكتملت الدورة اليومية بنجاح!`);
    console.log(
      `⏱️ الوقت المستغرق: ${(totalDuration / 1000).toFixed(1)} ثانية`
    );
    console.log(
      `📊 المحتوى المولد: ${dailyPlan.contentItems.length} عنصر\n`
    );

    await logActivity(
      LogEventType.TASK_COMPLETED,
      `🎉 اكتملت الدورة اليومية بنجاح! تم توليد ${dailyPlan.contentItems.length} محتوى`,
      {
        taskId: generationTask.id,
        action: "DAILY_CYCLE_COMPLETE",
        details: {
          contentCount: dailyPlan.contentItems.length,
          planSummary: dailyPlan.summary,
        },
        durationMs: totalDuration,
      }
    );
  } catch (error) {
    const err = error as Error;
    console.error(`\n❌ [AgentBrain] خطأ في الدورة اليومية:`, err.message);

    await logActivity(
      LogEventType.TASK_FAILED,
      `❌ خطأ في الدورة اليومية: ${err.message}`,
      {
        level: LogLevel.ERROR,
        action: "DAILY_CYCLE_ERROR",
        details: { error: err.message },
        stackTrace: err.stack,
      }
    );

    throw error;
  }
}
