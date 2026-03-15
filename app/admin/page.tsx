import Link from "next/link";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await ensureSeedData();

  const [surveyCount, applicationCount, openSurveyCount] = await Promise.all([
    prisma.survey.count(),
    prisma.application.count(),
    prisma.survey.count({
      where: {
        status: "PUBLISHED"
      }
    })
  ]);

  return (
    <>
      <header className="landing-hero">
        <div className="hero-copy-wrap">
          <p className="eyebrow">Admin Console</p>
          <h1>管理者ダッシュボード</h1>
          <p className="hero-copy">
            この画面は Basic 認証で保護されています。募集管理、応募一覧、学年別集計の入口をここに集約します。
          </p>
          <div className="hero-inline">
            <Link className="text-link" href="/admin/surveys">
              募集管理へ
            </Link>
            <Link className="text-link" href="/admin/applications">
              応募集計へ
            </Link>
          </div>
        </div>
        <div className="summary-card">
          <span>保護範囲</span>
          <strong>/admin</strong>
          <p>認証情報は環境変数 `ADMIN_BASIC_USER` と `ADMIN_BASIC_PASS` で管理します。</p>
        </div>
      </header>

      <main className="survey-grid">
        <section className="survey-column">
          <div className="stat-grid admin-stat-grid">
            <article className="stat-card">
              <span>募集数</span>
              <strong>{surveyCount}</strong>
            </article>
            <article className="stat-card accent">
              <span>公開中</span>
              <strong>{openSurveyCount}</strong>
            </article>
            <article className="stat-card warm">
              <span>応募数</span>
              <strong>{applicationCount}</strong>
            </article>
          </div>
          <article className="survey-card survey-open">
            <h2>管理機能</h2>
            <div className="detail-stack">
              <div className="detail-block">
                <p className="detail-title">募集管理</p>
                <p>募集一覧、公開状況、応募人数、締切を確認できます。</p>
                <Link className="text-link" href="/admin/surveys">
                  募集管理ページへ
                </Link>
              </div>
              <div className="detail-block">
                <p className="detail-title">応募一覧</p>
                <p>学年別集計、応募者一覧、募集別の応募内訳を確認できます。</p>
                <Link className="text-link" href="/admin/applications">
                  応募集計ページへ
                </Link>
              </div>
              <div className="detail-block">
                <p className="detail-title">通知</p>
                <p>次段階で確定通知本文の管理、送信履歴の確認を追加します。</p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
