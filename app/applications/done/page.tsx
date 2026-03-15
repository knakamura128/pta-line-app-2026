import Link from "next/link";

type DonePageProps = {
  searchParams: Promise<{
    mode?: string;
  }>;
};

export default async function ApplicationDonePage({ searchParams }: DonePageProps) {
  const { mode } = await searchParams;
  const isUpdated = mode === "updated";

  return (
    <div className="landing-shell">
      <div className="success-screen">
        <div className="success-badge">{isUpdated ? "更新完了" : "応募完了"}</div>
        <h1>{isUpdated ? "応募内容を更新しました" : "応募を受け付けました"}</h1>
        <p className="hero-copy">
          内容は保存済みです。必要があれば募集一覧や自分の回答一覧から再度編集できます。
        </p>
        <div className="success-actions">
          <Link className="primary-button wide text-button" href="/">
            募集一覧へ戻る
          </Link>
          <Link className="ghost-button wide text-button" href="/me/applications">
            自分の回答一覧を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
