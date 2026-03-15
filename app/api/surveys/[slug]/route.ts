import { NextResponse } from "next/server";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  await ensureSeedData();

  const { slug } = await context.params;

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

  return NextResponse.json({
    id: survey.id,
    slug: survey.slug,
    title: survey.title,
    committee: survey.committee,
    description: survey.description,
    startsAt: survey.startsAt,
    endsAt: survey.endsAt,
    closeAt: survey.closeAt,
    capacity: survey.capacity,
    currentApplications: survey._count.applications,
    status: survey._count.applications >= survey.capacity ? "満員" : "募集中",
    gradeSummary: gradeSummary.map((row) => ({
      grade: row.childGrade,
      count: row._count.childGrade
    }))
  });
}
