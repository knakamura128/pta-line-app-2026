import Link from "next/link";
import { ensureSeedData } from "@/lib/bootstrap";
import { formatDateTimeInTokyo } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  await ensureSeedData();

  const [applications, surveys, messageDeliveries] = await Promise.all([
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
    }),
    prisma.messageDelivery.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 30,
      include: {
        survey: {
          select: {
            title: true
          }
        },
        application: {
          select: {
            familyName: true,
            displayName: true
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
          <span className="status-pill">受付通知は自動送信 / 確定通知は募集詳細から送信</span>
        </div>

        <div className="table-card">
          <div className="section-title-row">
            <h4>募集別応募数</h4>
            <span>{applications.length} 件</span>
          </div>
          <div className="table-head applications-summary-table">
            <span>募集名</span>
            <span>応募数</span>
            <span>定員</span>
            <span>詳細</span>
          </div>
          {surveys.map((survey) => (
            <div className="table-row applications-summary-table" key={survey.id}>
              <div className="mobile-table-cell" data-label="募集名">
                <span>{survey.title}</span>
              </div>
              <div className="mobile-table-cell" data-label="応募数">
                <span>{survey._count.applications}</span>
              </div>
              <div className="mobile-table-cell" data-label="定員">
                <span>{survey.capacity}</span>
              </div>
              <div className="mobile-table-cell" data-label="詳細">
                <Link className="text-link" href={`/admin/surveys/${survey.slug}`}>
                  集計を見る
                </Link>
              </div>
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
            <span>募集 / 選択内容</span>
          </div>
          {applications.map((application, index) => (
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
                <span className={`tag ${index < application.survey.capacity ? "confirmed" : "pending"}`}>
                  {index < application.survey.capacity ? "確定候補" : "確定前"}
                </span>
              </div>
              <div className="mobile-table-cell" data-label="募集 / 選択内容">
                <span>
                  {application.survey.title}
                  <br />
                  <small>
                    {Array.isArray(application.selectionAnswers) && application.selectionAnswers.length > 0
                      ? application.selectionAnswers.join(" / ")
                      : "-"}
                  </small>
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="table-card">
          <div className="section-title-row">
            <h4>送信ログ</h4>
            <span>{messageDeliveries.length} 件</span>
          </div>
          <div className="table-head message-log-table">
            <span>送信種別</span>
            <span>対象者</span>
            <span>募集</span>
            <span>結果</span>
            <span>失敗理由</span>
          </div>
          {messageDeliveries.map((delivery) => (
            <div className="table-row message-log-table" key={delivery.id}>
              <div className="mobile-table-cell" data-label="送信種別">
                <span>{delivery.kind === "RECEIPT" ? "受付通知" : "確定通知"}</span>
              </div>
              <div className="mobile-table-cell" data-label="対象者">
                <span>{delivery.application ? `${delivery.application.familyName} / ${delivery.application.displayName}` : "-"}</span>
              </div>
              <div className="mobile-table-cell" data-label="募集">
                <span>{delivery.survey.title}</span>
              </div>
              <div className="mobile-table-cell" data-label="結果">
                <span className={`tag ${delivery.status === "SENT" ? "confirmed" : "closed"}`}>
                  {delivery.status === "SENT" ? "成功" : "失敗"}
                </span>
              </div>
              <div className="mobile-table-cell" data-label="失敗理由">
                <span>{delivery.errorMessage || "-"}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
