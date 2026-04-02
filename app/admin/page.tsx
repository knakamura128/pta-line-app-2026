import Link from "next/link";
import { ensureSeedData } from "@/lib/bootstrap";
import { formatShortDateTimeInTokyo } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await ensureSeedData();

  const [surveyCount, applicationCount, openSurveyCount, surveys] = await Promise.all([
    prisma.survey.count(),
    prisma.application.count(),
    prisma.survey.count({
      where: {
        status: "PUBLISHED"
      }
    }),
    prisma.survey.findMany({
      orderBy: [{ closeAt: "asc" }, { startsAt: "asc" }],
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    })
  ]);

  const publishedSurveys = surveys.filter((survey) => survey.status === "PUBLISHED");
  const closingSoonCount = publishedSurveys.slice(0, 2).length;
  const capacityReachedCount = publishedSurveys.filter((survey) => survey._count.applications >= survey.capacity).length;
  const recentSurveys = publishedSurveys.slice(0, 4);

  return (
    <main className="survey-grid">
      <section className="survey-column">
        <div className="admin-topbar">
          <div>
            <p className="top-label">Dashboard</p>
            <h3>本日の募集状況</h3>
          </div>
          <Link className="primary-button small" href="/admin/surveys/new">
            新規募集
          </Link>
        </div>

        <div className="stat-grid">
          <article className="stat-card">
            <span>公開中</span>
            <strong>{openSurveyCount}</strong>
          </article>
          <article className="stat-card accent">
            <span>締切間近</span>
            <strong>{closingSoonCount}</strong>
          </article>
          <article className="stat-card warm">
            <span>定員到達</span>
            <strong>{capacityReachedCount}</strong>
          </article>
          <article className="stat-card dark">
            <span>総応募数</span>
            <strong>{applicationCount}</strong>
          </article>
        </div>

        <div className="admin-card admin-split-card">
          <div>
            <div className="section-title-row">
              <h4>募集管理</h4>
              <span>{surveyCount} 件</span>
            </div>
            <p>募集一覧から編集、コピー新規、回答確認へ遷移できます。</p>
          </div>
          <div className="hero-inline">
            <Link className="text-link" href="/admin/surveys">
              募集一覧へ
            </Link>
            <Link className="text-link" href="/admin/applications">
              回答一覧へ
            </Link>
          </div>
        </div>

        <div className="table-card">
          <div className="section-title-row">
            <h4>公開中の募集</h4>
            <Link className="text-link" href="/admin/surveys">
              すべて見る
            </Link>
          </div>
          <div className="table-head recent-survey-table">
            <span>募集名</span>
            <span>状況</span>
            <span>人数</span>
            <span>締切</span>
          </div>
          {recentSurveys.map((survey) => (
            <div className="table-row recent-survey-table" key={survey.id}>
              <div className="mobile-table-cell" data-label="募集名">
                <span>{survey.title}</span>
              </div>
              <div className="mobile-table-cell" data-label="状況">
                <span className={`tag ${survey._count.applications >= survey.capacity ? "closed" : "active"}`}>
                  {survey._count.applications >= survey.capacity ? "定員到達" : "公開中"}
                </span>
              </div>
              <div className="mobile-table-cell" data-label="人数">
                <span>
                  {survey._count.applications} / {survey.capacity}
                </span>
              </div>
              <div className="mobile-table-cell" data-label="締切">
                <span>{formatShortDateTimeInTokyo(survey.closeAt)}</span>
              </div>
            </div>
          ))}
          {recentSurveys.length === 0 ? (
            <div className="table-row recent-survey-table">
              <div className="mobile-table-cell" data-label="募集名">
                <span>公開中の募集はまだありません。</span>
              </div>
              <div className="mobile-table-cell" data-label="状況">
                <span>-</span>
              </div>
              <div className="mobile-table-cell" data-label="人数">
                <span>-</span>
              </div>
              <div className="mobile-table-cell" data-label="締切">
                <span>-</span>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
