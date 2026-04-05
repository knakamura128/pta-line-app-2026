import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();
  const surveyId = readString(formData, "surveyId");

  if (!surveyId) {
    return NextResponse.redirect(new URL("/admin/surveys?error=missing-survey-id", request.url), { status: 303 });
  }

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId }
  });

  if (!survey) {
    return NextResponse.redirect(new URL("/admin/surveys?error=survey-not-found", request.url), { status: 303 });
  }

  await prisma.survey.delete({
    where: { id: surveyId }
  });

  revalidateAdminPaths(survey.slug);

  return NextResponse.redirect(new URL("/admin/surveys?saved=deleted", request.url), { status: 303 });
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
