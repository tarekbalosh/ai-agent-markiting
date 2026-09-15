// ===================================================
// LinkedIn Service - خدمة النشر التلقائي على LinkedIn
// يستخدم LinkedIn API v2
// ===================================================

import prisma from "../../lib/prisma";
import { LogEventType, LogLevel } from "../constants";

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

// -------------------------------------------------------
// نشر منشور على LinkedIn
// -------------------------------------------------------
export async function publishToLinkedIn(
  content: string,
  hashtags: string = "",
  contentId: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const startTime = Date.now();
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = process.env.LINKEDIN_PERSON_URN;
  const orgUrn = process.env.LINKEDIN_ORGANIZATION_URN;

  if (!accessToken) {
    const errMsg = "LINKEDIN_ACCESS_TOKEN غير موجود في متغيرات البيئة";
    console.error(`❌ [LinkedInService] ${errMsg}`);
    return { success: false, error: errMsg };
  }

  // استخدام صفحة المنظمة إذا كانت متاحة، وإلا الملف الشخصي
  const author = orgUrn || personUrn;

  if (!author) {
    return {
      success: false,
      error: "يجب تحديد LINKEDIN_PERSON_URN أو LINKEDIN_ORGANIZATION_URN",
    };
  }

  // تنسيق المحتوى مع الهاشتاقات
  const fullContent = hashtags
    ? `${content}\n\n${hashtags}`
    : content;

  // بناء طلب LinkedIn API v2 (UGC Posts)
  const postBody = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: fullContent,
        },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  try {
    console.log(`\n🔗 [LinkedInService] نشر على LinkedIn...`);
    console.log(`👤 Author: ${author}`);

    const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `LinkedIn API Error ${response.status}: ${errorBody}`
      );
    }

    const responseData = await response.json() as { id: string };
    const postId = responseData.id;
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

    // تحديث قاعدة البيانات
    await prisma.generatedContent.update({
      where: { id: contentId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishedUrl: postUrl,
      },
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        eventType: LogEventType.CONTENT_PUBLISHED,
        level: LogLevel.INFO,
        message: `🔗 تم نشر المنشور على LinkedIn بنجاح!`,
        module: "linkedinService",
        action: "PUBLISH_LINKEDIN_POST",
        entityType: "GeneratedContent",
        entityId: contentId,
        details: JSON.stringify({ postId, postUrl, author }),
        durationMs: Date.now() - startTime,
      },
    });

    console.log(`✅ [LinkedInService] تم النشر بنجاح! Post ID: ${postId}`);
    console.log(`🔗 رابط المنشور: ${postUrl}`);

    return { success: true, postId };
  } catch (error) {
    const err = error as Error;
    console.error(`❌ [LinkedInService] خطأ في النشر:`, err.message);

    // تحديث حالة المحتوى إلى فاشل
    await prisma.generatedContent.update({
      where: { id: contentId },
      data: { status: "FAILED" },
    });

    // تسجيل الخطأ
    await prisma.activityLog.create({
      data: {
        eventType: LogEventType.ERROR,
        level: LogLevel.ERROR,
        message: `❌ فشل النشر على LinkedIn: ${err.message}`,
        module: "linkedinService",
        action: "PUBLISH_LINKEDIN_FAILED",
        entityType: "GeneratedContent",
        entityId: contentId,
        errorCode: "LINKEDIN_PUBLISH_FAILED",
        stackTrace: err.stack,
        durationMs: Date.now() - startTime,
      },
    });

    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------
// جلب معلومات الملف الشخصي
// -------------------------------------------------------
export async function getLinkedInProfile(): Promise<{
  id: string;
  name: string;
} | null> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!accessToken) return null;

  try {
    const response = await fetch(`${LINKEDIN_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json() as {
      id: string;
      localizedFirstName: string;
      localizedLastName: string;
    };
    
    return {
      id: data.id,
      name: `${data.localizedFirstName} ${data.localizedLastName}`,
    };
  } catch {
    return null;
  }
}
