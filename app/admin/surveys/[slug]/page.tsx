import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkifiedText } from "@/app/components/linkified-text";
import { ensureSeedData } from "@/lib/bootstrap";
import { formatDateTimeInTokyo, formatSurveyScheduleInTokyo } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSurveyDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; confirmationSent?: string; confirmationFailed?: string }>;
}) {
  await ensureSeedData();
  const { slug } = await params;
  const { saved, confirmationSent, confirmationFailed } = await searchParams;

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

  const confirmationDeliveries = await prisma.messageDelivery.findMany({
    where: {
      surveyId: survey.id,
      kind: "CONFIRMATION",
      applicationId: {
        not: null
      }
    },
    select: {
      applicationId: true,
      status: true
    }
  });

  const recentMessageDeliveries = await prisma.messageDelivery.findMany({
    where: {
      surveyId: survey.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10,
    include: {
      application: {
        select: {
          familyName: true,
          displayName: true
        }
      }
    }
  });

  const successfulConfirmationApplicationIds = new Set(
    confirmationDeliveries
      .filter((delivery) => delivery.status === "SENT" && delivery.applicationId)
      .map((delivery) => delivery.applicationId as string)
  );
  const failedConfirmationApplicationIds = new Set(
    confirmationDeliveries
      .filter((delivery) => delivery.status === "FAILED" && delivery.applicationId)
      .map((delivery) => delivery.applicationId as string)
  );
  const confirmationTargets = survey.applications.slice(0, survey.capacity);
  const confirmationSentCount = confirmationTargets.filter((application) =>
    successfulConfirmationApplicationIds.has(application.id)
  ).length;
  const confirmationFailedCount = confirmationTargets.filter(
    (application) => !successfulConfirmationApplicationIds.has(application.id) && failedConfirmationApplicationIds.has(application.id)
  ).length;
  const confirmationPendingCount = confirmationTargets.length - confirmationSentCount;

  return (
    <main className="survey-grid">
      <section className="survey-column">
        <div className="admin-topbar">
          <div>
            <p className="top-label">Answers</p>
            <h3>回答一覧</h3>
          </div>
          <div className="hero-inline">
            <Link className="ghost-button small" href={`/admin/surveys/edit?id=${survey.id}`}>
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
            <p>
              <LinkifiedText text={survey.description} />
            </p>
          </div>
          <div className="detail-stack admin-meta-stack">
            <div className="detail-block">
              <p className="detail-title">開催日時</p>
              <p>{formatSurveyScheduleInTokyo(survey)}</p>
            </div>
            <div className="detail-block">
              <p className="detail-title">締切</p>
              <p>{formatDateTimeInTokyo(survey.closeAt)}</p>
            </div>
            {survey.selectionType !== "NONE" && survey.selectionTitle ? (
              <div className="detail-block">
                <p className="detail-title">{survey.selectionTitle}</p>
                <p>{Array.isArray(survey.selectionOptions) ? survey.selectionOptions.join(" / ") : "-"}</p>
              </div>
            ) : null}
            <div className="detail-block">
              <p className="detail-title">お仕事内容</p>
              <p>
                <LinkifiedText text={survey.workDetails} />
              </p>
            </div>
          </div>
        </div>

        {saved ? (
          <div className="inline-notice">
            <strong>{saved === "published" ? "公開内容を更新しました。" : "下書きを保存しました。"}</strong>
            <span>募集内容はこの画面と利用者向け一覧に順次反映されます。</span>
          </div>
        ) : null}

        {confirmationSent || confirmationFailed ? (
          <div className="inline-notice">
            <strong>
              確定通知を送信しました。成功 {confirmationSent ?? "0"} 件 / 失敗 {confirmationFailed ?? "0"} 件
            </strong>
            <span>LINE公式アカウントの友だち追加状況やチャネル設定によっては送信できない場合があります。</span>
          </div>
        ) : null}

        <div className="table-card">
          <div className="section-title-row">
            <h4>回答者一覧</h4>
            <span>先着 {survey.capacity} 名が通知対象</span>
          </div>
          <div className="table-head answers">
            <span>回答者</span>
            <span>回答日時</span>
            <span>状態</span>
            <span>回答内容</span>
          </div>
          {survey.applications.map((application, index) => (
            <div className="table-row answers" key={application.id}>
              <div className="mobile-table-cell" data-label="回答者">
                <span>
                  {application.familyName} / {application.displayName}
                  <br />
                  <small>
                    {application.childGrade}年 {application.childClass}
                  </small>
                </span>
              </div>
              <div className="mobile-table-cell" data-label="回答日時">
                <span>{formatDateTimeInTokyo(application.createdAt)}</span>
              </div>
              <div className="mobile-table-cell" data-label="状態">
                <span>
                  <span className={`tag ${index < survey.capacity ? "confirmed" : "pending"}`}>
                    {index < survey.capacity ? "確定候補" : "確定前"}
                  </span>
                  <br />
                  <small className={`notification-status ${getConfirmationStatusClass(application.id, index < survey.capacity, successfulConfirmationApplicationIds, failedConfirmationApplicationIds)}`}>
                    {getConfirmationStatusLabel(application.id, index < survey.capacity, successfulConfirmationApplicationIds, failedConfirmationApplicationIds)}
                  </small>
                </span>
              </div>
              <div className="mobile-table-cell" data-label="回答内容">
                <span>
                  {Array.isArray(application.selectionAnswers) && application.selectionAnswers.length > 0
                    ? application.selectionAnswers.join(" / ")
                    : application.note || "-"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="table-card">
          <div className="section-title-row">
            <h4>送信ログ</h4>
            <span>最新 {recentMessageDeliveries.length} 件</span>
          </div>
          <div className="table-head message-log-table">
            <span>送信種別</span>
            <span>対象者</span>
            <span>結果</span>
            <span>送信時刻</span>
            <span>失敗理由</span>
          </div>
          {recentMessageDeliveries.map((delivery) => (
            <div className="table-row message-log-table" key={delivery.id}>
              <div className="mobile-table-cell" data-label="送信種別">
                <span>{delivery.kind === "RECEIPT" ? "受付通知" : "確定通知"}</span>
              </div>
              <div className="mobile-table-cell" data-label="対象者">
                <span>{delivery.application ? `${delivery.application.familyName} / ${delivery.application.displayName}` : "-"}</span>
              </div>
              <div className="mobile-table-cell" data-label="結果">
                <span className={`tag ${delivery.status === "SENT" ? "confirmed" : "closed"}`}>
                  {delivery.status === "SENT" ? "成功" : "失敗"}
                </span>
              </div>
              <div className="mobile-table-cell" data-label="送信時刻">
                <span>{formatDateTimeInTokyo(delivery.createdAt)}</span>
              </div>
              <div className="mobile-table-cell" data-label="失敗理由">
                <span>{delivery.errorMessage || "-"}</span>
              </div>
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
          <div className="detail-block">
            <p className="detail-title">確定通知</p>
            <p>
              送信済み: {confirmationSentCount} / {confirmationTargets.length} 件
              <br />
              未成功: {confirmationPendingCount} 人
              {confirmationFailedCount > 0 ? `（失敗 ${confirmationFailedCount} 人）` : ""}
            </p>
          </div>
          <form action="/api/admin/surveys/confirm" method="post">
            <input name="surveyId" type="hidden" value={survey.id} />
            <button className="primary-button wide" type="submit">
              先着 {Math.min(survey.capacity, survey.applications.length)} 名へ確定通知を送る
            </button>
          </form>
        </div>
      </aside>
    </main>
  );
}

function getConfirmationStatusLabel(
  applicationId: string,
  isConfirmationTarget: boolean,
  successfulConfirmationApplicationIds: Set<string>,
  failedConfirmationApplicationIds: Set<string>
) {
  if (!isConfirmationTarget) {
    return "確定通知: 対象外";
  }

  if (successfulConfirmationApplicationIds.has(applicationId)) {
    return "確定通知: 送信済み";
  }

  if (failedConfirmationApplicationIds.has(applicationId)) {
    return "確定通知: 失敗あり";
  }

  return "確定通知: 未送信";
}

function getConfirmationStatusClass(
  applicationId: string,
  isConfirmationTarget: boolean,
  successfulConfirmationApplicationIds: Set<string>,
  failedConfirmationApplicationIds: Set<string>
) {
  if (!isConfirmationTarget) {
    return "muted";
  }

  if (successfulConfirmationApplicationIds.has(applicationId)) {
    return "sent";
  }

  if (failedConfirmationApplicationIds.has(applicationId)) {
    return "failed";
  }

  return "pending";
}
