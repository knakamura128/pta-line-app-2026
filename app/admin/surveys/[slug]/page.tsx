import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSurveyDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await ensureSeedData();
  const { slug } = await params;
  const { saved } = await searchParams;

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
        <div className="admin-topbar">
          <div>
            <p className="top-label">Answers</p>
            <h3>回答一覧</h3>
          </div>
          <div className="hero-inline">
            <Link className="ghost-button small" href={`/admin/surveys/${survey.slug}/edit`}>
              募集編集
            </Link>
            <Link className="primary-button small" href={`/admin/surveys/new?copyFrom=${survey.slug}`}>
              コピー新規
            </Link>
          </div>
        </div>

        <div className="admin-card admin-split-card">
          <div>
            <div className="section-title-row">
              <h4>{survey.title}</h4>
              <span>
                {survey.applications.length} / {survey.capacity} 名
              </span>
            </div>
            <p>{survey.description}</p>
          </div>
          <div className="detail-stack admin-meta-stack">
            <div className="detail-block">
              <p className="detail-title">開催日時</p>
              <p>{formatSchedule(survey.startsAt, survey.endsAt)}</p>
            </div>
            <div className="detail-block">
              <p className="detail-title">締切</p>
              <p>{formatDateTime(survey.closeAt)}</p>
            </div>
            <div className="detail-block">
              <p className="detail-title">お仕事内容</p>
              <p>{survey.workDetails}</p>
            </div>
          </div>
        </div>

        {saved ? (
          <div className="inline-notice">
            <strong>{saved === "published" ? "公開内容を更新しました。" : "下書きを保存しました。"}</strong>
            <span>募集内容はこの画面と利用者向け一覧に順次反映されます。</span>
          </div>
        ) : null}

        <div className="table-card">
          <div className="section-title-row">
            <h4>回答者一覧</h4>
            <span>通知機能は未実装</span>
          </div>
          <div className="table-head answers">
            <span>回答者</span>
            <span>回答日時</span>
            <span>状態</span>
            <span>メモ</span>
          </div>
          {survey.applications.map((application, index) => (
            <div className="table-row answers" key={application.id}>
              <span>
                {application.displayName}
                <br />
                <small>
                  {application.childGrade}年 {application.childClass}
                </small>
              </span>
              <span>{formatDateTime(application.createdAt)}</span>
              <span className={`tag ${index < survey.capacity ? "confirmed" : "pending"}`}>
                {index < survey.capacity ? "確定候補" : "確定前"}
              </span>
              <span>{application.note || "-"}</span>
            </div>
          ))}
        </div>
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
