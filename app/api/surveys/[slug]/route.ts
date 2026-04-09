import { NextResponse } from "next/server";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";
import { getSurveyStatusLabel, isSurveyClosed } from "@/lib/survey-status";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  await ensureSeedData();

  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const lineUserId = searchParams.get("lineUserId");

  const survey = await prisma.survey.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          applications: true
        }
      }
    }
  });

  if (!survey) {
    return NextResponse.json({ message: "募集が見つかりません。" }, { status: 404 });
  }

  if (survey.status !== "PUBLISHED") {
    return NextResponse.json({ message: "この募集は公開されていません。" }, { status: 404 });
  }

  const gradeSummary = await prisma.application.groupBy({
    by: ["childGrade"],
    where: {
      surveyId: survey.id
    },
    _count: {
      childGrade: true
    },
    orderBy: {
      childGrade: "asc"
    }
  });

  const existingApplication = lineUserId
    ? await prisma.application.findUnique({
        where: {
          surveyId_lineUserId: {
            surveyId: survey.id,
            lineUserId
          }
        }
      })
    : null;

  const selectionChoices = await Promise.all(
    survey.selectionOptions.map(async (label, index) => ({
      label,
      capacity: survey.selectionOptionLimits[index] ?? 0,
      currentCount: await prisma.application.count({
        where: {
          surveyId: survey.id,
          selectionAnswers: {
            has: label
          }
        }
      })
    }))
  );

  return NextResponse.json({
    id: survey.id,
    slug: survey.slug,
    title: survey.title,
    committee: survey.committee,
    description: survey.description,
    workDetails: survey.workDetails,
    useDateRange: survey.useDateRange,
    eventStartDate: survey.eventStartDate,
    eventEndDate: survey.eventEndDate,
    eventStartTime: survey.eventStartTime,
    eventEndTime: survey.eventEndTime,
    startsAt: survey.startsAt,
    endsAt: survey.endsAt,
    closeAt: survey.closeAt,
    capacity: survey.capacity,
    currentApplications: survey._count.applications,
    isClosed: isSurveyClosed(survey.closeAt),
    status: getSurveyStatusLabel({
      closeAt: survey.closeAt,
      currentApplications: survey._count.applications,
      capacity: survey.capacity
    }),
    selectionTitle: survey.selectionTitle,
    selectionType: survey.selectionType,
    selectionOptions: survey.selectionOptions ?? [],
    existingApplication: existingApplication
      ? {
          id: existingApplication.id,
          familyName: existingApplication.familyName,
          childGrade: existingApplication.childGrade,
          childClass: existingApplication.childClass,
          selectionAnswers: existingApplication.selectionAnswers ?? [],
          note: existingApplication.note
        }
      : null,
    selectionChoices,
    gradeSummary: gradeSummary.map((row) => ({
      grade: row.childGrade,
      count: row._count.childGrade
    }))
  });
}
