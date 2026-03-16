import { notFound } from "next/navigation";
import Link from "next/link";
import { updateSurveyAction } from "@/app/admin/surveys/actions";
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
          <form action={updateSurveyAction}>
            <input name="surveyId" type="hidden" value={survey.id} />
            <div className="form-layout">
              <label className="field">
                <span>募集タイトル</span>
                <input defaultValue={survey.title} name="title" required type="text" />
              </label>

              <div className="double-fields">
                <label className="field">
                  <span>担当区分</span>
                  <select defaultValue={survey.committee} name="committee" required>
                    <option value="校外委員会">校外委員会</option>
                    <option value="図書委員会">図書委員会</option>
                    <option value="本部役員">本部役員</option>
                    <option value="運営スタッフ">運営スタッフ</option>
                  </select>
                </label>
                <label className="field">
                  <span>募集人数</span>
                  <input defaultValue={survey.capacity} min={1} name="capacity" required type="number" />
                </label>
              </div>

              <div className="triple-fields">
                <label className="field">
                  <span>開催日</span>
                  <input defaultValue={formatDate(survey.startsAt)} name="eventDate" required type="date" />
                </label>
                <label className="field">
                  <span>開始時刻</span>
                  <input defaultValue={formatTime(survey.startsAt)} name="startTime" required type="time" />
                </label>
                <label className="field">
                  <span>終了時刻</span>
                  <input defaultValue={formatTime(survey.endsAt)} name="endTime" required type="time" />
                </label>
              </div>

              <label className="field">
                <span>締切日時</span>
                <input defaultValue={formatDateTimeLocal(survey.closeAt)} name="closeAt" required type="datetime-local" />
              </label>

              <label className="field">
                <span>募集内容</span>
                <textarea defaultValue={survey.description} name="description" required rows={4} />
              </label>

              <label className="field">
                <span>お仕事内容</span>
                <textarea defaultValue={survey.workDetails} name="workDetails" required rows={4} />
              </label>

              <label className="field">
                <span>確定通知本文</span>
                <textarea defaultValue={survey.confirmationMessage} name="confirmationMessage" required rows={5} />
              </label>
            </div>

            <div className="cta-row admin-actions">
              <button className="ghost-button" name="mode" type="submit" value="draft">
                下書き保存
              </button>
              <Link className="ghost-button" href={`/admin/surveys/${survey.slug}`}>
                回答一覧
              </Link>
              <button className="primary-button" name="mode" type="submit" value="publish">
                更新する
              </button>
            </div>
          </form>
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
