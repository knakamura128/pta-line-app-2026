import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const applicationId = typeof body.applicationId === "string" ? body.applicationId : "";
    const attendanceChecked = Boolean(body.attendanceChecked);

    if (!applicationId) {
      return NextResponse.json({ message: "応募IDが不足しています。" }, { status: 400 });
    }

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { attendanceChecked },
      select: {
        id: true,
        attendanceChecked: true,
        surveyId: true
      }
    });

    return NextResponse.json({ ok: true, application });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "確認状態の更新に失敗しました。"
      },
      { status: 500 }
    );
  }
}
