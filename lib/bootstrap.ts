import { SurveyStatus } from "@prisma/client";
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
        startsAt: new Date("2026-03-29T13:00:00+09:00"),
        endsAt: new Date("2026-03-29T15:00:00+09:00"),
        closeAt: new Date("2026-03-26T17:00:00+09:00"),
        capacity: 5,
        status: SurveyStatus.PUBLISHED
      }
    ]
  });
}
