import { SelectionInputType, SurveyStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSelectionConfig } from "@/lib/survey-selection";

export async function POST(request: Request) {
  const formData = await request.formData();
  const surveyId = readString(formData, "surveyId");

  try {
    const input = parseSurveyFormData(formData);

    if (surveyId) {
      await prisma.survey.update({
        where: { id: surveyId },
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
          useDateRange: input.useDateRange,
          eventStartDate: input.eventStartDate,
          eventEndDate: input.eventEndDate,
          eventStartTime: input.eventStartTime,
          eventEndTime: input.eventEndTime,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          closeAt: input.closeAt,
          capacity: input.capacity,
          status: input.status
        }
      });

      const updatedSurvey = await prisma.survey.findUniqueOrThrow({
        where: { id: surveyId }
      });

      revalidateAdminPaths(updatedSurvey.slug);
      return NextResponse.redirect(
        new URL(`/admin/surveys/${updatedSurvey.slug}?saved=${input.status === "PUBLISHED" ? "published" : "draft"}`, request.url),
        { status: 303 }
      );
    }

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
        useDateRange: input.useDateRange,
        eventStartDate: input.eventStartDate,
        eventEndDate: input.eventEndDate,
        eventStartTime: input.eventStartTime,
        eventEndTime: input.eventEndTime,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        closeAt: input.closeAt,
        capacity: input.capacity,
        status: input.status
      }
    });

    revalidateAdminPaths();
    return NextResponse.redirect(
      new URL(`/admin/surveys?saved=${input.status === "PUBLISHED" ? "published" : "draft"}`, request.url),
      { status: 303 }
    );
  } catch (error) {
    const target = surveyId
      ? `/admin/surveys/edit?id=${surveyId}&error=${encodeURIComponent(readErrorMessage(error))}`
      : `/admin/surveys/new?error=${encodeURIComponent(readErrorMessage(error))}`;

    return NextResponse.redirect(new URL(target, request.url), { status: 303 });
  }
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
  const schedule = readScheduleFields(formData);
  const closeAt = readRequiredString(formData, "closeAt");
  const capacityValue = Number(readRequiredString(formData, "capacity"));

  if (!Number.isInteger(capacityValue) || capacityValue < 1) {
    throw new Error("募集人数は1以上の整数で入力してください。");
  }

  const startsAt = new Date(`${schedule.startDate}T${schedule.startTime}:00+09:00`);
  const endsAt = new Date(`${schedule.endDate}T${schedule.endTime}:00+09:00`);
  const closeAtDate = new Date(`${closeAt}:00+09:00`);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || Number.isNaN(closeAtDate.getTime())) {
    throw new Error("日時の形式が不正です。");
  }

  if (schedule.useDateRange && schedule.startDate > schedule.endDate) {
    throw new Error("終了日は開始日以降にしてください。");
  }

  if (startsAt >= endsAt) {
    throw new Error("終了日時は開始日時より後にしてください。");
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
    useDateRange: schedule.useDateRange,
    eventStartDate: new Date(`${schedule.startDate}T00:00:00+09:00`),
    eventEndDate: new Date(`${schedule.endDate}T00:00:00+09:00`),
    eventStartTime: schedule.startTime,
    eventEndTime: schedule.endTime,
    startsAt,
    endsAt,
    closeAt: closeAtDate,
    capacity: capacityValue,
    status: mode === "publish" ? SurveyStatus.PUBLISHED : SurveyStatus.DRAFT
  };
}

function readScheduleFields(formData: FormData) {
  const useDateRange = readString(formData, "useDateRange") === "true";
  const startDate = readString(formData, "startDate");
  const endDate = readString(formData, "endDate");
  const startTime = readString(formData, "startTime");
  const endTime = readString(formData, "endTime");

  if (startDate && endDate && startTime && endTime) {
    return {
      useDateRange,
      startDate,
      endDate,
      startTime,
      endTime
    };
  }

  const legacyStartsAt = readString(formData, "startsAt");
  const legacyEndsAt = readString(formData, "endsAt");

  if (legacyStartsAt && legacyEndsAt) {
    return {
      useDateRange: true,
      startDate: legacyStartsAt.slice(0, 10),
      endDate: legacyEndsAt.slice(0, 10),
      startTime: legacyStartsAt.slice(11, 16),
      endTime: legacyEndsAt.slice(11, 16)
    };
  }

  const legacyEventDate = readString(formData, "eventDate");
  if (legacyEventDate && startTime && endTime) {
    return {
      useDateRange: false,
      startDate: legacyEventDate,
      endDate: legacyEventDate,
      startTime,
      endTime
    };
  }

  throw new Error("開催日時の入力内容を読み取れませんでした。画面を再読み込みしてもう一度お試しください。");
}

function readMode(formData: FormData) {
  const mode = readString(formData, "mode");
  return mode === "publish" ? "publish" : "draft";
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
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `survey-${Date.now()}`
  );
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "保存処理に失敗しました。";
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
