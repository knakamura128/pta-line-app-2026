import Link from "next/link";
import { createSurveyAction } from "@/app/admin/surveys/actions";
import { ScheduleFieldsEditor } from "@/app/admin/surveys/schedule-fields-editor";
import { SelectionOptionsEditor } from "@/app/admin/surveys/selection-options-editor";
import { ensureSeedData } from "@/lib/bootstrap";
import { formatDateInputInTokyo, formatDateTimeLocalInputInTokyo, formatTimeInputInTokyo } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSurveyNewPage({
  searchParams
}: {
  searchParams: Promise<{ copyFrom?: string; error?: string }>;
}) {
  await ensureSeedData();
  const { copyFrom, error } = await searchParams;

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
          {error ? (
            <div className="inline-notice">
              <strong>保存できませんでした。</strong>
              <span>{error}</span>
            </div>
          ) : null}
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

              <ScheduleFieldsEditor
                initialEndDate={
                  sourceSurvey?.eventEndDate
                    ? formatDateInputInTokyo(sourceSurvey.eventEndDate)
                    : sourceSurvey
                      ? formatDateInputInTokyo(sourceSurvey.endsAt)
                      : "2026-04-10"
                }
                initialEndTime={sourceSurvey?.eventEndTime ?? (sourceSurvey ? formatTimeInputInTokyo(sourceSurvey.endsAt) : "11:00")}
                initialStartDate={
                  sourceSurvey?.eventStartDate
                    ? formatDateInputInTokyo(sourceSurvey.eventStartDate)
                    : sourceSurvey
                      ? formatDateInputInTokyo(sourceSurvey.startsAt)
                      : "2026-04-10"
                }
                initialStartTime={sourceSurvey?.eventStartTime ?? (sourceSurvey ? formatTimeInputInTokyo(sourceSurvey.startsAt) : "09:00")}
                initialUseDateRange={sourceSurvey?.useDateRange ?? false}
              />
              <p className="helper-text">期間入力を ON にすると、複数日に同じ時間帯で開催する募集をまとめて登録できます。</p>

              <label className="field">
                <span>締切日時</span>
                <input
                  defaultValue={sourceSurvey ? formatDateTimeLocalInputInTokyo(sourceSurvey.closeAt) : "2026-04-07T18:00"}
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

            <div className="table-card nested-card">
              <div className="section-title-row">
                <h4>追加の選択項目</h4>
                <span>任意</span>
              </div>
              <div className="form-layout">
                <label className="field">
                  <span>選択項目タイトル</span>
                  <input
                    defaultValue={sourceSurvey?.selectionTitle ?? ""}
                    name="selectionTitle"
                    placeholder="例: 参加できる日にち"
                    type="text"
                  />
                </label>
                <label className="field">
                  <span>入力形式</span>
                  <select defaultValue={sourceSurvey?.selectionType ?? "NONE"} name="selectionType">
                    <option value="NONE">なし</option>
                    <option value="RADIO">ラジオボタン（単一選択）</option>
                    <option value="CHECKBOX">チェックボックス（複数選択）</option>
                  </select>
                </label>
                <div className="field">
                  <span>選択肢ごとの上限</span>
                  <SelectionOptionsEditor
                    initialOptions={
                      Array.isArray(sourceSurvey?.selectionOptions)
                        ? sourceSurvey.selectionOptions.map((label, index) => ({
                            label,
                            limit: sourceSurvey.selectionOptionLimits[index] ?? 0
                          }))
                        : []
                    }
                  />
                </div>
              </div>
            </div>

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
