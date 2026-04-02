import { MessageDeliveryKind, MessageDeliveryStatus, SelectionInputType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ensureSeedData } from "@/lib/bootstrap";
import { sendLinePushTextMessage } from "@/lib/line-messaging";
import { prisma } from "@/lib/prisma";
import { normalizeSelectionAnswers } from "@/lib/survey-selection";

type ApplyRequest = {
  surveyId?: string;
  lineUserId?: string;
  familyName?: string;
  displayName?: string;
  childGrade?: string;
  childClass?: string;
  selectionAnswers?: string[];
  note?: string;
};

function normalizeChildClass(childClass: string) {
  return /^[1-4]$/.test(childClass) ? `${childClass}組` : childClass;
}

export async function POST(request: Request) {
  await ensureSeedData();

  const body = (await request.json()) as ApplyRequest;

  if (!body.surveyId || !body.lineUserId || !body.familyName || !body.displayName || !body.childGrade || !body.childClass) {
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

  const surveySelectionOptions = Array.isArray(survey.selectionOptions)
    ? survey.selectionOptions.filter((value): value is string => typeof value === "string")
    : [];
  const normalizedSelectionAnswers = normalizeSelectionAnswers(
    body.selectionAnswers,
    survey.selectionType as SelectionInputType,
    surveySelectionOptions
  );

  if (survey.selectionType !== SelectionInputType.NONE && normalizedSelectionAnswers.length === 0) {
    return NextResponse.json({ message: "選択項目を入力してください。" }, { status: 400 });
  }

  const existing = await prisma.application.findUnique({
    where: {
      surveyId_lineUserId: {
        surveyId: survey.id,
        lineUserId: body.lineUserId
      }
    }
  });

  for (const selectionAnswer of normalizedSelectionAnswers) {
    const optionIndex = survey.selectionOptions.findIndex((option) => option === selectionAnswer);
    const limit = survey.selectionOptionLimits[optionIndex] ?? 0;

    if (limit <= 0) {
      continue;
    }

    const currentCount = await prisma.application.count({
      where: {
        surveyId: survey.id,
        selectionAnswers: {
          has: selectionAnswer
        }
      }
    });

    const alreadySelected = existing?.selectionAnswers.includes(selectionAnswer) ?? false;
    if (currentCount >= limit && !alreadySelected) {
      return NextResponse.json({ message: `「${selectionAnswer}」は上限に達しています。` }, { status: 409 });
    }
  }

  if (survey._count.applications >= survey.capacity) {
    if (!existing) {
      return NextResponse.json({ message: "この募集は定員に達しています。" }, { status: 409 });
    }
  }

  try {
    const application = existing
      ? await prisma.application.update({
          where: {
            surveyId_lineUserId: {
              surveyId: survey.id,
              lineUserId: body.lineUserId
            }
          },
          data: {
            familyName: body.familyName,
            displayName: body.displayName,
            childGrade: body.childGrade,
            childClass: normalizedChildClass,
            selectionAnswers: normalizedSelectionAnswers,
            note: body.note
          }
        })
      : await prisma.application.create({
          data: {
            surveyId: survey.id,
            lineUserId: body.lineUserId,
            familyName: body.familyName,
            displayName: body.displayName,
            childGrade: body.childGrade,
            childClass: normalizedChildClass,
            selectionAnswers: normalizedSelectionAnswers,
            note: body.note
          }
        });

    const receiptMessage = existing
      ? `「${survey.title}」の応募内容を更新しました。締切までは再編集できます。`
      : `「${survey.title}」の応募を受け付けました。締切までは内容の編集ができます。`;
    const receiptResult = await sendLinePushTextMessage(body.lineUserId, receiptMessage);

    await prisma.messageDelivery.create({
      data: {
        surveyId: survey.id,
        applicationId: application.id,
        lineUserId: body.lineUserId,
        kind: MessageDeliveryKind.RECEIPT,
        status: receiptResult.ok ? MessageDeliveryStatus.SENT : MessageDeliveryStatus.FAILED,
        messageBody: receiptMessage,
        errorMessage: receiptResult.ok ? null : receiptResult.error,
        sentAt: receiptResult.ok ? new Date() : null
      }
    });

    return NextResponse.json(
      {
        id: application.id,
        action: existing ? "updated" : "created",
        message: receiptResult.ok
          ? existing
            ? "応募内容を更新しました。LINEにも受付メッセージを送りました。"
            : "応募を登録しました。LINEにも受付メッセージを送りました。"
          : existing
            ? "応募内容を更新しました。LINE通知は送れませんでした。"
            : "応募を登録しました。LINE通知は送れませんでした。"
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

export async function DELETE(request: Request) {
  await ensureSeedData();

  const body = (await request.json()) as ApplyRequest;

  if (!body.surveyId || !body.lineUserId) {
    return NextResponse.json({ message: "募集IDとLINEユーザーIDが必要です。" }, { status: 400 });
  }

  const existing = await prisma.application.findUnique({
    where: {
      surveyId_lineUserId: {
        surveyId: body.surveyId,
        lineUserId: body.lineUserId
      }
    }
  });

  if (!existing) {
    return NextResponse.json({ message: "応募データが見つかりません。" }, { status: 404 });
  }

  await prisma.application.delete({
    where: {
      surveyId_lineUserId: {
        surveyId: body.surveyId,
        lineUserId: body.lineUserId
      }
    }
  });

  return NextResponse.json({ message: "応募を取り消しました。" });
}
