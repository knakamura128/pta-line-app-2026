import { MessageDeliveryKind, MessageDeliveryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { sendLinePushTextMessage } from "@/lib/line-messaging";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();
  const surveyId = readString(formData, "surveyId");

  if (!surveyId) {
    return NextResponse.redirect(new URL("/admin/surveys?error=missing-survey-id", request.url), { status: 303 });
  }

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      applications: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!survey) {
    return NextResponse.redirect(new URL("/admin/surveys?error=survey-not-found", request.url), { status: 303 });
  }

  const recipients = survey.applications.slice(0, survey.capacity);
  let sentCount = 0;
  let failedCount = 0;

  for (const application of recipients) {
    const result = await sendLinePushTextMessage(application.lineUserId, survey.confirmationMessage);

    await prisma.messageDelivery.create({
      data: {
        surveyId: survey.id,
        applicationId: application.id,
        lineUserId: application.lineUserId,
        kind: MessageDeliveryKind.CONFIRMATION,
        status: result.ok ? MessageDeliveryStatus.SENT : MessageDeliveryStatus.FAILED,
        messageBody: survey.confirmationMessage,
        errorMessage: result.ok ? null : result.error,
        sentAt: result.ok ? new Date() : null
      }
    });

    if (result.ok) {
      sentCount += 1;
    } else {
      failedCount += 1;
    }
  }

  revalidateAdminPaths(survey.slug);

  return NextResponse.redirect(
    new URL(`/admin/surveys/view?id=${survey.id}&confirmationSent=${sentCount}&confirmationFailed=${failedCount}`, request.url),
    { status: 303 }
  );
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateAdminPaths(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin/applications");
  revalidatePath("/");

  if (slug) {
    revalidatePath(`/admin/surveys/${slug}`);
    revalidatePath("/admin/surveys/view");
    revalidatePath(`/surveys/${slug}`);
    revalidatePath(`/api/surveys/${slug}`);
  }

  revalidatePath("/api/surveys");
}
