"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LiffStatus = "idle" | "loading" | "ready" | "error" | "missing_config";

type LineProfile = {
  userId: string;
  displayName: string;
};

type SurveyDetail = {
  id: string;
  slug: string;
  title: string;
  committee: string;
  description: string;
  startsAt: string;
  endsAt: string;
  closeAt: string;
  capacity: number;
  currentApplications: number;
  status: string;
  gradeSummary: Array<{
    grade: string;
    count: number;
  }>;
};

export default function SurveyDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [childGrade, setChildGrade] = useState("");
  const [childClass, setChildClass] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
    let mounted = true;

    async function loadSurvey() {
      try {
        setLoading(true);
        const response = await fetch(`/api/surveys/${params.slug}`);
        const data = (await response.json()) as SurveyDetail | { message: string };

        if (!response.ok) {
          throw new Error("message" in data ? data.message : "募集の取得に失敗しました。");
        }

        if (!mounted) return;
        setSurvey(data as SurveyDetail);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : "募集の取得に失敗しました。");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    void loadSurvey();

    return () => {
      mounted = false;
    };
  }, [params.slug]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!survey || !lineProfile) {
      setErrorMessage("LINE認証後にもう一度お試しください。");
      return;
    }

    if (!childGrade || !childClass) {
      setErrorMessage("お子さんの学年と組を入力してください。");
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      setErrorMessage(null);

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          surveyId: survey.id,
          lineUserId: lineProfile.userId,
          displayName: lineProfile.displayName,
          childGrade,
          childClass,
          note
        })
      });

      const data = (await response.json()) as { message: string };

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage(data.message);
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "応募登録に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="landing-shell">
      <header className="landing-hero">
        <div className="hero-copy-wrap">
          <p className="eyebrow">Apply Detail</p>
          <h1>{survey?.title ?? "募集詳細"}</h1>
          <p className="hero-copy">応募前に内容を確認し、必要なメモを添えて登録します。</p>
          <div className="hero-inline">
            <span className="status-pill">
              {lineProfile ? `${lineProfile.displayName} で認証済み` : renderLiffStatus(liffStatus)}
            </span>
            <Link className="text-link" href="/">
              募集一覧へ戻る
            </Link>
          </div>
        </div>
        <div className="summary-card">
          <span>応募状況</span>
          <strong>
            {survey ? `${survey.currentApplications} / ${survey.capacity} 名` : "読込中"}
          </strong>
          <p>{survey ? `締切 ${formatDateTime(survey.closeAt)}` : "募集情報を取得しています。"}</p>
        </div>
      </header>

      {message ? <div className="alert-box success-text">{message}</div> : null}
      {errorMessage ? <div className="alert-box error-text">{errorMessage}</div> : null}

      <main className="survey-grid">
        <section className="survey-column">
          {loading || !survey ? (
            <div className="detail-block">募集を読み込み中です。</div>
          ) : (
            <article className="survey-card survey-open">
              <div className="survey-meta">
                <span>{survey.committee}</span>
                <span>{formatSchedule(survey.startsAt, survey.endsAt)}</span>
              </div>
              <h2>{survey.title}</h2>
              <p>{survey.description}</p>
              <div className="detail-stack">
                <div className="detail-block">
                  <p className="detail-title">開催日時</p>
                  <p>{formatSchedule(survey.startsAt, survey.endsAt)}</p>
                </div>
                <div className="detail-block">
                  <p className="detail-title">締切日時</p>
                  <p>{formatDateTime(survey.closeAt)}</p>
                </div>
                <div className="detail-block">
                  <p className="detail-title">学年別集計</p>
                  <p>
                    {survey.gradeSummary.length > 0
                      ? survey.gradeSummary.map((row) => `${row.grade}年: ${row.count}人`).join(" / ")
                      : "まだ応募はありません"}
                  </p>
                </div>
              </div>
            </article>
          )}
        </section>

        <aside className="apply-panel">
          <div className="panel-head">
            <p className="panel-kicker">Application Form</p>
            <h2>応募フォーム</h2>
          </div>
          <form className="form-layout" onSubmit={handleSubmit}>
            <label className="field">
              <span>お名前</span>
              <input readOnly type="text" value={lineProfile?.displayName ?? "LINE認証を確認中"} />
            </label>
            <div className="double-fields">
              <label className="field">
                <span>お子さんの学年</span>
                <select onChange={(event) => setChildGrade(event.target.value)} value={childGrade}>
                  <option value="">選択してください</option>
                  <option value="1">1年</option>
                  <option value="2">2年</option>
                  <option value="3">3年</option>
                  <option value="4">4年</option>
                  <option value="5">5年</option>
                  <option value="6">6年</option>
                </select>
              </label>
              <label className="field">
                <span>お子さんの組</span>
                <input
                  onChange={(event) => setChildClass(event.target.value)}
                  placeholder="例: 2組"
                  type="text"
                  value={childClass}
                />
              </label>
            </div>
            <label className="field">
              <span>連絡メモ</span>
              <textarea
                onChange={(event) => setNote(event.target.value)}
                placeholder="当日の連絡事項があれば入力してください"
                rows={5}
                value={note}
              />
            </label>
            <button className="primary-button wide" disabled={submitting || !survey || !lineProfile} type="submit">
              {submitting ? "応募登録中..." : "この内容で応募する"}
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
}

function formatSchedule(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  return `${start.getMonth() + 1}/${start.getDate()} ${pad(start.getHours())}:${pad(start.getMinutes())}-${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
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
