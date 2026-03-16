import { SelectionInputType } from "@prisma/client";

export function parseSelectionOptions(rawValue: string) {
  return rawValue
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function normalizeSelectionConfig(
  title: string,
  type: SelectionInputType,
  rawOptions: string
) {
  if (type === SelectionInputType.NONE) {
    return {
      selectionTitle: null,
      selectionType: SelectionInputType.NONE,
      selectionOptions: [] as string[]
    };
  }

  const options = parseSelectionOptions(rawOptions);

  if (!title.trim()) {
    throw new Error("選択項目タイトルを入力してください。");
  }

  if (options.length === 0) {
    throw new Error("選択肢を1つ以上入力してください。");
  }

  return {
    selectionTitle: title.trim(),
    selectionType: type,
    selectionOptions: options
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
