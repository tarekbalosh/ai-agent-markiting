// ===================================================
// Email Service - خدمة البريد الإلكتروني
// يستخدم Resend API لإرسال رسائل ترويجية
// ===================================================

import { Resend } from "resend";
import prisma from "../../lib/prisma";
import { LogEventType, LogLevel } from "../constants";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "agent@corelogic-systems.com";

// -------------------------------------------------------
// إرسال بريد إلكتروني ترويجي واحد
// -------------------------------------------------------
export async function sendColdEmail(
  to: string,
  subject: string,
  body: string,
  contentId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const startTime = Date.now();

  try {
    console.log(`📧 [EmailService] إرسال بريد إلى: ${to}`);

    const { data, error } = await resend.emails.send({
      from: `CoreLogic Systems <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html: formatEmailHtml(body, subject),
    });

    if (error) {
      throw new Error(error.message);
    }

    // تحديث حالة المحتوى
    await prisma.generatedContent.update({
      where: { id: contentId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        eventType: LogEventType.EMAIL_SENT,
        level: LogLevel.INFO,
        message: `📧 تم إرسال بريد إلكتروني إلى: ${to}`,
        module: "emailService",
        action: "SEND_EMAIL",
        entityType: "GeneratedContent",
        entityId: contentId,
        details: JSON.stringify({ to, subject, messageId: data?.id }),
        durationMs: Date.now() - startTime,
      },
    });

    console.log(`✅ [EmailService] تم الإرسال بنجاح! ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    const err = error as Error;
    console.error(`❌ [EmailService] خطأ في الإرسال:`, err.message);

    await prisma.activityLog.create({
      data: {
        eventType: LogEventType.ERROR,
        level: LogLevel.ERROR,
        message: `❌ فشل إرسال البريد إلى ${to}: ${err.message}`,
        module: "emailService",
        action: "SEND_EMAIL_FAILED",
        entityType: "GeneratedContent",
        entityId: contentId,
        errorCode: "EMAIL_SEND_FAILED",
        stackTrace: err.stack,
        durationMs: Date.now() - startTime,
      },
    });

    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------
// إرسال دفعة من الرسائل التسويقية
// -------------------------------------------------------
export async function sendBulkColdEmails(
  recipients: string[],
  subject: string,
  body: string,
  contentId: string,
  maxPerDay: number = 50
): Promise<{ sent: number; failed: number }> {
  const targetRecipients = recipients.slice(0, maxPerDay);
  let sent = 0;
  let failed = 0;

  console.log(
    `\n📮 [EmailService] بدء إرسال ${targetRecipients.length} رسالة...`
  );

  for (const email of targetRecipients) {
    const result = await sendColdEmail(email, subject, body, contentId);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // تأخير قصير لتجنب Rate Limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(
    `\n📊 [EmailService] اكتمل الإرسال: ${sent} نجح، ${failed} فشل`
  );
  return { sent, failed };
}

// -------------------------------------------------------
// تنسيق HTML للبريد الإلكتروني
// -------------------------------------------------------
function formatEmailHtml(body: string, subject: string): string {
  const paragraphs = body
    .split("\n")
    .filter((p) => p.trim())
    .map((p) => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${p}</p>`)
    .join("");

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 32px 40px; text-align: center;">
      <h1 style="color: #e94560; margin: 0; font-size: 24px; letter-spacing: 2px;">CoreLogic Systems</h1>
      <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0 0; font-size: 14px;">حلول الأتمتة الذكية</p>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px; color: #333; font-size: 15px; direction: rtl;">
      ${paragraphs}
    </div>
    
    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 24px 40px; text-align: center; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px; margin: 0;">
        تم إرسال هذا البريد بواسطة وكيل CoreLogic التسويقي الذكي<br>
        <a href="#" style="color: #e94560;">إلغاء الاشتراك</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
