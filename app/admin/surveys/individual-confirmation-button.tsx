"use client";

import { useRef, useState } from "react";

export function IndividualConfirmationButton({
  surveyId,
  applicationId,
  recipientName,
  sent
}: {
  surveyId: string;
  applicationId: string;
  recipientName: string;
  sent: boolean;
}) {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);

  return (
    <form
      action="/api/admin/surveys/confirm"
      method="post"
      onSubmit={(event) => {
        if (submitting.current || !window.confirm(`${recipientName} さんに確定通知を${sent ? "再送" : "送信"}します。よろしいですか？`)) {
          event.preventDefault();
          return;
        }
        submitting.current = true;
        setPending(true);
      }}
    >
      <input name="surveyId" type="hidden" value={surveyId} />
      <input name="applicationId" type="hidden" value={applicationId} />
      <button className="primary-button small confirmation-send-button" disabled={pending} type="submit">
        {pending ? "送信中…" : sent ? "確定通知を再送する" : "確定通知を個別送信"}
      </button>
    </form>
  );
}
