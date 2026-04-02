const TOKYO_TIME_ZONE = "Asia/Tokyo";

type SurveyScheduleLike = {
  useDateRange?: boolean | null;
  eventStartDate?: Date | string | null;
  eventEndDate?: Date | string | null;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
};

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

export function formatSurveyScheduleInTokyo(schedule: SurveyScheduleLike) {
  if (schedule.eventStartDate && schedule.eventEndDate && schedule.eventStartTime && schedule.eventEndTime) {
    const startDate = getDateParts(schedule.eventStartDate);
    const endDate = getDateParts(schedule.eventEndDate);
    const hasMultipleDates = `${startDate.year}-${startDate.month}-${startDate.day}` !== `${endDate.year}-${endDate.month}-${endDate.day}`;
    const dateLabel =
      hasMultipleDates
        ? `${Number(startDate.month)}/${Number(startDate.day)}-${Number(endDate.month)}/${Number(endDate.day)}`
        : `${Number(startDate.month)}/${Number(startDate.day)}`;

    return `${dateLabel} ${schedule.eventStartTime}-${schedule.eventEndTime}`;
  }

  if (schedule.startsAt && schedule.endsAt) {
    return formatScheduleInTokyo(schedule.startsAt, schedule.endsAt);
  }

  return "";
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

function getDateParts(value: Date | string) {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const formattedParts = formatter.formatToParts(new Date(value));

  return {
    year: readPart(formattedParts, "year"),
    month: readPart(formattedParts, "month"),
    day: readPart(formattedParts, "day")
  };
}

function readPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? "";
}
