"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type AttendanceCheckboxProps = {
  applicationId: string;
  initialChecked: boolean;
};

export function AttendanceCheckbox({ applicationId, initialChecked }: AttendanceCheckboxProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(initialChecked);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleChange(nextChecked: boolean) {
    setChecked(nextChecked);
    setError("");

    try {
      const response = await fetch("/api/admin/applications/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          applicationId,
          attendanceChecked: nextChecked
        })
      });

      const text = await response.text();
      const payload = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(typeof payload.message === "string" ? payload.message : "更新に失敗しました。");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (cause) {
      setChecked(!nextChecked);
      setError(cause instanceof Error ? cause.message : "更新に失敗しました。");
    }
  }

  return (
    <div className="attendance-control">
      <label className={`attendance-checkbox ${checked ? "is-checked" : ""} ${isPending ? "is-pending" : ""}`}>
        <input
          checked={checked}
          disabled={isPending}
          onChange={(event) => void handleChange(event.target.checked)}
          type="checkbox"
        />
        <span>{checked ? "確認済み" : "未確認"}</span>
      </label>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
