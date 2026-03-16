import Link from "next/link";
import { createSurveyAction } from "@/app/admin/surveys/actions";
import { ensureSeedData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSurveyNewPage({
  searchParams
}: {
  searchParams: Promise<{ copyFrom?: string }>;
}) {
  await ensureSeedData();
  const { copyFrom } = await searchParams;

  const sourceSurvey = copyFrom
    ? await prisma.survey.findUnique({
        where: {
          slug: copyFrom
        }
      })
    : null;

  return (
    <main className="survey-grid">
      <section className="survey-column">
        <div className="admin-topbar">
          <div>
            <p className="top-label">Editor</p>
            <h3>{sourceSurvey ? "コピー新規" : "募集作成"}</h3>
          </div>
          <Link className="ghost-button small" href="/admin/surveys">
            募集一覧へ
          </Link>
        </div>

        {sourceSurvey ? (
          <div className="inline-notice">
            <strong>コピー元: {sourceSurvey.title}</strong>
            <span>内容を引き継いだ新規作成です。下書き保存または公開ができます。</span>
          </div>
        ) : null}

        <div className="table-card">
          <form action={createSurveyAction}>
            <div className="form-layout">
              <label className="field">
                <span>募集タイトル</span>
                <input defaultValue={sourceSurvey?.title ?? ""} name="title" required type="text" />
              </label>

              <div className="double-fields">
                <label className="field">
                  <span>担当区分</span>
                  <select defaultValue={sourceSurvey?.committee ?? "校外委員会"} name="committee" required>
                    <option value="校外委員会">校外委員会</option>
                    <option value="図書委員会">図書委員会</option>
                    <option value="本部役員">本部役員</option>
                    <option value="運営スタッフ">運営スタッフ</option>
                  </select>
                </label>
                <label className="field">
                  <span>募集人数</span>
                  <input defaultValue={sourceSurvey?.capacity ?? 8} min={1} name="capacity" required type="number" />
                </label>
              </div>

              <div className="triple-fields">
                <label className="field">
                  <span>開催日</span>
                  <input
                    defaultValue={sourceSurvey ? formatDate(sourceSurvey.startsAt) : "2026-04-10"}
                    name="eventDate"
                    required
                    type="date"
                  />
                </label>
                <label className="field">
                  <span>開始時刻</span>
                  <input
                    defaultValue={sourceSurvey ? formatTime(sourceSurvey.startsAt) : "09:00"}
                    name="startTime"
                    required
                    type="time"
                  />
                </label>
                <label className="field">
                  <span>終了時刻</span>
                  <input
                    defaultValue={sourceSurvey ? formatTime(sourceSurvey.endsAt) : "11:00"}
                    name="endTime"
                    required
                    type="time"
                  />
                </label>
              </div>

              <label className="field">
                <span>締切日時</span>
                <input
                  defaultValue={sourceSurvey ? formatDateTimeLocal(sourceSurvey.closeAt) : "2026-04-07T18:00"}
                  name="closeAt"
                  required
                  type="datetime-local"
                />
              </label>

              <label className="field">
                <span>募集内容</span>
                <textarea
                  defaultValue={
                    sourceSurvey?.description ?? "受付、誘導、見守りなど、短時間で参加できるお手伝いを想定しています。"
                  }
                  name="description"
                  required
                  rows={4}
                />
              </label>

              <label className="field">
                <span>お仕事内容</span>
                <textarea
                  defaultValue={
                    sourceSurvey?.workDetails ?? "集合場所に集まり、役割分担の後に担当エリアで作業します。終了後は現地解散です。"
                  }
                  name="workDetails"
                  required
                  rows={4}
                />
              </label>

              <label className="field">
                <span>確定通知本文</span>
                <textarea
                  defaultValue={
                    sourceSurvey?.confirmationMessage ??
                    `ご応募ありがとうございます。担当が確定しました。\n\n当日の詳細は以下をご確認ください。\nhttps://example.com/openchat\nパスワード: PTA2026`
                  }
                  name="confirmationMessage"
                  required
                  rows={5}
                />
              </label>
            </div>

            <div className="cta-row admin-actions">
              <button className="ghost-button" name="mode" type="submit" value="draft">
                下書き保存
              </button>
              <Link className="ghost-button" href="/admin/surveys">
                キャンセル
              </Link>
              <button className="primary-button" name="mode" type="submit" value="publish">
                公開する
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
