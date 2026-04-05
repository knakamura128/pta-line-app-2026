import Link from "next/link";

const publicModules = [
  {
    id: "public-list",
    step: "1",
    title: "活動募集一覧を見る",
    points: [
      "公開中の募集件数を見ながら、参加したい活動を一覧で確認します。",
      "各カードには担当区分、開催期間、現在人数、募集状況がまとまっています。",
      "「自分の回答一覧」から、応募済みの内容もすぐ確認できます。"
    ],
    preview: {
      kicker: "活動募集一覧",
      heading: "一覧から参加したい活動を選ぶ",
      meta: "開催期間：4/9-4/15 07:55-08:15",
      body: "募集の内容を確認しながら、応募する活動を選びます。",
      chips: ["担当区分", "開催期間", "現在人数", "応募する"]
    }
  },
  {
    id: "public-apply",
    step: "2",
    title: "応募内容を入力する",
    points: [
      "応募時にはLINE認証を行い、応募者名、学年、組、選択項目などを入力します。",
      "選択肢に上限がある場合は、残り人数や満員状態を見ながら選べます。",
      "送信後は受付通知がLINEに届きます。"
    ],
    preview: {
      kicker: "応募フォーム",
      heading: "必要事項を入力して応募",
      meta: "LINE認証後に入力",
      body: "学年・組・姓・選択項目などを入力して保存します。",
      chips: ["姓", "学年", "組", "選択項目"]
    }
  },
  {
    id: "public-manage",
    step: "3",
    title: "応募後に確認・編集する",
    points: [
      "一覧では応募済みの募集が「応募済み / 編集する」と表示されます。",
      "締切前であれば、応募内容の変更や取り消しができます。",
      "自分の回答一覧から、応募中の活動をまとめて確認できます。"
    ],
    preview: {
      kicker: "応募後",
      heading: "応募済みの活動を見直す",
      meta: "締切前は編集・取消可能",
      body: "応募済みの募集はあとから内容確認や更新ができます。",
      chips: ["応募済み", "編集する", "取り消す", "自分の回答一覧"]
    }
  }
];

const adminModules = [
  {
    id: "admin-dashboard",
    step: "1",
    title: "ダッシュボードで状況を見る",
    points: [
      "公開中、締切間近、定員到達、総応募数を最初に確認できます。",
      "下にある公開中の募集から、締切や応募人数も一覧で把握できます。",
      "まずその日の全体状況をここで確認する運用がしやすい構成です。"
    ],
    preview: {
      kicker: "ダッシュボード",
      heading: "今日の募集状況をひと目で確認",
      meta: "公開中 / 締切間近 / 定員到達 / 総応募数",
      body: "運用の起点になる画面です。",
      chips: ["公開中", "締切間近", "定員到達", "総応募数"]
    }
  },
  {
    id: "admin-surveys",
    step: "2",
    title: "募集を作成・編集する",
    points: [
      "募集一覧から編集、コピー新規、削除、回答確認へ進めます。",
      "新規募集では担当区分、開催日程、人数、確定通知文面などを入力します。",
      "まず下書き保存し、内容確認後に公開する流れで運用できます。"
    ],
    preview: {
      kicker: "募集管理",
      heading: "新規作成とコピー新規で募集を整える",
      meta: "編集 / コピー新規 / 削除 / 回答を確認",
      body: "同じ形式の募集はコピー新規で素早く作れます。",
      chips: ["新規募集", "編集", "コピー新規", "下書き保存"]
    }
  },
  {
    id: "admin-answers",
    step: "3",
    title: "回答一覧と集計を確認する",
    points: [
      "回答一覧では、最新の応募や募集別応募数をまとめて確認できます。",
      "募集詳細では、回答者一覧、学年別・組別集計、送信ログを見られます。",
      "定員までの進み具合や、どの学年に参加者が多いかも把握できます。"
    ],
    preview: {
      kicker: "回答確認",
      heading: "応募状況と集計をまとめて確認",
      meta: "募集別応募数 / 最新の回答一覧 / 送信ログ",
      body: "応募人数と内訳を見ながら運用判断ができます。",
      chips: ["募集別応募数", "最新の回答一覧", "送信ログ", "学年別集計"]
    }
  },
  {
    id: "admin-dayof",
    step: "4",
    title: "当日確認と通知送信を行う",
    points: [
      "募集詳細の回答者一覧で、来場した人に「確認済み」チェックを付けられます。",
      "チェック未済の人は未確認として残るため、当日の来場管理に使えます。",
      "必要なタイミングで、先着順の対象者へ確定通知を送信できます。"
    ],
    preview: {
      kicker: "当日運用",
      heading: "来場確認と確定通知をまとめて管理",
      meta: "確認済みチェック / 先着順通知",
      body: "実際の運用に近い管理作業をここで行います。",
      chips: ["確認済み", "未確認", "確定通知を送る", "送信ログ"]
    }
  }
];

type GuideMode = "public" | "admin";

export default async function GuidePage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const guideMode: GuideMode = mode === "admin" ? "admin" : "public";
  const visibleModules = guideMode === "admin" ? adminModules : publicModules;

  return (
    <div className="landing-shell">
      <header className="landing-hero">
        <div className="hero-copy-wrap">
          <p className="eyebrow">PTA Guide</p>
          <h1>使い方ガイド</h1>
          <p className="hero-copy">
            {guideMode === "admin"
              ? "管理者向け画面の使い方を、スクリーンショット風のガイドでまとめています。"
              : "利用者向け画面の使い方を、スクリーンショット風のガイドでまとめています。"}
          </p>
          <div className="hero-inline">
            <Link className="ghost-button small" href="/">
              活動募集一覧へ
            </Link>
            {guideMode === "admin" ? (
              <Link className="ghost-button small" href="/admin">
                管理者画面へ
              </Link>
            ) : null}
          </div>
        </div>
        <div className="summary-card">
          <span>ガイド収録</span>
          <strong>{visibleModules.length}画面</strong>
          <p>{guideMode === "admin" ? "管理者向けの主要モジュールをまとめています。" : "利用者向けの主要モジュールをまとめています。"}</p>
        </div>
      </header>

      <main className="guide-page-grid">
        {guideMode === "public" ? (
          <section className="guide-section" id="public">
            <div className="guide-section-head">
              <div>
                <p className="top-label">Public</p>
                <h2>利用者向けガイド</h2>
              </div>
              <Link className="text-link" href="/">
                公開画面を開く
              </Link>
            </div>
            <div className="guide-module-list">
              {publicModules.map((module) => (
                <article className="guide-module-card" id={module.id} key={module.id}>
                  <div className="guide-shot">
                    <div className="guide-shot-bar">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="guide-shot-body">
                      <p className="top-label">{module.preview.kicker}</p>
                      <h3>{module.preview.heading}</h3>
                      <p className="guide-shot-meta">{module.preview.meta}</p>
                      <p className="guide-shot-copy">{module.preview.body}</p>
                      <div className="guide-shot-chip-row">
                        {module.preview.chips.map((chip) => (
                          <span className="guide-shot-chip" key={chip}>
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="guide-module-copy">
                    <div className="guide-module-head">
                      <span className="guide-step">{module.step}</span>
                      <div>
                        <p className="top-label">Module</p>
                        <h3>{module.title}</h3>
                      </div>
                    </div>
                    <ul className="guide-bullet-list">
                      {module.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {guideMode === "admin" ? (
          <section className="guide-section" id="admin">
            <div className="guide-section-head">
              <div>
                <p className="top-label">Admin</p>
                <h2>管理者向けガイド</h2>
              </div>
              <Link className="text-link" href="/admin">
                管理画面を開く
              </Link>
            </div>
            <div className="guide-module-list">
              {adminModules.map((module) => (
                <article className="guide-module-card" id={module.id} key={module.id}>
                  <div className="guide-shot guide-shot-admin">
                    <div className="guide-shot-bar">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="guide-shot-body">
                      <p className="top-label">{module.preview.kicker}</p>
                      <h3>{module.preview.heading}</h3>
                      <p className="guide-shot-meta">{module.preview.meta}</p>
                      <p className="guide-shot-copy">{module.preview.body}</p>
                      <div className="guide-shot-chip-row">
                        {module.preview.chips.map((chip) => (
                          <span className="guide-shot-chip" key={chip}>
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="guide-module-copy">
                    <div className="guide-module-head">
                      <span className="guide-step">{module.step}</span>
                      <div>
                        <p className="top-label">Module</p>
                        <h3>{module.title}</h3>
                      </div>
                    </div>
                    <ul className="guide-bullet-list">
                      {module.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
