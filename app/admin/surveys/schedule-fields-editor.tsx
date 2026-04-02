"use client";

import { useState } from "react";

type ScheduleFieldsEditorProps = {
  initialUseDateRange: boolean;
  initialStartDate: string;
  initialEndDate: string;
  initialStartTime: string;
  initialEndTime: string;
};

export function ScheduleFieldsEditor({
  initialUseDateRange,
  initialStartDate,
  initialEndDate,
  initialStartTime,
  initialEndTime
}: ScheduleFieldsEditorProps) {
  const [useDateRange, setUseDateRange] = useState(initialUseDateRange);
  const [singleDate, setSingleDate] = useState(initialStartDate);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);

  return (
    <div className="schedule-editor">
      <div className="field">
        <span>開催期間入力</span>
        <div className="inline-choice-group">
          <button
            className={useDateRange ? "ghost-button small" : "primary-button small"}
            onClick={() => {
              setUseDateRange(false);
              setSingleDate(startDate);
            }}
            type="button"
          >
            OFF
          </button>
          <button
            className={useDateRange ? "primary-button small" : "ghost-button small"}
            onClick={() => {
              setUseDateRange(true);
              setStartDate(singleDate);
              setEndDate(singleDate);
            }}
            type="button"
          >
            ON
          </button>
        </div>
      </div>

      <input name="useDateRange" type="hidden" value={useDateRange ? "true" : "false"} />
      <input name="startDate" type="hidden" value={useDateRange ? startDate : singleDate} />
      <input name="endDate" type="hidden" value={useDateRange ? endDate : singleDate} />
      <input name="startTime" type="hidden" value={startTime} />
      <input name="endTime" type="hidden" value={endTime} />

      {useDateRange ? (
        <div className="triple-fields">
          <label className="field">
            <span>開始日</span>
            <input
              onChange={(event) => setStartDate(event.target.value)}
              type="date"
              value={startDate}
            />
          </label>
          <label className="field">
            <span>終了日</span>
            <input
              onChange={(event) => setEndDate(event.target.value)}
              type="date"
              value={endDate}
            />
          </label>
          <div className="field schedule-time-range">
            <span>開始時間〜終了時間</span>
            <div className="double-fields">
              <input
                onChange={(event) => setStartTime(event.target.value)}
                type="time"
                value={startTime}
              />
              <input
                onChange={(event) => setEndTime(event.target.value)}
                type="time"
                value={endTime}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="triple-fields">
          <label className="field">
            <span>開催日</span>
            <input
              onChange={(event) => {
                setSingleDate(event.target.value);
                setStartDate(event.target.value);
                setEndDate(event.target.value);
              }}
              type="date"
              value={singleDate}
            />
          </label>
          <label className="field">
            <span>開始時間</span>
            <input
              onChange={(event) => setStartTime(event.target.value)}
              type="time"
              value={startTime}
            />
          </label>
          <label className="field">
            <span>終了時間</span>
            <input
              onChange={(event) => setEndTime(event.target.value)}
              type="time"
              value={endTime}
            />
          </label>
        </div>
      )}
    </div>
  );
}
