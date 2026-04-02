"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDateTimeInTokyo, formatScheduleInTokyo } from "@/lib/datetime";

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
  workDetails: string;
  startsAt: string;
  endsAt: string;
  closeAt: string;
  capacity: number;
  currentApplications: number;
  status: string;
  selectionTitle: string | null;
  selectionType: "NONE" | "RADIO" | "CHECKBOX";
  selectionOptions: string[];
  selectionChoices: Array<{
    label: string;
    capacity: number;
    currentCount: number;
  }>;
  gradeSummary: Array<{
    grade: string;
    count: number;
  }>;
  existingApplication: {
    id: string;
    familyName: string;
    childGrade: string;
    childClass: string;
    selectionAnswers: string[];
    note: string | null;
  } | null;
};

export default function SurveyDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [childGrade, setChildGrade] = useState("");
  const [childClass, setChildClass] = useState("");
  const [selectionAnswers, setSelectionAnswers] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
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
        const query = lineProfile?.userId ? `?lineUserId=${encodeURIComponent(lineProfile.userId)}` : "";
        const response = await fetch(`/api/surveys/${params.slug}${query}`);
        const data = (await response.json()) as SurveyDetail | { message: string };

        if (!response.ok) {
          throw new Error("message" in data ? data.message : "募集の取得に失敗しました。");
        }

        if (!mounted) return;
        const nextSurvey = data as SurveyDetail;
        setSurvey(nextSurvey);
        setFamilyName(nextSurvey.existingApplication?.familyName ?? "");
        setChildGrade(nextSurvey.existingApplication?.childGrade ?? "");
        setChildClass(nextSurvey.existingApplication?.childClass ?? "");
        setSelectionAnswers(nextSurvey.existingApplication?.selectionAnswers ?? []);
        setNote(nextSurvey.existingApplication?.note ?? "");
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
  }, [params.slug, lineProfile]);

  async function reloadSurvey() {
    if (!lineProfile) {
      return;
    }

    const query = `?lineUserId=${encodeURIComponent(lineProfile.userId)}`;
    const response = await fetch(`/api/surveys/${params.slug}${query}`);
    const data = (await response.json()) as SurveyDetail | { message: string };

    if (!response.ok) {
      throw new Error("message" in data ? data.message : "募集の取得に失敗しました。");
    }

    const nextSurvey = data as SurveyDetail;
    setSurvey(nextSurvey);
    setFamilyName(nextSurvey.existingApplication?.familyName ?? "");
    setChildGrade(nextSurvey.existingApplication?.childGrade ?? "");
    setChildClass(nextSurvey.existingApplication?.childClass ?? "");
    setSelectionAnswers(nextSurvey.existingApplication?.selectionAnswers ?? []);
    setNote(nextSurvey.existingApplication?.note ?? "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!survey || !lineProfile) {
      setErrorMessage("LINE認証後にもう一度お試しください。");
      return;
    }

    if (!familyName || !childGrade || !childClass) {
      setErrorMessage("姓、お子さんの学年、組を入力してください。");
      return;
    }

    if (survey.selectionType !== "NONE" && selectionAnswers.length === 0) {
      setErrorMessage("選択項目を入力してください。");
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
          familyName,
          displayName: lineProfile.displayName,
          childGrade,
          childClass,
          selectionAnswers,
          note
        })
      });

      const data = (await response.json()) as { message: string; action: "created" | "updated" };

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage(data.message);
      setTimeout(() => {
        router.push(`/applications/done?mode=${data.action}`);
      }, 500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "応募登録に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!survey || !lineProfile || !survey.existingApplication) {
      return;
    }

    const confirmed = window.confirm("この応募を取り消しますか？");
    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);
      setMessage(null);
      setErrorMessage(null);

      const response = await fetch("/api/applications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          surveyId: survey.id,
          lineUserId: lineProfile.userId
        })
      });

      const data = (await response.json()) as { message: string };

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage(data.message);
      await reloadSurvey();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "応募の取り消しに失敗しました。");
    } finally {
      setCancelling(false);
    }
  }

  function toggleSelectionAnswer(value: string) {
    setSelectionAnswers((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
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
          <p>{survey ? `締切 ${formatDateTimeInTokyo(survey.closeAt)}` : "募集情報を取得しています。"}</p>
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
                <span>{formatScheduleInTokyo(survey.startsAt, survey.endsAt)}</span>
              </div>
              <h2>{survey.title}</h2>
              <p>{survey.description}</p>
              <div className="detail-stack">
                <div className="detail-block">
                  <p className="detail-title">開催日時</p>
                  <p>{formatScheduleInTokyo(survey.startsAt, survey.endsAt)}</p>
                </div>
                <div className="detail-block">
                  <p className="detail-title">締切日時</p>
                  <p>{formatDateTimeInTokyo(survey.closeAt)}</p>
                </div>
                <div className="detail-block">
                  <p className="detail-title">お仕事内容</p>
                  <p>{survey.workDetails}</p>
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
              <span>お子さんまたは保護者の姓</span>
              <input
                onChange={(event) => setFamilyName(event.target.value)}
                placeholder="例: 山田"
                type="text"
                value={familyName}
              />
            </label>
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
                <select onChange={(event) => setChildClass(event.target.value)} value={childClass}>
                  <option value="">選択してください</option>
                  <option value="1組">1組</option>
                  <option value="2組">2組</option>
                  <option value="3組">3組</option>
                  <option value="4組">4組</option>
                </select>
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
            {survey?.selectionType !== "NONE" && survey?.selectionTitle ? (
              <div className="field">
                <span>{survey.selectionTitle}</span>
                <div className="selection-group">
                  {survey.selectionChoices.map((option) => {
                    const remaining = option.capacity > 0 ? Math.max(option.capacity - option.currentCount, 0) : null;
                    const isSelected = selectionAnswers.includes(option.label);
                    const isFull = option.capacity > 0 && option.currentCount >= option.capacity;

                    return (
                    <label className="selection-item" key={option.label}>
                      <input
                        checked={isSelected}
                        disabled={isFull && !isSelected}
                        name="selectionAnswer"
                        onChange={(event) => {
                          if (survey.selectionType === "RADIO") {
                            setSelectionAnswers(event.target.checked ? [option.label] : []);
                            return;
                          }

                          toggleSelectionAnswer(option.label);
                        }}
                        type={survey.selectionType === "RADIO" ? "radio" : "checkbox"}
                        value={option.label}
                      />
                      <span>
                        {option.label}
                        <small>{isFull && !isSelected ? "満員" : remaining === null ? "上限なし" : `残り ${remaining} 名`}</small>
                      </span>
                    </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <button className="primary-button wide" disabled={submitting || cancelling || !survey || !lineProfile} type="submit">
              {submitting ? "保存中..." : survey?.existingApplication ? "応募済み / 編集する" : "この内容で応募する"}
            </button>
            {survey?.existingApplication ? (
              <button
                className="danger-button wide secondary-action"
                disabled={submitting || cancelling}
                onClick={handleCancel}
                type="button"
              >
                {cancelling ? "取り消し中..." : "応募を取り消す"}
              </button>
            ) : null}
          </form>
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
