import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

type ApplyRequest = {
  surveyId?: string;
  lineUserId?: string;
  displayName?: string;
  childGrade?: string;
  childClass?: string;
  note?: string;
};

function normalizeChildClass(childClass: string) {
  return /^[1-4]$/.test(childClass) ? `${childClass}組` : childClass;
}

export async function POST(request: Request) {
  await ensureSeedData();

  const body = (await request.json()) as ApplyRequest;

  if (!body.surveyId || !body.lineUserId || !body.displayName || !body.childGrade || !body.childClass) {
    return NextResponse.json({ message: "必須項目が不足しています。" }, { status: 400 });
  }

  const normalizedChildClass = normalizeChildClass(body.childClass);

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
    const existing = await prisma.application.findUnique({
      where: {
        surveyId_lineUserId: {
          surveyId: survey.id,
          lineUserId: body.lineUserId
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ message: "この募集は定員に達しています。" }, { status: 409 });
    }
  }

  try {
    const existing = await prisma.application.findUnique({
      where: {
        surveyId_lineUserId: {
          surveyId: survey.id,
          lineUserId: body.lineUserId
        }
      }
    });

    const application = existing
      ? await prisma.application.update({
          where: {
            surveyId_lineUserId: {
              surveyId: survey.id,
              lineUserId: body.lineUserId
            }
          },
          data: {
            displayName: body.displayName,
            childGrade: body.childGrade,
            childClass: normalizedChildClass,
            note: body.note
          }
        })
      : await prisma.application.create({
          data: {
            surveyId: survey.id,
            lineUserId: body.lineUserId,
            displayName: body.displayName,
            childGrade: body.childGrade,
            childClass: normalizedChildClass,
            note: body.note
          }
        });

    return NextResponse.json(
      {
        id: application.id,
        action: existing ? "updated" : "created",
        message: existing ? "応募内容を更新しました。" : "応募を登録しました。"
      },
      { status: existing ? 200 : 201 }
    );
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
