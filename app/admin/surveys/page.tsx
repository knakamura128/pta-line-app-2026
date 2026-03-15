import Link from "next/link";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSurveysPage() {
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

  return (
    <main className="survey-grid">
      <section className="survey-column">
        <div className="admin-topbar">
          <div>
            <p className="top-label">Surveys</p>
            <h3>募集一覧</h3>
          </div>
          <div className="hero-inline">
            <Link className="ghost-button small" href="/admin/surveys/new">
              新規募集
            </Link>
            <Link className="primary-button small" href="/admin/surveys/new?copyFrom=traffic-safety">
              コピー新規
            </Link>
          </div>
        </div>

        <div className="table-card">
          <div className="table-head admin-survey-table">
            <span>募集名</span>
            <span>状況</span>
            <span>人数</span>
            <span>締切</span>
            <span>操作</span>
          </div>
          {surveys.map((survey) => (
            <div className="table-row admin-survey-table" key={survey.id}>
              <span>{survey.title}</span>
              <span className={`tag ${getSurveyTagClass(survey._count.applications, survey.capacity)}`}>
                {getSurveyStatusLabel(survey._count.applications, survey.capacity)}
              </span>
              <span>
                {survey._count.applications} / {survey.capacity}
              </span>
              <span>{formatDateTime(survey.closeAt)}</span>
              <div className="table-actions">
                <Link className="text-link" href={`/admin/surveys/${survey.slug}/edit`}>
                  編集
                </Link>
                <Link className="text-link" href={`/admin/surveys/new?copyFrom=${survey.slug}`}>
                  コピー新規
                </Link>
                <Link className="text-link" href={`/admin/surveys/${survey.slug}`}>
                  回答一覧
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function getSurveyStatusLabel(applicationCount: number, capacity: number) {
  if (applicationCount >= capacity) {
    return "定員到達";
  }

  return "公開中";
}

function getSurveyTagClass(applicationCount: number, capacity: number) {
  return applicationCount >= capacity ? "closed" : "active";
}

function formatDateTime(value: Date) {
  return `${value.getFullYear()}/${pad(value.getMonth() + 1)}/${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}
