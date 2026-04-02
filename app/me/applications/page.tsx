"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDateTimeInTokyo, formatScheduleInTokyo } from "@/lib/datetime";

type LiffStatus = "idle" | "loading" | "ready" | "error" | "missing_config";

type LineProfile = {
  userId: string;
  displayName: string;
};

type MyApplication = {
  id: string;
  childGrade: string;
  childClass: string;
  note: string | null;
  survey: {
    slug: string;
    title: string;
    committee: string;
    startsAt: string;
    endsAt: string;
    closeAt: string;
  };
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [liffStatus, setLiffStatus] = useState<LiffStatus>("idle");
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

  useEffect(() => {
    let mounted = true;

    async function initLiff() {
      if (!liffId) {
        if (!mounted) return;
        setLiffStatus("missing_config");
        setErrorMessage("NEXT_PUBLIC_LIFF_ID が未設定です。");
        return;
      }

      try {
        setLiffStatus("loading");
        const { default: liff } = await import("@line/liff");
        await liff.init({ liffId });

        if (!mounted) return;

        if (!liff.isLoggedIn()) {
          if (!liff.isInClient()) {
            liff.login({ redirectUri: window.location.href });
            return;
          }

          throw new Error("LINEアプリ内で未ログイン状態です。LIFF URL から開き直してください。");
        }

        const profile = await liff.getProfile();
        if (!mounted) return;
        setLineProfile({
          userId: profile.userId,
          displayName: profile.displayName
        });
        setLiffStatus("ready");
      } catch (error) {
        if (!mounted) return;
        setLiffStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "LINE認証に失敗しました。");
      }
    }

    void initLiff();

    return () => {
      mounted = false;
    };
  }, [liffId]);

  useEffect(() => {
    if (!lineProfile) {
      return;
    }

    const lineUserId = lineProfile.userId;
    let mounted = true;

    async function loadApplications() {
      try {
        const response = await fetch(`/api/me/applications?lineUserId=${encodeURIComponent(lineUserId)}`);
        const data = (await response.json()) as MyApplication[] | { message: string };

        if (!response.ok) {
          throw new Error("message" in data ? data.message : "応募一覧の取得に失敗しました。");
        }

        if (!mounted) return;
        setApplications(data as MyApplication[]);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : "応募一覧の取得に失敗しました。");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    void loadApplications();

    return () => {
      mounted = false;
    };
  }, [lineProfile]);

  return (
    <div className="landing-shell">
      <header className="landing-hero">
        <div className="hero-copy-wrap">
          <p className="eyebrow">My Applications</p>
          <h1>自分の回答一覧</h1>
          <p className="hero-copy">応募済みの募集を確認し、必要に応じて詳細から内容を編集できます。</p>
          <div className="hero-inline">
            <span className="status-pill">
              {lineProfile ? `${lineProfile.displayName} で認証済み` : renderLiffStatus(liffStatus)}
            </span>
            <Link className="text-link" href="/">
              募集一覧へ戻る
            </Link>
          </div>
        </div>
      </header>

      {errorMessage ? <div className="alert-box error-text">{errorMessage}</div> : null}

      <main className="survey-grid">
        <section className="survey-column">
          {loading ? <div className="detail-block">回答一覧を読み込み中です。</div> : null}
          {!loading && applications.length === 0 ? <div className="detail-block">まだ応募はありません。</div> : null}
          {applications.map((application) => (
            <article className="survey-card survey-open" key={application.id}>
              <div className="survey-meta">
                <span>{application.survey.committee}</span>
                <span>{formatScheduleInTokyo(application.survey.startsAt, application.survey.endsAt)}</span>
              </div>
              <h2>{application.survey.title}</h2>
              <p>
                {application.childGrade}年 {application.childClass}
              </p>
              <div className="capacity-row">
                <span>締切 {formatDateTimeInTokyo(application.survey.closeAt)}</span>
                <Link className="primary-button text-button" href={`/surveys/${application.survey.slug}`}>
                  応募済み / 編集する
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function renderLiffStatus(status: LiffStatus) {
  switch (status) {
    case "idle":
      return "未初期化";
    case "loading":
      return "初期化中";
    case "ready":
      return "利用可能";
    case "error":
      return "エラー";
    case "missing_config":
      return "設定不足";
    default:
      return "不明";
  }
}
