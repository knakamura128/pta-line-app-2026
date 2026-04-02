const TOKYO_TIME_ZONE = "Asia/Tokyo";

export function formatDateTimeInTokyo(value: Date | string) {
  const parts = getParts(value);
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatShortDateTimeInTokyo(value: Date | string) {
  const parts = getParts(value);
  return `${Number(parts.month)}/${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatScheduleInTokyo(startsAt: Date | string, endsAt: Date | string) {
  const start = getParts(startsAt);
  const end = getParts(endsAt);
  return `${Number(start.month)}/${Number(start.day)} ${start.hour}:${start.minute}-${end.hour}:${end.minute}`;
}

export function formatDateInputInTokyo(value: Date | string) {
  const parts = getParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatTimeInputInTokyo(value: Date | string) {
  const parts = getParts(value);
  return `${parts.hour}:${parts.minute}`;
}

export function formatDateTimeLocalInputInTokyo(value: Date | string) {
  return `${formatDateInputInTokyo(value)}T${formatTimeInputInTokyo(value)}`;
}

function getParts(value: Date | string) {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const formattedParts = formatter.formatToParts(new Date(value));

  return {
    year: readPart(formattedParts, "year"),
    month: readPart(formattedParts, "month"),
    day: readPart(formattedParts, "day"),
    hour: readPart(formattedParts, "hour"),
    minute: readPart(formattedParts, "minute")
  };
}

function readPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? "";
}
