import { SelectionInputType } from "@prisma/client";

export function normalizeSelectionConfig(
  title: string,
  type: SelectionInputType,
  labels: string[],
  limits: string[]
) {
  if (type === SelectionInputType.NONE) {
    return {
      selectionTitle: null,
      selectionType: SelectionInputType.NONE,
      selectionOptions: [] as string[],
      selectionOptionLimits: [] as number[]
    };
  }

  const selectionRows = labels
    .map((label, index) => ({
      label: label.trim(),
      limit: (limits[index] ?? "").trim()
    }))
    .filter((row) => row.label);

  if (!title.trim()) {
    throw new Error("選択項目タイトルを入力してください。");
  }

  if (selectionRows.length === 0) {
    throw new Error("選択肢を1つ以上入力してください。");
  }

  const selectionOptionLimits = selectionRows.map((row) => {
    if (!row.limit) {
      return 0;
    }

    const parsed = Number(row.limit);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error("選択肢ごとの上限人数は0以上の整数で入力してください。");
    }

    return parsed;
  });

  return {
    selectionTitle: title.trim(),
    selectionType: type,
    selectionOptions: selectionRows.map((row) => row.label),
    selectionOptionLimits
  };
}

export function normalizeSelectionAnswers(
  answers: string[] | undefined,
  type: SelectionInputType,
  options: string[]
) {
  if (type === SelectionInputType.NONE) {
    return [];
  }

  const normalized = (answers ?? []).filter((value) => options.includes(value));

  if (type === SelectionInputType.RADIO && normalized.length > 1) {
    return [normalized[0]];
  }

  return normalized;
}
