import Link from "next/link";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  await ensureSeedData();

  const [applications, surveys] = await Promise.all([
    prisma.application.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        survey: true
      }
    }),
    prisma.survey.findMany({
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
    })
  ]);

  return (
    <main className="survey-grid">
      <section className="survey-column">
        <article className="survey-card survey-open">
          <h2>募集別応募数</h2>
          <div className="table-card">
            <div className="table-head">
              <span>募集名</span>
              <span>応募数</span>
              <span>定員</span>
              <span>詳細</span>
            </div>
            {surveys.map((survey) => (
              <div className="table-row" key={survey.id}>
                <span>{survey.title}</span>
                <span>{survey._count.applications}</span>
                <span>{survey.capacity}</span>
                <Link className="text-link" href={`/admin/surveys/${survey.slug}`}>
                  集計を見る
                </Link>
              </div>
            ))}
          </div>
        </article>

        <article className="survey-card survey-open">
          <h2>最新の応募一覧</h2>
          <div className="table-card">
            <div className="table-head answers">
              <span>応募者</span>
              <span>募集</span>
              <span>学年/組</span>
              <span>応募日時</span>
            </div>
            {applications.map((application) => (
              <div className="table-row answers" key={application.id}>
                <span>{application.displayName}</span>
                <span>{application.survey.title}</span>
                <span>
                  {application.childGrade}年 {application.childClass}
                </span>
                <span>{formatDateTime(application.createdAt)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

function formatDateTime(value: Date) {
  return `${value.getFullYear()}/${pad(value.getMonth() + 1)}/${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}
