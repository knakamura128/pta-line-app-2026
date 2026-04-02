"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LiffStatus = "idle" | "loading" | "ready" | "error" | "missing_config";

type LineProfile = {
  userId: string;
  displayName: string;
};

type Survey = {
  id: string;
  slug: string;
  title: string;
  committee: string;
  startsAt: string;
  endsAt: string;
  closeAt: string;
  capacity: number;
  currentApplications: number;
  status: string;
  description: string;
  hasApplied?: boolean;
};

type MyApplication = {
  survey: {
    slug: string;
  };
};

export default function Home() {
  const router = useRouter();
  const [isLineAuthed, setIsLineAuthed] = useState(false);
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [liffStatus, setLiffStatus] = useState<LiffStatus>("idle");
  const [liffError, setLiffError] = useState<string | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [myApplicationSlugs, setMyApplicationSlugs] = useState<string[]>([]);
  const [surveysLoading, setSurveysLoading] = useState(true);
  const [pendingSurveySlug, setPendingSurveySlug] = useState<string | null>(null);
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

  useEffect(() => {
    let mounted = true;

    async function initLiff() {
      if (!liffId) {
        if (!mounted) return;
        setLiffStatus("missing_config");
        setLiffError("NEXT_PUBLIC_LIFF_ID が未設定です。");
        return;
      }

      try {
        setLiffStatus("loading");
        const { default: liff } = await import("@line/liff");
        await liff.init({ liffId });

        if (!mounted) return;

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          if (!mounted) return;

          setIsLineAuthed(true);
          setLineProfile({
            userId: profile.userId,
            displayName: profile.displayName
          });
        }

        setLiffStatus("ready");
        setLiffError(null);
      } catch (error) {
        if (!mounted) return;
        setLiffStatus("error");
        setLiffError(error instanceof Error ? error.message : "LIFF初期化に失敗しました。");
      }
    }

    void initLiff();

    return () => {
      mounted = false;
    };
  }, [liffId]);

  useEffect(() => {
    let mounted = true;

    async function loadSurveys() {
      try {
        const response = await fetch("/api/surveys");
        if (!response.ok) {
          throw new Error("募集一覧の取得に失敗しました。");
        }

        const data = (await response.json()) as Survey[];
        if (!mounted) return;
        setSurveys(data);
      } catch (error) {
        if (!mounted) return;
        setLiffError(error instanceof Error ? error.message : "募集一覧の取得に失敗しました。");
      } finally {
        if (!mounted) return;
        setSurveysLoading(false);
      }
    }

    void loadSurveys();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!lineProfile) {
      return;
    }

    const lineUserId = lineProfile.userId;
    let mounted = true;

    async function loadMyApplications() {
      try {
        const response = await fetch(`/api/me/applications?lineUserId=${encodeURIComponent(lineUserId)}`);
        const data = (await response.json()) as MyApplication[] | { message: string };

        if (!response.ok) {
          throw new Error("message" in data ? data.message : "応募済み情報の取得に失敗しました。");
        }

        if (!mounted) return;
        setMyApplicationSlugs((data as MyApplication[]).map((item) => item.survey.slug));
      } catch (error) {
        if (!mounted) return;
        setLiffError(error instanceof Error ? error.message : "応募済み情報の取得に失敗しました。");
      }
    }

    void loadMyApplications();

    return () => {
      mounted = false;
    };
  }, [lineProfile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedSurveySlug = window.localStorage.getItem("pendingSurveySlug");
    if (!storedSurveySlug) {
      return;
    }

    setPendingSurveySlug(storedSurveySlug);
  }, []);

  useEffect(() => {
    if (!isLineAuthed || !pendingSurveySlug || !lineProfile) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("pendingSurveySlug");
    }
    router.push(`/surveys/${pendingSurveySlug}`);
  }, [isLineAuthed, lineProfile, pendingSurveySlug, router]);

  async function handleApply(surveySlug: string) {
    setPendingSurveySlug(surveySlug);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("pendingSurveySlug", surveySlug);
    }

    if (!liffId) {
      setLiffStatus("missing_config");
      setLiffError("NEXT_PUBLIC_LIFF_ID を設定してください。");
      return;
    }

    try {
      const { default: liff } = await import("@line/liff");

      if (!liff.isLoggedIn()) {
        if (!liff.isInClient()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        throw new Error("LINEアプリ内で未ログイン状態です。LIFF URL から開き直してください。");
      }

      const profile = await liff.getProfile();
      setIsLineAuthed(true);
      const nextProfile = {
        userId: profile.userId,
        displayName: profile.displayName
      };
      setLineProfile(nextProfile);
      setLiffError(null);
    } catch (error) {
      setLiffStatus("error");
      setLiffError(error instanceof Error ? error.message : "LINE認証に失敗しました。");
    }
  }
  return (
    <div className="landing-shell">
      <header className="landing-hero">
        <div className="hero-copy-wrap">
          <p className="eyebrow">PTA Volunteer Board</p>
          <h1>活動募集一覧</h1>
          <div className="hero-inline">
            <span className="status-pill">{isLineAuthed ? lineProfile?.displayName ?? "認証済み" : "未認証"}</span>
            <Link className="text-link" href="/me/applications">
              自分の回答一覧
            </Link>
            <Link className="text-link" href="/prototype">
              UIモックを見る
            </Link>
          </div>
        </div>
        <div className="summary-card">
          <span>次回締切</span>
          <strong>3月22日 18:00</strong>
        </div>
      </header>

      {liffError ? <div className="alert-box error-text">{liffError}</div> : null}

      <main className="survey-grid">
        <section className="survey-column">
          {surveysLoading ? <div className="detail-block">募集を読み込み中です。</div> : null}
          {surveys.map((survey) => (
            <article className="survey-card survey-open" key={survey.id}>
              <div className="survey-meta">
                <span>{survey.committee}</span>
                <span>{formatSchedule(survey.startsAt, survey.endsAt)}</span>
              </div>
              <h2>{survey.title}</h2>
              <p>{survey.description}</p>
              <div className="capacity-row">
                <span>
                  現在 {survey.currentApplications} / {survey.capacity} 名
                </span>
                <span className="tag active">{survey.status}</span>
              </div>
              <button className="primary-button wide" onClick={() => handleApply(survey.slug)} type="button">
                {myApplicationSlugs.includes(survey.slug) ? "応募済み / 編集する" : "応募する"}
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function formatSchedule(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  return `${start.getMonth() + 1}/${start.getDate()} ${pad(start.getHours())}:${pad(start.getMinutes())}-${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}
