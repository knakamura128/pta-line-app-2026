export function isSurveyClosed(closeAt: Date | string) {
  return new Date(closeAt).getTime() <= Date.now();
}

export function getSurveyStatusLabel({
  closeAt,
  currentApplications,
  capacity
}: {
  closeAt: Date | string;
  currentApplications: number;
  capacity: number;
}) {
  if (isSurveyClosed(closeAt)) {
    return "締切";
  }

  if (currentApplications >= capacity) {
    return "満員";
  }

  return "募集中";
}
