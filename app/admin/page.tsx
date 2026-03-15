import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="landing-shell">
      <header className="landing-hero">
        <div className="hero-copy-wrap">
          <p className="eyebrow">Admin Console</p>
          <h1>管理者ダッシュボード</h1>
          <p className="hero-copy">
            この画面は Basic 認証で保護されています。今後、募集作成、応募一覧、通知送信をここに集約します。
          </p>
          <div className="hero-inline">
            <Link className="text-link" href="/">
              募集一覧へ戻る
            </Link>
            <Link className="text-link" href="/prototype">
              UIモックを見る
            </Link>
          </div>
        </div>
        <div className="summary-card">
          <span>保護範囲</span>
          <strong>/admin</strong>
          <p>認証情報は環境変数 `ADMIN_BASIC_USER` と `ADMIN_BASIC_PASS` で管理します。</p>
        </div>
      </header>

      <main className="survey-grid">
        <section className="survey-column">
          <article className="survey-card survey-open">
            <h2>今後ここに置くもの</h2>
            <div className="detail-stack">
              <div className="detail-block">
                <p className="detail-title">募集管理</p>
                <p>新規作成、編集、コピー新規、公開/締切管理</p>
              </div>
              <div className="detail-block">
                <p className="detail-title">応募一覧</p>
                <p>学年別集計、応募者一覧、確定候補の確認</p>
              </div>
              <div className="detail-block">
                <p className="detail-title">通知</p>
                <p>確定通知本文の管理、送信履歴の確認</p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
