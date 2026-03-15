import { notFound } from "next/navigation";
import Link from "next/link";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSurveyEditPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureSeedData();
  const { slug } = await params;

  const survey = await prisma.survey.findUnique({
    where: {
      slug
    }
  });

  if (!survey) {
    notFound();
  }

  return (
    <main className="survey-grid">
      <section className="survey-column">
        <div className="admin-topbar">
          <div>
            <p className="top-label">Editor</p>
            <h3>募集編集</h3>
          </div>
          <div className="hero-inline">
            <Link className="text-link" href={`/admin/surveys/${survey.slug}`}>
              回答一覧へ
            </Link>
            <Link className="ghost-button small" href="/admin/surveys">
              募集一覧へ
            </Link>
          </div>
        </div>

        <div className="table-card">
          <div className="form-layout">
            <label className="field">
              <span>募集タイトル</span>
              <input defaultValue={survey.title} type="text" />
            </label>

            <div className="double-fields">
              <label className="field">
                <span>担当区分</span>
                <select defaultValue={survey.committee}>
                  <option value="校外委員会">校外委員会</option>
                  <option value="図書委員会">図書委員会</option>
                  <option value="本部役員">本部役員</option>
                  <option value="運営スタッフ">運営スタッフ</option>
                </select>
              </label>
              <label className="field">
                <span>募集人数</span>
                <input defaultValue={survey.capacity} min={1} type="number" />
              </label>
            </div>

            <div className="triple-fields">
              <label className="field">
                <span>開催日</span>
                <input defaultValue={formatDate(survey.startsAt)} type="date" />
              </label>
              <label className="field">
                <span>開始時刻</span>
                <input defaultValue={formatTime(survey.startsAt)} type="time" />
              </label>
              <label className="field">
                <span>終了時刻</span>
                <input defaultValue={formatTime(survey.endsAt)} type="time" />
              </label>
            </div>

            <label className="field">
              <span>締切日時</span>
              <input defaultValue={formatDateTimeLocal(survey.closeAt)} type="datetime-local" />
            </label>

            <label className="field">
              <span>募集内容</span>
              <textarea defaultValue={survey.description} rows={4} />
            </label>

            <label className="field">
              <span>お仕事内容</span>
              <textarea
                defaultValue={"集合後に役割分担を行い、各担当でサポートをお願いします。終了後は簡単な引き継ぎがあります。"}
                rows={4}
              />
            </label>

            <label className="field">
              <span>確定通知本文</span>
              <textarea
                defaultValue={`ご応募ありがとうございます。担当が確定しました。\n\n当日の詳細は以下をご確認ください。\nhttps://example.com/openchat\nパスワード: PTA2026`}
                rows={5}
              />
            </label>
          </div>

          <div className="cta-row admin-actions">
            <Link className="ghost-button" href="/admin/surveys">
              下書き保存
            </Link>
            <Link className="ghost-button" href={`/admin/surveys/${survey.slug}`}>
              回答一覧
            </Link>
            <Link className="primary-button" href="/admin/surveys">
              更新する
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatTime(value: Date) {
  return value.toISOString().slice(11, 16);
}

function formatDateTimeLocal(value: Date) {
  return `${formatDate(value)}T${formatTime(value)}`;
}
