"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LinkifiedText } from "@/app/components/linkified-text";
import { formatSurveyScheduleInTokyo } from "@/lib/datetime";

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
  status: string;
  description: string;
  hasApplied?: boolean;
};

type MyApplication = {
  survey: {
    slug: string;
  };
};

type ErrorPayload = {
  message?: string;
};

export default function Home() {
  const router = useRouter();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLineAuthed, setIsLineAuthed] = useState(false);
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [liffStatus, setLiffStatus] = useState<LiffStatus>("idle");
  const [liffError, setLiffError] = useState<string | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [myApplicationSlugs, setMyApplicationSlugs] = useState<string[]>([]);
  const [surveysLoading, setSurveysLoading] = useState(true);
  const [pendingSurveySlug, setPendingSurveySlug] = useState<string | null>(null);
  const [cancellingSurveySlug, setCancellingSurveySlug] = useState<string | null>(null);
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
        const data = (await readJson(response)) as Survey[] | ErrorPayload;
        if (!response.ok) {
          throw new Error("message" in data ? data.message || "募集一覧の取得に失敗しました。" : "募集一覧の取得に失敗しました。");
        }

        if (!mounted) return;
        setSurveys(data as Survey[]);
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
        const data = (await readJson(response)) as MyApplication[] | ErrorPayload;

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

  async function handleCancelApplication(surveyId: string, surveySlug: string) {
    if (!lineProfile) {
      setLiffError("LINE認証後に取り消してください。");
      return;
    }

    const confirmed = window.confirm("この応募を取り消しますか？");
    if (!confirmed) {
      return;
    }

    try {
      setCancellingSurveySlug(surveySlug);
      setLiffError(null);

      const response = await fetch("/api/applications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          surveyId,
          lineUserId: lineProfile.userId
        })
      });

      const data = (await readJson(response)) as ErrorPayload;
      if (!response.ok) {
        throw new Error(data.message);
      }

      setMyApplicationSlugs((current) => current.filter((slug) => slug !== surveySlug));
      setSurveys((current) =>
        current.map((survey) =>
          survey.slug === surveySlug
            ? { ...survey, currentApplications: Math.max(survey.currentApplications - 1, 0) }
            : survey
        )
      );
    } catch (error) {
      setLiffError(error instanceof Error ? error.message : "応募の取り消しに失敗しました。");
    } finally {
      setCancellingSurveySlug(null);
    }
  }
  return (
    <div className="landing-shell">
      <header className="landing-hero">
        <div className="hero-copy-wrap">
          <p className="eyebrow">PTA Volunteer Board</p>
          <div className="title-with-logo">
            <Image alt="池本PTAロゴ" className="hero-title-logo" height={96} priority src="/pta-logo.png" width={96} />
            <h1>活動募集一覧</h1>
          </div>
          <div className="hero-inline">
            <span className="status-pill">{isLineAuthed ? lineProfile?.displayName ?? "認証済み" : "未認証"}</span>
            <Link className="text-link" href="/me/applications">
              自分の回答一覧
            </Link>
            <button className="ghost-button small" onClick={() => setIsGuideOpen(true)} type="button">
              使い方ガイド
            </button>
          </div>
        </div>
        <div className="summary-card">
          <span>公開中の募集</span>
          <strong>{surveysLoading ? "..." : `${surveys.length}件`}</strong>
          <p>{surveysLoading ? "募集一覧を確認中です。" : "現在応募できる活動募集の件数です。"}</p>
        </div>
      </header>

      {liffError ? <div className="alert-box error-text">{liffError}</div> : null}
      <div className="alert-box">
        <strong>確定通知を受け取るには、PTA公式LINEの友だち登録が必要です。</strong>
        <p>
          応募後の確定通知は公式LINEに届きます。まだ登録していない場合は、
          {" "}
          <Link className="auto-link" href="https://lin.ee/pbMkq2f" rel="noreferrer" target="_blank">
            PTA公式LINEを友だち追加
          </Link>
          {" "}
          してください。
        </p>
      </div>

      <main className="survey-grid">
        <section className="survey-column">
          {surveysLoading ? <div className="detail-block">募集を読み込み中です。</div> : null}
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
                  現在 {survey.currentApplications} / {survey.capacity} 名
                </span>
                <span className="tag active">{survey.status}</span>
              </div>
              <button className="primary-button wide" onClick={() => handleApply(survey.slug)} type="button">
                {myApplicationSlugs.includes(survey.slug) ? "応募済み / 編集する" : "応募する"}
              </button>
              {myApplicationSlugs.includes(survey.slug) ? (
                <button
                  className="danger-button wide secondary-action"
                  disabled={cancellingSurveySlug === survey.slug}
                  onClick={() => handleCancelApplication(survey.id, survey.slug)}
                  type="button"
                >
                  {cancellingSurveySlug === survey.slug ? "取り消し中..." : "応募を取り消す"}
                </button>
              ) : null}
            </article>
          ))}
        </section>
      </main>

      {isGuideOpen ? (
        <div className="guide-modal-backdrop" onClick={() => setIsGuideOpen(false)} role="presentation">
          <div
            aria-label="活動募集一覧の使い方ガイド"
            className="guide-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="guide-panel-head">
              <div>
                <p className="top-label">Guide</p>
                <h3>使い方ガイド</h3>
              </div>
              <button className="ghost-button small" onClick={() => setIsGuideOpen(false)} type="button">
                閉じる
              </button>
            </div>
            <div className="guide-chip-grid">
              <article className="guide-chip">
                <span className="guide-step">1</span>
                <strong>募集を選ぶ</strong>
                <p>一覧から参加したい活動を確認します。</p>
              </article>
              <article className="guide-chip">
                <span className="guide-step">2</span>
                <strong>応募する</strong>
                <p>応募時にLINE認証を行い、必要事項を入力します。</p>
              </article>
              <article className="guide-chip">
                <span className="guide-step">3</span>
                <strong>内容を確認する</strong>
                <p>自分の回答一覧から応募内容の確認や編集ができます。</p>
              </article>
              <article className="guide-chip">
                <span className="guide-step">4</span>
                <strong>必要なら取り消す</strong>
                <p>締切前であれば応募済みの活動を取り消せます。</p>
              </article>
            </div>
            <div className="hero-inline">
              <Link className="text-link" href="/guide?mode=public#public">
                詳しいガイドページを見る
              </Link>
            </div>
          </div>
        </div>
      ) : null}
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
