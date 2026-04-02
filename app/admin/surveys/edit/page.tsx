import { notFound } from "next/navigation";
import Link from "next/link";
import { updateSurveyAction } from "@/app/admin/surveys/actions";
import { SelectionOptionsEditor } from "@/app/admin/surveys/selection-options-editor";
import { ensureSeedData } from "@/lib/bootstrap";
import { formatDateTimeLocalInputInTokyo } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSurveyEditPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await ensureSeedData();
  const { id } = await searchParams;

  if (!id) {
    notFound();
  }

  const survey = await prisma.survey.findUnique({
    where: {
      id
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
            {survey.status !== "DRAFT" ? (
              <Link className="text-link" href={`/admin/surveys/${survey.slug}`}>
                回答一覧へ
              </Link>
            ) : null}
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

              <div className="double-fields">
                <label className="field">
                  <span>開始日時</span>
                  <input
                    defaultValue={formatDateTimeLocalInputInTokyo(survey.startsAt)}
                    name="startsAt"
                    required
                    type="datetime-local"
                  />
                </label>
                <label className="field">
                  <span>終了日時</span>
                  <input
                    defaultValue={formatDateTimeLocalInputInTokyo(survey.endsAt)}
                    name="endsAt"
                    required
                    type="datetime-local"
                  />
                </label>
              </div>
              <p className="helper-text">複数日にまたがる活動も開始日時と終了日時だけで登録できます。</p>

              <label className="field">
                <span>締切日時</span>
                <input defaultValue={formatDateTimeLocalInputInTokyo(survey.closeAt)} name="closeAt" required type="datetime-local" />
              </label>

              <label className="field">
                <span>募集内容</span>
                <textarea defaultValue={survey.description} name="description" required rows={4} />
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
                      defaultValue={survey.selectionTitle ?? ""}
                      name="selectionTitle"
                      placeholder="例: 参加できる日にち"
                      type="text"
                    />
                  </label>
                  <label className="field">
                    <span>入力形式</span>
                    <select defaultValue={survey.selectionType} name="selectionType">
                      <option value="NONE">なし</option>
                      <option value="RADIO">ラジオボタン（単一選択）</option>
                      <option value="CHECKBOX">チェックボックス（複数選択）</option>
                    </select>
                  </label>
                  <div className="field">
                    <span>選択肢ごとの上限</span>
                    <SelectionOptionsEditor
                      initialOptions={survey.selectionOptions.map((label, index) => ({
                        label,
                        limit: survey.selectionOptionLimits[index] ?? 0
                      }))}
                    />
                  </div>
                </div>
              </div>

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
              {survey.status !== "DRAFT" ? (
                <Link className="ghost-button" href={`/admin/surveys/${survey.slug}`}>
                  回答一覧
                </Link>
              ) : (
                <Link className="ghost-button" href="/admin/surveys">
                  募集一覧
                </Link>
              )}
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
