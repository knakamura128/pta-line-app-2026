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
        <article className="survey-card survey-open">
          <div className="section-title-row">
            <h2>募集管理</h2>
            <span>{surveys.length} 件</span>
          </div>
          <div className="table-card">
            <div className="table-head">
              <span>募集名</span>
              <span>締切</span>
              <span>応募数</span>
              <span>詳細</span>
            </div>
            {surveys.map((survey) => (
              <div className="table-row" key={survey.id}>
                <span>{survey.title}</span>
                <span>{formatDateTime(survey.closeAt)}</span>
                <span>
                  {survey._count.applications} / {survey.capacity}
                </span>
                <Link className="text-link" href={`/admin/surveys/${survey.slug}`}>
                  応募詳細
                </Link>
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
