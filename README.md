# PTA LINE App

PTA 活動募集を LINE ミニアプリから応募できる Next.js アプリです。  
LIFF 認証、募集管理、応募受付、管理者向け集計、LINE Messaging API による個別通知までを含みます。

## 主な機能

- 利用者向け
  - LIFF で起動
  - LINE ログイン後に募集へ応募
  - 応募済み内容の編集
  - 学年・組・姓の入力
  - 募集ごとの追加選択項目
    - ラジオボタン
    - チェックボックス
    - 選択肢ごとの上限人数
- 管理者向け
  - Basic 認証付き `/admin`
  - 募集一覧
  - 募集作成 / 編集
  - コピー新規
  - 回答一覧と集計
  - LINE 送信ログ確認
  - 確定通知の手動送信
- 通知
  - 応募時の受付通知を応募者本人へ送信
  - 確定通知本文を先着対象者へ送信

## 技術構成

- Next.js 15 / App Router
- React 19
- Prisma
- PostgreSQL
  - Neon / Vercel Postgres 互換
- LIFF SDK
- LINE Messaging API

## 必要な環境変数

`.env.local` を作成して設定します。

```env
NEXT_PUBLIC_LIFF_ID=your-liff-id
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
ADMIN_BASIC_USER=admin
ADMIN_BASIC_PASS=change-me
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
```

補足:

- `NEXT_PUBLIC_LIFF_ID`
  - 利用中の環境に対応した LIFF ID
- `LINE_CHANNEL_ACCESS_TOKEN`
  - `Channel secret` ではなく Messaging API の `Channel access token`
- `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASS`
  - `/admin` 用の Basic 認証

## ローカル起動

```bash
npm install
npm run prisma:push
npm run dev
```

ビルド確認:

```bash
npm run build
```

## 主要画面

- `/`
  - 利用者向け募集一覧
- `/surveys/[slug]`
  - 応募フォーム
- `/me/applications`
  - 自分の応募一覧
- `/admin`
  - 管理者ダッシュボード
- `/admin/surveys`
  - 募集一覧
- `/admin/surveys/new`
  - 募集作成
- `/admin/surveys/edit?id=...`
  - 募集編集
- `/admin/applications`
  - 回答一覧 / 送信ログ一覧
- `/prototype`
  - 初期 UI モック

## データモデル概要

- `Survey`
  - 募集本体
  - 追加選択項目
  - 選択肢ごとの上限人数
  - 確定通知本文
- `Application`
  - 応募者情報
  - LINE userId
  - 姓
  - 学年 / 組
  - 選択回答
- `MessageDelivery`
  - 受付通知 / 確定通知の送信結果
  - 成功 / 失敗
  - 失敗理由

## LINE 通知について

このアプリは一斉配信を行いません。送信対象は次に限定しています。

- 受付通知
  - 応募した本人のみ
- 確定通知
  - その募集の先着対象者のみ

実装上も `broadcast` は使っておらず、個別 `push message` のみです。

## 既知の前提

- LIFF と Messaging API は同じ LINE 公式アカウント運用を前提にしています
- 受付通知・確定通知の自動スケジューリングは未実装です
  - 現在は受付通知が自動
  - 確定通知は管理画面から送信
- メッセージ送信結果は管理画面の送信ログで確認できます

## 運用メモ

- 本番用 LIFF ID と開発用 LIFF ID は分けて管理すること
- Vercel の `Production` / `Preview` で環境変数を分けること
- Messaging API の送信に失敗した場合は `/admin/applications` の送信ログを確認すること
