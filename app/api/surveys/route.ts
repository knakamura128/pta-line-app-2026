import { NextResponse } from "next/server";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await ensureSeedData();

  const surveys = await prisma.survey.findMany({
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
      startsAt: survey.startsAt,
      endsAt: survey.endsAt,
      closeAt: survey.closeAt,
      capacity: survey.capacity,
      currentApplications: survey._count.applications,
      status: survey._count.applications >= survey.capacity ? "満員" : "募集中"
    }))
  );
}
