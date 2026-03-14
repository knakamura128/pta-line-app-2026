"use client";

import { useEffect, useState } from "react";

type Mode = "member" | "admin";

type MemberScreen =
  | "member-auth"
  | "member-list"
  | "member-detail"
  | "member-detail-new"
  | "member-done"
  | "member-mypage";

type AdminScreen =
  | "admin-dashboard"
  | "admin-list"
  | "admin-edit"
  | "admin-answers";

type Screen = MemberScreen | AdminScreen;

type LiffStatus = "idle" | "loading" | "ready" | "error" | "missing_config";

type LineProfile = {
  userId: string;
  displayName: string;
};

const memberNav: { id: MemberScreen; title: string; subtitle: string }[] = [
  { id: "member-list", title: "募集一覧", subtitle: "公開中の募集を確認" },
  { id: "member-detail", title: "募集詳細", subtitle: "回答や取り消しを実行" },
  { id: "member-done", title: "回答完了", subtitle: "受付完了の案内" },
  { id: "member-mypage", title: "自分の回答一覧", subtitle: "確定前/確定済みを確認" }
];

const adminNav: { id: AdminScreen; title: string; subtitle: string }[] = [
  { id: "admin-dashboard", title: "ダッシュボード", subtitle: "全体状況を確認" },
  { id: "admin-list", title: "募集一覧", subtitle: "募集を一覧管理" },
  { id: "admin-edit", title: "募集作成/編集", subtitle: "本文や締切を設定" },
  { id: "admin-answers", title: "回答一覧", subtitle: "回答者と確定対象を確認" }
];

const isMemberScreen = (screen: Screen): screen is MemberScreen => screen.startsWith("member-");

export default function Home() {
  const [mode, setMode] = useState<Mode>("member");
  const [screen, setScreen] = useState<Screen>("member-list");
  const [isLineAuthed, setIsLineAuthed] = useState(false);
  const [authReturnScreen, setAuthReturnScreen] = useState<MemberScreen>("member-list");
  const [liffStatus, setLiffStatus] = useState<LiffStatus>("idle");
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
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
        await liff.init({
          liffId,
          withLoginOnExternalBrowser: true
        });

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

  function go(nextScreen: Screen) {
    setMode(isMemberScreen(nextScreen) ? "member" : "admin");
    setScreen(nextScreen);
  }

  function goMemberFlow(nextScreen: MemberScreen) {
    if (isLineAuthed) {
      go(nextScreen);
      return;
    }

    setAuthReturnScreen(nextScreen);
    go("member-auth");
  }

  async function completeLineAuth() {
    if (!liffId) {
      setLiffStatus("missing_config");
      setLiffError("NEXT_PUBLIC_LIFF_ID を設定してください。");
      return;
    }

    try {
      setLiffStatus("loading");
      const { default: liff } = await import("@line/liff");

      if (!liff.isLoggedIn()) {
        if (liff.isInClient()) {
          setLiffError("LINEアプリ内では liff.init() 時に自動ログインされます。LINEから開き直してください。");
          setLiffStatus("error");
          return;
        }

        liff.login({ redirectUri: window.location.href });
        return;
      }

      const profile = await liff.getProfile();
      setIsLineAuthed(true);
      setLineProfile({
        userId: profile.userId,
        displayName: profile.displayName
      });
      setLiffStatus("ready");
      setLiffError(null);
      go(authReturnScreen);
    } catch (error) {
      setLiffStatus("error");
      setLiffError(error instanceof Error ? error.message : "LINE認証に失敗しました。");
    }
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">PTA Volunteer Flow</p>
          <h1>LINEミニアプリと管理画面のUIプロトタイプ</h1>
          <p className="hero-copy">
            回答者向けのLIFF体験と、管理者向けの募集管理体験を1画面で確認できる実装版です。
          </p>
        </div>
        <div className="hero-actions">
          <button
            className={`mode-chip ${mode === "member" ? "is-active" : ""}`}
            onClick={() => go("member-list")}
            type="button"
          >
            回答者UI
          </button>
          <button
            className={`mode-chip ${mode === "admin" ? "is-active" : ""}`}
            onClick={() => go("admin-dashboard")}
            type="button"
          >
            管理者UI
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="panel panel-nav">
          <div className="panel-head">
            <p className="panel-kicker">Navigator</p>
            <h2>画面一覧</h2>
          </div>

          <div className={`screen-list ${mode === "member" ? "is-active" : ""}`}>
            {memberNav.map((item) => (
              <button
                key={item.id}
                className={`screen-link ${screen === item.id ? "is-active" : ""}`}
                onClick={() => go(item.id)}
                type="button"
              >
                <span>{item.title}</span>
                <small>{item.subtitle}</small>
              </button>
            ))}
          </div>

          <div className={`screen-list ${mode === "admin" ? "is-active" : ""}`}>
            {adminNav.map((item) => (
              <button
                key={item.id}
                className={`screen-link ${screen === item.id ? "is-active" : ""}`}
                onClick={() => go(item.id)}
                type="button"
              >
                <span>{item.title}</span>
                <small>{item.subtitle}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel panel-preview">
          <div className="panel-head">
            <p className="panel-kicker">Preview</p>
            <h2>画面イメージ</h2>
          </div>

          <div className={`device-stage ${mode === "member" ? "is-active" : ""}`}>
            <div className="phone-frame">
              <div className="phone-notch" />

              <section className={`screen ${screen === "member-list" ? "is-active" : ""}`}>
                <div className="mobile-topbar">
                  <div>
                    <p className="top-label">PTA募集</p>
                    <h3>活動募集一覧</h3>
                  </div>
                  <span className="status-pill">
                    {isLineAuthed ? lineProfile?.displayName ?? "認証済み" : "LIFF"}
                  </span>
                </div>
                <div className="mobile-highlight">
                  <p>次回の締切</p>
                  <strong>3月22日 18:00</strong>
                  <span>回答済みの方も締切までは編集と取り消しが可能です。</span>
                </div>
                {!isLineAuthed ? (
                  <div className="inline-notice">
                    <strong>回答時にLINE認証を行います</strong>
                    <span>本人識別には LIFF のプロフィール情報を使います。</span>
                  </div>
                ) : null}
                <div className="survey-card survey-open">
                  <div className="survey-meta">
                    <span>校外委員会</span>
                    <span>3/25 09:00-11:00</span>
                  </div>
                  <h4>交通安全見守りスタッフ</h4>
                  <p>登校時間帯の横断歩道サポート。短時間参加可。</p>
                  <div className="capacity-row">
                    <span>現在 6 / 8 名</span>
                    <button className="action-mini" onClick={() => goMemberFlow("member-detail")} type="button">
                      回答する
                    </button>
                  </div>
                </div>
                <div className="survey-card survey-fresh">
                  <div className="survey-meta">
                    <span>図書委員会</span>
                    <span>3/29 13:00-15:00</span>
                  </div>
                  <h4>図書室整理サポート</h4>
                  <p>本の仕分けや掲示物の張り替えを行う軽作業です。</p>
                  <div className="capacity-row">
                    <span>現在 2 / 5 名</span>
                    <button className="action-mini" onClick={() => goMemberFlow("member-detail-new")} type="button">
                      回答する
                    </button>
                  </div>
                </div>
                <div className="survey-card survey-filled">
                  <div className="survey-meta">
                    <span>運動会</span>
                    <span>4/03 07:30-12:30</span>
                  </div>
                  <h4>会場設営サポート</h4>
                  <p>定員に達しています。取り消しが出ると再度回答可能になります。</p>
                  <div className="capacity-row">
                    <span>現在 12 / 12 名</span>
                    <button className="action-mini is-disabled" type="button">
                      満員
                    </button>
                  </div>
                </div>
                <nav className="bottom-nav">
                  <button className="nav-link is-active" onClick={() => go("member-list")} type="button">
                    募集
                  </button>
                  <button className="nav-link" onClick={() => goMemberFlow("member-mypage")} type="button">
                    回答一覧
                  </button>
                  <button className="nav-link" type="button">
                    お知らせ
                  </button>
                </nav>
              </section>

              <section className={`screen ${screen === "member-auth" ? "is-active" : ""}`}>
                <div className="success-panel auth-panel">
                  <div className="success-badge">LINE認証</div>
                  <h3>回答前にLINEログインが必要です</h3>
                  <p>
                    本番ではここでLIFFまたはLINE Loginを使って認証します。認証後は押下した募集画面へ戻ります。
                  </p>
                  <div className="auth-status">
                    <span>LIFF状態</span>
                    <strong>{renderLiffStatus(liffStatus)}</strong>
                  </div>
                  <div className="done-card auth-card">
                    <span>認証後の遷移先</span>
                    <strong>
                      {authReturnScreen === "member-detail"
                        ? "交通安全見守りスタッフ"
                        : authReturnScreen === "member-detail-new"
                          ? "図書室整理サポート"
                          : "自分の回答一覧"}
                    </strong>
                  </div>
                  {liffError ? <p className="error-text">{liffError}</p> : null}
                  <button className="primary-button wide" onClick={completeLineAuth} type="button">
                    LINEで認証する
                  </button>
                  <button className="ghost-button wide" onClick={() => go("member-list")} type="button">
                    一覧へ戻る
                  </button>
                </div>
              </section>

              <section className={`screen ${screen === "member-detail" ? "is-active" : ""}`}>
                <div className="mobile-topbar">
                  <div>
                    <p className="top-label">募集詳細</p>
                    <h3>交通安全見守りスタッフ</h3>
                  </div>
                  <span className="status-pill">募集中</span>
                </div>
                <div className="detail-stack">
                  <div className="detail-block emphasis">
                    <span>現在 6 / 8 名</span>
                    <strong>締切 3月22日 18:00</strong>
                  </div>
                  <div className="detail-block">
                    <p className="detail-title">お仕事内容</p>
                    <p>校門前の立哨と横断歩道の見守りを担当します。蛍光ベストは当日配布します。</p>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-block">
                      <p className="detail-title">開催日</p>
                      <p>2026/03/25</p>
                    </div>
                    <div className="detail-block">
                      <p className="detail-title">時間</p>
                      <p>09:00 - 11:00</p>
                    </div>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-block">
                      <p className="detail-title">スタッフ区分</p>
                      <p>見守り</p>
                    </div>
                    <div className="detail-block">
                      <p className="detail-title">運営区分</p>
                      <p>校外活動</p>
                    </div>
                  </div>
                  <label className="field">
                    <span>連絡メモ</span>
                    <textarea defaultValue="当日は徒歩で参加します。" rows={3} />
                  </label>
                </div>
                <div className="cta-row">
                  <button className="ghost-button" onClick={() => go("member-done")} type="button">
                    回答を取り消す
                  </button>
                  <button className="primary-button" onClick={() => go("member-done")} type="button">
                    回答を更新する
                  </button>
                </div>
              </section>

              <section className={`screen ${screen === "member-detail-new" ? "is-active" : ""}`}>
                <div className="mobile-topbar">
                  <div>
                    <p className="top-label">募集詳細</p>
                    <h3>図書室整理サポート</h3>
                  </div>
                  <span className="status-pill">未回答</span>
                </div>
                <div className="detail-stack">
                  <div className="detail-block emphasis">
                    <span>現在 2 / 5 名</span>
                    <strong>締切 3月26日 17:00</strong>
                  </div>
                  <div className="detail-block">
                    <p className="detail-title">お仕事内容</p>
                    <p>図書室の本棚整理、貸出返却カードの補充、掲示物の張り替えを行います。</p>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-block">
                      <p className="detail-title">開催日</p>
                      <p>2026/03/29</p>
                    </div>
                    <div className="detail-block">
                      <p className="detail-title">時間</p>
                      <p>13:00 - 15:00</p>
                    </div>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-block">
                      <p className="detail-title">スタッフ区分</p>
                      <p>図書支援</p>
                    </div>
                    <div className="detail-block">
                      <p className="detail-title">運営区分</p>
                      <p>室内活動</p>
                    </div>
                  </div>
                  <label className="field">
                    <span>連絡メモ</span>
                    <textarea placeholder="必要があれば入力してください" rows={3} />
                  </label>
                </div>
                <div className="cta-row single-action">
                  <button className="primary-button wide" onClick={() => go("member-done")} type="button">
                    この内容で回答する
                  </button>
                </div>
              </section>

              <section className={`screen ${screen === "member-done" ? "is-active" : ""}`}>
                <div className="success-panel">
                  <div className="success-badge">受付完了</div>
                  <h3>回答を受け付けました</h3>
                  <p>LINEに受付完了メッセージを送信しました。締切までは内容の編集や取り消しができます。</p>
                  <div className="done-card">
                    <span>確定通知について</span>
                    <strong>締切後に自動送信されます</strong>
                  </div>
                  <button className="primary-button wide" onClick={() => go("member-list")} type="button">
                    募集一覧へ戻る
                  </button>
                </div>
              </section>

              <section className={`screen ${screen === "member-mypage" ? "is-active" : ""}`}>
                <div className="mobile-topbar">
                  <div>
                    <p className="top-label">マイページ</p>
                    <h3>自分の回答一覧</h3>
                  </div>
                  <span className="status-pill">2件</span>
                </div>
                <div className="answer-item">
                  <div>
                    <h4>交通安全見守りスタッフ</h4>
                    <p>3/25 09:00-11:00</p>
                  </div>
                  <span className="tag pending">確定前</span>
                </div>
                <div className="answer-item">
                  <div>
                    <h4>読み聞かせ補助</h4>
                    <p>3/14 08:20-09:00</p>
                  </div>
                  <span className="tag confirmed">確定済み</span>
                </div>
                <div className="timeline-note">
                  確定済みの募集には、確定通知本文に記載されたオープンチャット案内がLINEで届きます。
                </div>
              </section>
            </div>
          </div>

          <div className={`device-stage ${mode === "admin" ? "is-active" : ""}`}>
            <div className="admin-shell">
              <section className={`screen ${screen === "admin-dashboard" ? "is-active" : ""}`}>
                <div className="admin-topbar">
                  <div>
                    <p className="top-label">Dashboard</p>
                    <h3>本日の募集状況</h3>
                  </div>
                  <button className="primary-button small" onClick={() => go("admin-edit")} type="button">
                    新規募集
                  </button>
                </div>
                <div className="stat-grid">
                  <article className="stat-card">
                    <span>公開中</span>
                    <strong>6</strong>
                  </article>
                  <article className="stat-card accent">
                    <span>締切本日</span>
                    <strong>2</strong>
                  </article>
                  <article className="stat-card warm">
                    <span>定員到達</span>
                    <strong>3</strong>
                  </article>
                  <article className="stat-card dark">
                    <span>通知待ち</span>
                    <strong>14</strong>
                  </article>
                </div>
                <div className="admin-card">
                  <div className="section-title-row">
                    <h4>通知ジョブ</h4>
                    <span>自動実行</span>
                  </div>
                  <p>締切後の確定通知は締切直後から10分後の間で順次送信されます。</p>
                </div>
              </section>

              <section className={`screen ${screen === "admin-list" ? "is-active" : ""}`}>
                <div className="admin-topbar">
                  <div>
                    <p className="top-label">Surveys</p>
                    <h3>募集一覧</h3>
                  </div>
                  <button className="primary-button small" onClick={() => go("admin-edit")} type="button">
                    コピー新規
                  </button>
                </div>
                <div className="table-card">
                  <div className="table-head">
                    <span>募集名</span>
                    <span>状況</span>
                    <span>人数</span>
                    <span>締切</span>
                  </div>
                  <div className="table-row">
                    <span>交通安全見守りスタッフ</span>
                    <span className="tag active">公開中</span>
                    <span>6 / 8</span>
                    <span>3/22 18:00</span>
                  </div>
                  <div className="table-row">
                    <span>会場設営サポート</span>
                    <span className="tag closed">定員到達</span>
                    <span>12 / 12</span>
                    <span>3/28 17:00</span>
                  </div>
                  <div className="table-row">
                    <span>読み聞かせ補助</span>
                    <span className="tag pending">下書き</span>
                    <span>0 / 4</span>
                    <span>3/15 18:00</span>
                  </div>
                </div>
              </section>

              <section className={`screen ${screen === "admin-edit" ? "is-active" : ""}`}>
                <div className="admin-topbar">
                  <div>
                    <p className="top-label">Editor</p>
                    <h3>募集作成</h3>
                  </div>
                  <button className="ghost-button small" onClick={() => go("admin-list")} type="button">
                    下書き保存
                  </button>
                </div>
                <div className="form-layout">
                  <label className="field">
                    <span>募集タイトル</span>
                    <input defaultValue="交通安全見守りスタッフ" type="text" />
                  </label>
                  <div className="double-fields">
                    <label className="field">
                      <span>募集人数</span>
                      <input defaultValue="8" type="number" />
                    </label>
                    <label className="field">
                      <span>締切日時</span>
                      <input defaultValue="2026/03/22 18:00" type="text" />
                    </label>
                  </div>
                  <label className="field">
                    <span>募集内容</span>
                    <textarea defaultValue="登校時間帯の見守りスタッフを募集します。" rows={3} />
                  </label>
                  <label className="field">
                    <span>確定通知本文</span>
                    <textarea
                      defaultValue={`ご参加ありがとうございます。確定しました。\n\nオープンチャットURL:\nhttps://example.com/openchat\n\n参加パスワード:\nPTA2026`}
                      rows={5}
                    />
                  </label>
                </div>
                <div className="cta-row admin-actions">
                  <button className="ghost-button" onClick={() => go("admin-list")} type="button">
                    プレビュー
                  </button>
                  <button className="primary-button" onClick={() => go("admin-list")} type="button">
                    公開する
                  </button>
                </div>
              </section>

              <section className={`screen ${screen === "admin-answers" ? "is-active" : ""}`}>
                <div className="admin-topbar">
                  <div>
                    <p className="top-label">Answers</p>
                    <h3>回答一覧</h3>
                  </div>
                  <span className="status-pill">先着順</span>
                </div>
                <div className="table-card">
                  <div className="table-head answers">
                    <span>回答者</span>
                    <span>回答日時</span>
                    <span>状態</span>
                    <span>通知</span>
                  </div>
                  <div className="table-row answers">
                    <span>山田 花子</span>
                    <span>3/10 09:12</span>
                    <span className="tag confirmed">確定候補</span>
                    <span>未送信</span>
                  </div>
                  <div className="table-row answers">
                    <span>佐藤 由美</span>
                    <span>3/10 09:23</span>
                    <span className="tag confirmed">確定候補</span>
                    <span>未送信</span>
                  </div>
                  <div className="table-row answers">
                    <span>田中 恵</span>
                    <span>3/10 10:01</span>
                    <span className="tag pending">確定前</span>
                    <span>受付済み</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>

        <aside className="panel panel-notes">
          <div className="panel-head">
            <p className="panel-kicker">Notes</p>
            <h2>UI方針</h2>
          </div>
          <ul className="notes-list">
            <li>回答者UIはLIFF前提で、片手操作しやすい下部ナビと大きめCTAを採用。</li>
            <li>管理者UIは一覧性を優先し、締切と人数の把握を最短でできる構成。</li>
            <li>満員から取り消しで再募集可能になる挙動を、一覧上のボタン状態で表現。</li>
            <li>確定通知本文は募集作成画面で必須入力にして、運用ミスを減らす。</li>
          </ul>
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
