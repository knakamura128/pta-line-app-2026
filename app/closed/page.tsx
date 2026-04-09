"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LinkifiedText } from "@/app/components/linkified-text";
import { formatDateTimeInTokyo, formatSurveyScheduleInTokyo } from "@/lib/datetime";

type Survey = {
  id: string;
  slug: string;
  title: string;
  committee: string;
  useDateRange?: boolean;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  startsAt: string;
  endsAt: string;
  closeAt: string;
  capacity: number;
  currentApplications: number;
  isClosed?: boolean;
  status: string;
  description: string;
};

type ErrorPayload = {
  message?: string;
};

export default function ClosedSurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSurveys() {
      try {
        const response = await fetch("/api/surveys?scope=closed");
        const data = (await readJson(response)) as Survey[] | ErrorPayload;
        if (!response.ok) {
          throw new Error("message" in data ? data.message || "締切済み一覧の取得に失敗しました。" : "締切済み一覧の取得に失敗しました。");
        }

        if (!mounted) return;
        setSurveys(data as Survey[]);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : "締切済み一覧の取得に失敗しました。");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    void loadSurveys();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="landing-shell">
      <header className="landing-hero">
        <div className="hero-copy-wrap">
          <p className="eyebrow">PTA Volunteer Board</p>
          <div className="title-with-logo">
            <Image alt="池本PTAロゴ" className="hero-title-logo" height={96} priority src="/pta-logo.png" width={96} />
            <h1>締切済み一覧</h1>
          </div>
          <div className="hero-inline">
            <Link className="text-link" href="/">
              活動募集一覧へ戻る
            </Link>
            <Link className="text-link" href="/me/applications">
              自分の回答一覧
            </Link>
          </div>
        </div>
        <div className="summary-card">
          <span>締切済みの募集</span>
          <strong>{loading ? "..." : `${surveys.length}件`}</strong>
          <p>{loading ? "募集一覧を確認中です。" : "締切済みの活動募集を確認できます。"}</p>
        </div>
      </header>

      {errorMessage ? <div className="alert-box error-text">{errorMessage}</div> : null}

      <main className="survey-grid">
        <section className="survey-column">
          {loading ? <div className="detail-block">締切済み募集を読み込み中です。</div> : null}
          {!loading && surveys.length === 0 ? <div className="detail-block">締切済みの募集はまだありません。</div> : null}
          {surveys.map((survey) => (
            <article className="survey-card survey-open" key={survey.id}>
              <div className="survey-meta">
                <span>{survey.committee}</span>
                <span>{`開催期間：${formatSurveyScheduleInTokyo(survey)}`}</span>
              </div>
              <h2>{survey.title}</h2>
              <p>
                <LinkifiedText text={survey.description} />
              </p>
              <div className="capacity-row">
                <span>
                  応募 {survey.currentApplications} / {survey.capacity} 名
                </span>
                <span className="tag closed">{survey.status}</span>
              </div>
              <div className="timeline-note">締切日時: {formatDateTimeInTokyo(survey.closeAt)}</div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: response.ok ? "レスポンスの解析に失敗しました。" : text
    };
  }
}
