import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lineUserId = searchParams.get("lineUserId");

  if (!lineUserId) {
    return NextResponse.json({ message: "lineUserId が必要です。" }, { status: 400 });
  }

  const applications = await prisma.application.findMany({
    where: { lineUserId },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      survey: true
    }
  });

  return NextResponse.json(
    applications.map((application) => ({
      id: application.id,
      childGrade: application.childGrade,
      childClass: application.childClass,
      note: application.note,
      survey: {
        slug: application.survey.slug,
        title: application.survey.title,
        committee: application.survey.committee,
        useDateRange: application.survey.useDateRange,
        eventStartDate: application.survey.eventStartDate,
        eventEndDate: application.survey.eventEndDate,
        eventStartTime: application.survey.eventStartTime,
        eventEndTime: application.survey.eventEndTime,
        startsAt: application.survey.startsAt,
        endsAt: application.survey.endsAt,
        closeAt: application.survey.closeAt
      }
    }))
  );
}
