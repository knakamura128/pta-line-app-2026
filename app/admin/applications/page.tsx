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
        <div className="admin-topbar">
          <div>
            <p className="top-label">Answers</p>
            <h3>回答一覧</h3>
          </div>
          <span className="status-pill">通知機能は未実装</span>
        </div>

        <div className="table-card">
          <div className="section-title-row">
            <h4>募集別応募数</h4>
            <span>{applications.length} 件</span>
          </div>
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

        <div className="table-card">
          <div className="section-title-row">
            <h4>最新の回答一覧</h4>
            <span>先着順</span>
          </div>
          <div className="table-head answers">
            <span>回答者</span>
            <span>回答日時</span>
            <span>状態</span>
            <span>募集</span>
          </div>
          {applications.map((application, index) => (
            <div className="table-row answers" key={application.id}>
              <span>
                {application.displayName}
                <br />
                <small>
                  {application.childGrade}年 {application.childClass}
                </small>
              </span>
              <span>{formatDateTime(application.createdAt)}</span>
              <span className={`tag ${index < application.survey.capacity ? "confirmed" : "pending"}`}>
                {index < application.survey.capacity ? "確定候補" : "確定前"}
              </span>
              <span>{application.survey.title}</span>
            </div>
          ))}
        </div>
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
