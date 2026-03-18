"use server";

import { MessageDeliveryKind, MessageDeliveryStatus, SelectionInputType, SurveyStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendLinePushTextMessage } from "@/lib/line-messaging";
import { prisma } from "@/lib/prisma";
import { normalizeSelectionConfig } from "@/lib/survey-selection";

type SaveMode = "draft" | "publish";

export async function createSurveyAction(formData: FormData) {
  const input = parseSurveyFormData(formData);
  const slug = await generateUniqueSlug(input.title);

  await prisma.survey.create({
    data: {
      slug,
      title: input.title,
      committee: input.committee,
      description: input.description,
      workDetails: input.workDetails,
      confirmationMessage: input.confirmationMessage,
      selectionTitle: input.selectionTitle,
      selectionType: input.selectionType,
      selectionOptions: input.selectionOptions,
      selectionOptionLimits: input.selectionOptionLimits,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      closeAt: input.closeAt,
      capacity: input.capacity,
      status: input.status
    }
  });

  revalidateAdminPaths();
  redirect(`/admin/surveys?saved=${input.status === "PUBLISHED" ? "published" : "draft"}`);
}

export async function updateSurveyAction(formData: FormData) {
  const input = parseSurveyFormData(formData);
  const surveyId = readString(formData, "surveyId");

  if (!surveyId) {
    throw new Error("募集IDが不足しています。");
  }

  await prisma.survey.update({
    where: {
      id: surveyId
    },
    data: {
      title: input.title,
      committee: input.committee,
      description: input.description,
      workDetails: input.workDetails,
      confirmationMessage: input.confirmationMessage,
      selectionTitle: input.selectionTitle,
      selectionType: input.selectionType,
      selectionOptions: input.selectionOptions,
      selectionOptionLimits: input.selectionOptionLimits,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      closeAt: input.closeAt,
      capacity: input.capacity,
      status: input.status
    }
  });

  const updatedSurvey = await prisma.survey.findUniqueOrThrow({
    where: {
      id: surveyId
    }
  });

  revalidateAdminPaths(updatedSurvey.slug);
  redirect(`/admin/surveys/${updatedSurvey.slug}?saved=${input.status === "PUBLISHED" ? "published" : "draft"}`);
}

export async function sendConfirmationMessagesAction(formData: FormData) {
  const surveyId = readString(formData, "surveyId");

  if (!surveyId) {
    throw new Error("募集IDが不足しています。");
  }

  const survey = await prisma.survey.findUnique({
    where: {
      id: surveyId
    },
    include: {
      applications: {
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!survey) {
    throw new Error("募集が見つかりません。");
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
  redirect(`/admin/surveys/${survey.slug}?confirmationSent=${sentCount}&confirmationFailed=${failedCount}`);
}

function parseSurveyFormData(formData: FormData) {
  const mode = readMode(formData);
  const title = readRequiredString(formData, "title");
  const committee = readRequiredString(formData, "committee");
  const description = readRequiredString(formData, "description");
  const workDetails = readRequiredString(formData, "workDetails");
  const confirmationMessage = readRequiredString(formData, "confirmationMessage");
  const selectionTitle = readString(formData, "selectionTitle");
  const selectionType = readSelectionType(formData);
  const selectionOptionLabels = formData.getAll("selectionOptionLabel").map((value) => (typeof value === "string" ? value : ""));
  const selectionOptionLimits = formData.getAll("selectionOptionLimit").map((value) => (typeof value === "string" ? value : ""));
  const eventDate = readRequiredString(formData, "eventDate");
  const startTime = readRequiredString(formData, "startTime");
  const endTime = readRequiredString(formData, "endTime");
  const closeAt = readRequiredString(formData, "closeAt");
  const capacityValue = Number(readRequiredString(formData, "capacity"));

  if (!Number.isInteger(capacityValue) || capacityValue < 1) {
    throw new Error("募集人数は1以上の整数で入力してください。");
  }

  const startsAt = new Date(`${eventDate}T${startTime}:00+09:00`);
  const endsAt = new Date(`${eventDate}T${endTime}:00+09:00`);
  const closeAtDate = new Date(`${closeAt}:00+09:00`);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || Number.isNaN(closeAtDate.getTime())) {
    throw new Error("日時の形式が不正です。");
  }

  const selectionConfig = normalizeSelectionConfig(
    selectionTitle,
    selectionType,
    selectionOptionLabels,
    selectionOptionLimits
  );

  return {
    title,
    committee,
    description,
    workDetails,
    confirmationMessage,
    selectionTitle: selectionConfig.selectionTitle,
    selectionType: selectionConfig.selectionType,
    selectionOptions: selectionConfig.selectionOptions,
    selectionOptionLimits: selectionConfig.selectionOptionLimits,
    startsAt,
    endsAt,
    closeAt: closeAtDate,
    capacity: capacityValue,
    status: mode === "publish" ? SurveyStatus.PUBLISHED : SurveyStatus.DRAFT
  };
}

function readMode(formData: FormData): SaveMode {
  const mode = readString(formData, "mode");

  if (mode === "draft" || mode === "publish") {
    return mode;
  }

  return "draft";
}

function readSelectionType(formData: FormData) {
  const value = readString(formData, "selectionType");

  switch (value) {
    case SelectionInputType.RADIO:
      return SelectionInputType.RADIO;
    case SelectionInputType.CHECKBOX:
      return SelectionInputType.CHECKBOX;
    default:
      return SelectionInputType.NONE;
  }
}

function readRequiredString(formData: FormData, key: string) {
  const value = readString(formData, key);

  if (!value) {
    throw new Error(`${key} が不足しています。`);
  }

  return value;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function generateUniqueSlug(title: string) {
  const base = slugify(title);
  let slug = base;
  let sequence = 2;

  while (await prisma.survey.findUnique({ where: { slug } })) {
    slug = `${base}-${sequence}`;
    sequence += 1;
  }

  return slug;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || `survey-${Date.now()}`;
}

function revalidateAdminPaths(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin/applications");
  revalidatePath("/");

  if (slug) {
    revalidatePath(`/admin/surveys/${slug}`);
    revalidatePath(`/surveys/${slug}`);
    revalidatePath(`/api/surveys/${slug}`);
  }

  revalidatePath("/admin/surveys/edit");
  revalidatePath("/api/surveys");
}
