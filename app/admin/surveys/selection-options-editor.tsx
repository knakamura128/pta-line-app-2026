"use client";

import { useState } from "react";

type SelectionOptionRow = {
  id: string;
  label: string;
  limit: number;
};

export function SelectionOptionsEditor({
  initialOptions
}: {
  initialOptions: Array<Pick<SelectionOptionRow, "label" | "limit">>;
}) {
  const [rows, setRows] = useState<SelectionOptionRow[]>(() =>
    initialOptions.length > 0
      ? initialOptions.map((row) => ({ ...row, id: crypto.randomUUID() }))
      : [{ id: crypto.randomUUID(), label: "", limit: 0 }]
  );

  function updateRow(index: number, nextRow: SelectionOptionRow) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? nextRow : row)));
  }

  function removeRow(index: number) {
    setRows((current) =>
      current.length === 1
        ? [{ id: crypto.randomUUID(), label: "", limit: 0 }]
        : current.filter((_, rowIndex) => rowIndex !== index)
    );
  }

  return (
    <div className="form-layout">
      {rows.map((row, index) => (
        <div className="selection-option-row" key={row.id}>
          <label className="field">
            <span>選択肢</span>
            <input
              name="selectionOptionLabel"
              onChange={(event) => updateRow(index, { ...row, label: event.target.value })}
              placeholder="例: 4/1 午前"
              type="text"
              value={row.label}
            />
          </label>
          <label className="field">
            <span>上限人数</span>
            <input
              min={0}
              name="selectionOptionLimit"
              onChange={(event) => updateRow(index, { ...row, limit: Number(event.target.value || 0) })}
              placeholder="0 で無制限"
              type="number"
              value={row.limit === 0 ? "" : row.limit}
            />
          </label>
          <button className="ghost-button small" onClick={() => removeRow(index)} type="button">
            削除
          </button>
        </div>
      ))}
      <button
        className="ghost-button"
        onClick={() => setRows((current) => [...current, { id: crypto.randomUUID(), label: "", limit: 0 }])}
        type="button"
      >
        選択肢を追加
      </button>
    </div>
  );
}
