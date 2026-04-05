import Link from "next/link";
import { isAdminAuthConfigured } from "@/lib/admin-auth";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="landing-shell admin-login-shell">
      <main className="admin-login-card">
        <div className="panel-head">
          <p className="panel-kicker">PTA Admin</p>
          <h1>管理者ログイン</h1>
          <p className="hero-copy">管理画面を利用するには、管理者用のIDとパスワードを入力してください。</p>
        </div>

        {!isAdminAuthConfigured() ? (
          <div className="inline-notice">
            <strong>管理者ログインが未設定です。</strong>
            <span>`ADMIN_LOGIN_USER` と `ADMIN_LOGIN_PASS` を設定してください。</span>
          </div>
        ) : null}

        {error ? (
          <div className="inline-notice">
            <strong>ログインに失敗しました。</strong>
            <span>入力内容を確認してください。</span>
          </div>
        ) : null}

        <form action="/api/admin/login" className="form-layout" method="post">
          <input name="next" type="hidden" value={next || "/admin"} />
          <label className="field">
            <span>ID</span>
            <input autoComplete="username" name="user" required type="text" />
          </label>
          <label className="field">
            <span>パスワード</span>
            <input autoComplete="current-password" name="pass" required type="password" />
          </label>
          <button className="primary-button wide" type="submit">
            ログイン
          </button>
        </form>

        <Link className="text-link" href="/">
          利用者画面へ戻る
        </Link>
      </main>
    </div>
  );
}
