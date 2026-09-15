// ===================================================
// Database Seeder - بيانات أولية لـ CoreLogic Systems
// يُنشئ حملة تسويقية نموذجية وإعدادات أولية
// ===================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 بدء تهيئة قاعدة البيانات بالبيانات الأولية...\n");

  // -------------------------------------------------------
  // 1. إنشاء الحملة التسويقية الرئيسية
  // -------------------------------------------------------
  const campaign = await prisma.campaignConfig.upsert({
    where: { id: "seed-campaign-001" },
    update: {},
    create: {
      id: "seed-campaign-001",
      name: "حملة Q4 2026 - أتمتة الأعمال",
      isActive: true,
      companyName: "CoreLogic Systems",
      companyBio:
        "CoreLogic Systems هي شركة برمجيات سعودية رائدة متخصصة في بناء أنظمة أتمتة الأعمال وحلول ERP والذكاء الاصطناعي للمؤسسات والشركات المتوسطة.",
      targetAudience:
        "مدراء تقنية المعلومات (CTO/CIO) ومدراء العمليات في الشركات المتوسطة والكبيرة في السعودية والخليج العربي، مع تركيز على قطاعات: التصنيع، والتجزئة، والخدمات اللوجستية",
      campaignGoal:
        "توليد 50 عميل محتمل (Lead) شهرياً مهتمين بشراء نظام أتمتة الأعمال CoreLogic ERP. التركيز على الشركات ذات أكثر من 50 موظفاً",
      toneOfVoice:
        "مهني وخبير، يتحدث لغة رجال الأعمال، يركز على القيمة والعائد على الاستثمار (ROI)، عربي فصيح مع مصطلحات تقنية إنجليزية مقبولة",
      keyMessages: [
        "وفّر 40% من وقت فريقك مع أتمتة CoreLogic",
        "قرارات أذكى مبنية على بيانات حقيقية في الوقت الفعلي",
        "تكامل سلس مع أنظمتك الحالية خلال أسبوعين فقط",
        "دعم تقني 24/7 باللغة العربية",
      ].join(" | "),
      competitors:
        "SAP Business One, Microsoft Dynamics 365, Oracle NetSuite, Odoo",
      uniqueSellingPoints: [
        "الوحيد المصمم خصيصاً للشركات العربية",
        "تكلفة أقل بـ 60% من SAP",
        "تطبيق خلال أسبوعين (مقارنة بـ 6 أشهر للمنافسين)",
        "واجهة عربية كاملة مع دعم اللغة العربية في التقارير",
        "استضافة على سيرفرات سعودية لضمان سيادة البيانات",
      ].join(" | "),
      maxDailyPosts: 2,
      maxDailyEmails: 30,
      preferredPostTime: "09:00",
      preferredEmailTime: "10:00",
    },
  });

  console.log(`✅ تم إنشاء الحملة: "${campaign.name}"`);

  // -------------------------------------------------------
  // 2. إنشاء تكامل LinkedIn وهمي
  // -------------------------------------------------------
  const linkedin = await prisma.platformIntegration.upsert({
    where: {
      platform_accountId: {
        platform: "LINKEDIN",
        accountId: "corelogic-systems-page",
      },
    },
    update: {},
    create: {
      platform: "LINKEDIN",
      name: "صفحة CoreLogic على LinkedIn",
      isActive: false, // غير نشط حتى يُضاف التوكن
      accountId: "corelogic-systems-page",
      accountName: "CoreLogic Systems",
      config: JSON.stringify({
        note: "أضف LINKEDIN_ACCESS_TOKEN في ملف .env لتفعيل النشر التلقائي",
      }),
    },
  });

  console.log(
    `✅ تم إنشاء تكامل LinkedIn: "${linkedin.name}" (${linkedin.isActive ? "نشط" : "غير نشط - يحتاج توكن"})`
  );

  // -------------------------------------------------------
  // 3. إنشاء تكامل Resend (بريد إلكتروني)
  // -------------------------------------------------------
  const email = await prisma.platformIntegration.upsert({
    where: {
      platform_accountId: {
        platform: "EMAIL_RESEND",
        accountId: "resend-main",
      },
    },
    update: {},
    create: {
      platform: "EMAIL_RESEND",
      name: "Resend API - البريد الترويجي",
      isActive: false, // غير نشط حتى يُضاف التوكن
      accountId: "resend-main",
      accountName: "agent@corelogic-systems.com",
      config: JSON.stringify({
        note: "أضف RESEND_API_KEY في ملف .env لتفعيل إرسال البريد",
      }),
    },
  });

  console.log(
    `✅ تم إنشاء تكامل البريد: "${email.name}" (${email.isActive ? "نشط" : "غير نشط - يحتاج API Key"})`
  );

  // -------------------------------------------------------
  // 4. سجل نشاط أولي
  // -------------------------------------------------------
  await prisma.activityLog.create({
    data: {
      eventType: "INFO",
      level: "INFO",
      message: "🌱 تم تهيئة قاعدة البيانات بالبيانات الأولية لـ CoreLogic Systems",
      module: "seeder",
      action: "DATABASE_SEED",
      details: JSON.stringify({
        campaignId: campaign.id,
        timestamp: new Date().toISOString(),
      }),
    },
  });

  console.log("\n🎉 اكتملت عملية تهيئة قاعدة البيانات بنجاح!");
  console.log("\n📋 الخطوات التالية:");
  console.log("   1. أضف GEMINI_API_KEY في ملف backend/.env");
  console.log("   2. أضف RESEND_API_KEY لتفعيل البريد الإلكتروني");
  console.log("   3. أضف LINKEDIN_ACCESS_TOKEN لتفعيل النشر");
  console.log("   4. شغّل الخادم: cd backend && npm run dev");
  console.log("   5. شغّل الـ Dashboard: cd dashboard && npm run dev\n");
}

main()
  .catch((error) => {
    console.error("❌ خطأ في تهيئة قاعدة البيانات:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
