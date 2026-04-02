"use client";

import Link from "next/link";
import { deleteSurveyAction } from "@/app/admin/surveys/actions";

export function SurveyActionButtons({
  surveyId,
  surveySlug,
  isDraft
}: {
  surveyId: string;
  surveySlug: string;
  isDraft: boolean;
}) {
  return (
    <div className="table-actions action-button-group">
      <Link className="ghost-button small" href={`/admin/surveys/edit?id=${surveyId}`}>
        編集する
      </Link>
      <Link className="ghost-button small" href={`/admin/surveys/new?copyFrom=${surveySlug}`}>
        複製して新規
      </Link>
      {!isDraft ? (
        <Link className="primary-button small" href={`/admin/surveys/${surveySlug}`}>
          回答を確認
        </Link>
      ) : (
        <span className="action-hint">下書き中は回答なし</span>
      )}
      <form
        action={deleteSurveyAction}
        onSubmit={(event) => {
          if (!window.confirm("この募集を削除します。応募データと送信ログも削除されます。よろしいですか？")) {
            event.preventDefault();
          }
        }}
      >
        <input name="surveyId" type="hidden" value={surveyId} />
        <button className="danger-button small" type="submit">
          削除
        </button>
      </form>
    </div>
  );
}
