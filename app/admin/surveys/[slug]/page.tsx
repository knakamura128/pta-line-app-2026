import { notFound } from "next/navigation";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSurveyDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureSeedData();
  const { slug } = await params;

  const survey = await prisma.survey.findUnique({
    where: { slug },
    include: {
      applications: {
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!survey) {
    notFound();
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

  const classSummary = await prisma.application.groupBy({
    by: ["childGrade", "childClass"],
    where: {
      surveyId: survey.id
    },
    _count: {
      childClass: true
    },
    orderBy: [{ childGrade: "asc" }, { childClass: "asc" }]
  });

  return (
    <main className="survey-grid">
      <section className="survey-column">
        <article className="survey-card survey-open">
          <div className="section-title-row">
            <h2>{survey.title}</h2>
            <span>
              {survey.applications.length} / {survey.capacity} 名
            </span>
          </div>
          <div className="detail-stack">
            <div className="detail-block">
              <p className="detail-title">募集内容</p>
              <p>{survey.description}</p>
            </div>
            <div className="detail-grid">
              <div className="detail-block">
                <p className="detail-title">開催日時</p>
                <p>{formatSchedule(survey.startsAt, survey.endsAt)}</p>
              </div>
              <div className="detail-block">
                <p className="detail-title">締切</p>
                <p>{formatDateTime(survey.closeAt)}</p>
              </div>
            </div>
          </div>
        </article>

        <article className="survey-card survey-open">
          <h2>応募一覧</h2>
          <div className="table-card">
            <div className="table-head answers">
              <span>応募者</span>
              <span>学年/組</span>
              <span>応募日時</span>
              <span>メモ</span>
            </div>
            {survey.applications.map((application) => (
              <div className="table-row answers" key={application.id}>
                <span>{application.displayName}</span>
                <span>
                  {application.childGrade}年 {application.childClass}
                </span>
                <span>{formatDateTime(application.createdAt)}</span>
                <span>{application.note || "-"}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <aside className="apply-panel">
        <div className="panel-head">
          <p className="panel-kicker">Summary</p>
          <h2>集計</h2>
        </div>
        <div className="detail-stack">
          <div className="detail-block">
            <p className="detail-title">学年別</p>
            <p>
              {gradeSummary.length > 0
                ? gradeSummary.map((row) => `${row.childGrade}年: ${row._count.childGrade}人`).join(" / ")
                : "まだ応募はありません"}
            </p>
          </div>
          <div className="detail-block">
            <p className="detail-title">組別</p>
            <p>
              {classSummary.length > 0
                ? classSummary.map((row) => `${row.childGrade}年${row.childClass}: ${row._count.childClass}人`).join(" / ")
                : "まだ応募はありません"}
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}

function formatSchedule(startsAt: Date, endsAt: Date) {
  return `${startsAt.getMonth() + 1}/${startsAt.getDate()} ${pad(startsAt.getHours())}:${pad(startsAt.getMinutes())}-${pad(endsAt.getHours())}:${pad(endsAt.getMinutes())}`;
}

function formatDateTime(value: Date) {
  return `${value.getFullYear()}/${pad(value.getMonth() + 1)}/${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}
