"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LiffStatus = "idle" | "loading" | "ready" | "error" | "missing_config";

type LineProfile = {
  userId: string;
  displayName: string;
};

type SurveyId = "traffic" | "library";

type Survey = {
  id: SurveyId;
  title: string;
  group: string;
  schedule: string;
  capacity: string;
  status: string;
  description: string;
};

const surveys: Survey[] = [
  {
    id: "traffic",
    title: "交通安全見守りスタッフ",
    group: "校外委員会",
    schedule: "3/25 09:00-11:00",
    capacity: "6 / 8 名",
    status: "募集中",
    description: "登校時間帯の横断歩道サポート。短時間参加可。"
  },
  {
    id: "library",
    title: "図書室整理サポート",
    group: "図書委員会",
    schedule: "3/29 13:00-15:00",
    capacity: "2 / 5 名",
    status: "募集中",
    description: "本の仕分けや掲示物の張り替えを行う軽作業です。"
  }
];

export default function Home() {
  const [isLineAuthed, setIsLineAuthed] = useState(false);
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [liffStatus, setLiffStatus] = useState<LiffStatus>("idle");
  const [liffError, setLiffError] = useState<string | null>(null);
  const [pendingSurveyId, setPendingSurveyId] = useState<SurveyId | null>(null);
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

  async function handleApply(surveyId: SurveyId) {
    setPendingSurveyId(surveyId);

    if (!liffId) {
      setLiffStatus("missing_config");
      setLiffError("NEXT_PUBLIC_LIFF_ID を設定してください。");
      return;
    }

    try {
      const { default: liff } = await import("@line/liff");

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      const profile = await liff.getProfile();
      setIsLineAuthed(true);
      setLineProfile({
        userId: profile.userId,
        displayName: profile.displayName
      });
      setLiffError(null);
    } catch (error) {
      setLiffStatus("error");
      setLiffError(error instanceof Error ? error.message : "LINE認証に失敗しました。");
    }
  }

  const selectedSurvey = surveys.find((survey) => survey.id === pendingSurveyId);

  return (
    <div className="landing-shell">
      <header className="landing-hero">
        <div className="hero-copy-wrap">
          <p className="eyebrow">PTA Volunteer Board</p>
          <h1>活動募集一覧</h1>
          <p className="hero-copy">
            PTA活動の募集をLINEミニアプリから確認できます。応募時にのみLINE認証を行います。
          </p>
          <div className="hero-inline">
            <span className="status-pill">{isLineAuthed ? lineProfile?.displayName ?? "認証済み" : "未認証"}</span>
            <Link className="text-link" href="/prototype">
              UIモックを見る
            </Link>
          </div>
        </div>
        <div className="summary-card">
          <span>次回締切</span>
          <strong>3月22日 18:00</strong>
          <p>応募ボタン押下時にLINE認証し、その後に応募内容入力へ進む想定です。</p>
        </div>
      </header>

      {liffError ? <div className="alert-box error-text">{liffError}</div> : null}

      <main className="survey-grid">
        <section className="survey-column">
          {surveys.map((survey) => (
            <article className="survey-card survey-open" key={survey.id}>
              <div className="survey-meta">
                <span>{survey.group}</span>
                <span>{survey.schedule}</span>
              </div>
              <h2>{survey.title}</h2>
              <p>{survey.description}</p>
              <div className="capacity-row">
                <span>{survey.capacity}</span>
                <span className="tag active">{survey.status}</span>
              </div>
              <button className="primary-button wide" onClick={() => handleApply(survey.id)} type="button">
                応募する
              </button>
            </article>
          ))}
        </section>

        <aside className="apply-panel">
          <div className="panel-head">
            <p className="panel-kicker">Apply</p>
            <h2>応募導線</h2>
          </div>
          <div className="detail-stack">
            <div className="detail-block">
              <p className="detail-title">LIFF状態</p>
              <p>{renderLiffStatus(liffStatus)}</p>
            </div>
            <div className="detail-block">
              <p className="detail-title">認証状態</p>
              <p>{isLineAuthed ? `${lineProfile?.displayName ?? "ユーザー"} としてログイン済み` : "未認証"}</p>
            </div>
            <div className="detail-block emphasis">
              <span>現在の応募対象</span>
              <strong>{selectedSurvey?.title ?? "まだ選択されていません"}</strong>
            </div>
            <div className="detail-block">
              <p className="detail-title">次の実装</p>
              <p>認証後は募集詳細ページまたは応募フォームへ遷移し、回答登録 API に接続します。</p>
            </div>
          </div>
        </aside>
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
