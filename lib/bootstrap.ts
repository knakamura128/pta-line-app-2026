import { SelectionInputType, SurveyStatus } from "@prisma/client";
import { prisma } from "./prisma";

export async function ensureSeedData() {
  const count = await prisma.survey.count();

  if (count > 0) {
    return;
  }

  await prisma.survey.createMany({
    data: [
      {
        slug: "traffic-safety",
        title: "交通安全見守りスタッフ",
        committee: "校外委員会",
        description: "登校時間帯の横断歩道サポート。短時間参加可。",
        workDetails: "集合場所に集まり、役割分担の後に担当エリアで見守りを行います。終了後は現地解散です。",
        confirmationMessage:
          "ご応募ありがとうございます。担当が確定しました。\n\n当日の詳細は以下をご確認ください。\nhttps://example.com/openchat\nパスワード: PTA2026",
        selectionTitle: "参加できる日にち",
        selectionType: SelectionInputType.CHECKBOX,
        selectionOptions: ["4/10(金) 朝", "4/11(土) 朝", "4/11(土) 午後"],
        selectionOptionLimits: [20, 20, 0],
        useDateRange: false,
        eventStartDate: new Date("2026-03-25T00:00:00+09:00"),
        eventEndDate: new Date("2026-03-25T00:00:00+09:00"),
        eventStartTime: "09:00",
        eventEndTime: "11:00",
        startsAt: new Date("2026-03-25T09:00:00+09:00"),
        endsAt: new Date("2026-03-25T11:00:00+09:00"),
        closeAt: new Date("2026-03-22T18:00:00+09:00"),
        capacity: 8,
        status: SurveyStatus.PUBLISHED
      },
      {
        slug: "library-support",
        title: "図書室整理サポート",
        committee: "図書委員会",
        description: "本の仕分けや掲示物の張り替えを行う軽作業です。",
        workDetails: "本の仕分け、棚整理、掲示物差し替えを中心に行います。軍手があると便利です。",
        confirmationMessage:
          "ご応募ありがとうございます。担当が確定しました。\n\n当日の詳細は以下をご確認ください。\nhttps://example.com/openchat\nパスワード: PTA2026",
        selectionTitle: null,
        selectionType: SelectionInputType.NONE,
        selectionOptions: [],
        selectionOptionLimits: [],
        useDateRange: false,
        eventStartDate: new Date("2026-03-29T00:00:00+09:00"),
        eventEndDate: new Date("2026-03-29T00:00:00+09:00"),
        eventStartTime: "13:00",
        eventEndTime: "15:00",
        startsAt: new Date("2026-03-29T13:00:00+09:00"),
        endsAt: new Date("2026-03-29T15:00:00+09:00"),
        closeAt: new Date("2026-03-26T17:00:00+09:00"),
        capacity: 5,
        status: SurveyStatus.PUBLISHED
      }
    ]
  });
}
