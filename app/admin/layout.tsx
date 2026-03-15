import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="landing-shell">
      <header className="admin-header-bar">
        <div>
          <p className="eyebrow">PTA Admin</p>
          <h1 className="admin-page-title">管理者画面</h1>
        </div>
        <nav className="admin-nav">
          <Link className="text-link" href="/admin">
            ダッシュボード
          </Link>
          <Link className="text-link" href="/admin/surveys">
            募集管理
          </Link>
          <Link className="text-link" href="/admin/applications">
            応募集計
          </Link>
          <Link className="text-link" href="/">
            利用者画面
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
