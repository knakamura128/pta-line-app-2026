import { NextResponse } from "next/server";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";
import { getSurveyStatusLabel, isSurveyClosed } from "@/lib/survey-status";

export async function GET() {
  await ensureSeedData();

  const surveys = await prisma.survey.findMany({
    where: {
      status: "PUBLISHED"
    },
    orderBy: {
      startsAt: "asc"
    },
    include: {
      _count: {
        select: {
          applications: true
        }
      }
    }
  });

  return NextResponse.json(
    surveys.map((survey) => ({
      id: survey.id,
      slug: survey.slug,
      title: survey.title,
      committee: survey.committee,
      description: survey.description,
      selectionTitle: survey.selectionTitle,
      selectionType: survey.selectionType,
      selectionOptions: survey.selectionOptions,
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
      })
    }))
  );
}
