import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

type ApplyRequest = {
  surveyId?: string;
  lineUserId?: string;
  displayName?: string;
  note?: string;
};

export async function POST(request: Request) {
  await ensureSeedData();

  const body = (await request.json()) as ApplyRequest;

  if (!body.surveyId || !body.lineUserId || !body.displayName) {
    return NextResponse.json({ message: "必須項目が不足しています。" }, { status: 400 });
  }

  const survey = await prisma.survey.findUnique({
    where: { id: body.surveyId },
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

  if (survey._count.applications >= survey.capacity) {
    return NextResponse.json({ message: "この募集は定員に達しています。" }, { status: 409 });
  }

  try {
    const application = await prisma.application.create({
      data: {
        surveyId: survey.id,
        lineUserId: body.lineUserId,
        displayName: body.displayName,
        note: body.note
      }
    });

    return NextResponse.json({ id: application.id, message: "応募を登録しました。" }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ message: "この募集には既に応募済みです。" }, { status: 409 });
    }

    return NextResponse.json({ message: "応募登録に失敗しました。" }, { status: 500 });
  }
}
