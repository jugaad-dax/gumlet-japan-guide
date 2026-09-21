# Gumlet Japan Guide & Showcase

ジュガード株式会社が運営する日本向けGumlet導入ガイドです。HTML・CSS・JavaScriptのみで構成した、情報提供とアフィリエイト広告のための1ページサイトです。canonical・OGP・構造化データの基準URLは `https://site-speedup.com/` です。

## ビルド

Node.js 20以上で、外部パッケージを追加せずに検証とビルドを実行できます。

```sh
npm run check
npm run build
```

`npm run check`はドメイン、広告開示、紹介特典、FAQ・HowTo、Googleタグ、CSPハッシュ、内部リンクなどを検証します。`npm run build`は検証後、公開用の7ファイルだけを`dist/`へコピーします。ビルド成果物にREADMEや検証コードは含みません。

## 本番公開・自動デプロイ

2026年9月21日、[更新PR #1](https://github.com/jugaad-dax/gumlet-japan-guide/pull/1)を`main`にマージし、Cloudflare PagesのGitHub連携による本番デプロイ成功を確認しました。独自ドメインとDNSの接続も完了し、[https://site-speedup.com/](https://site-speedup.com/)で公開しています。

| 設定 | 値 |
|---|---|
| 本番URL | https://site-speedup.com/ |
| GitHubリポジトリ | https://github.com/jugaad-dax/gumlet-japan-guide |
| Pagesプロジェクト | `gumlet-japan-guide` |
| 本番ブランチ | `main` |
| Build command | `npm run build` |
| Output directory | `dist` |
| DNS | `site-speedup.com`のCNAME → `gumlet-japan-guide.pages.dev`（プロキシ有効、TTL自動） |

今後も`main`の更新により自動で検証・ビルド・デプロイされます。公開HTMLとアセットの一致、HTTPS接続、HTTPからHTTPSへの転送、スマートフォン・PC表示を確認済みです。Search Consoleの新ドメインに対するプロパティ登録・所有権確認操作、GA4管理画面の設定変更は実施していません。既存の認証タグ・計測コードは維持しています。

## コンテンツ

ページの最上部にPR表示を設置しています。特典表現は「紹介特典：全有料プラン20%OFF」に統一し、5か所のCTAにコード不要・リンク経由での自動適用を説明しています。これは運営者提供の特典仕様であり、購入操作による割引適用の実証は行っていません。

トップにはSample 03の実際のGumletプレイヤーをeager loadingで配置しています。サンプル欄の3プレイヤーはlazy loadingです。旧装飾画像と光彩エフェクトを削除し、白・スレート・インディゴの配色に変更しました。シーク・自動再生の可否は端末・ブラウザ設定・動画設定によります。

料金は2026年9月21日に確認した公式公開情報を使い、年払い時の月額相当と従量料金を区別しています。通貨換算は指定値の1米ドル＝156.8円です。最新料金と条件はページ内の公式出典をご確認ください。

## 計測・構造化データ・セキュリティ

Search Console認証タグとGA4 `G-9KJF5ZSXY5`を維持しています。`_headers`のセキュリティ設定も変更していません。インラインGA4コードを変更する場合は、その内容に対応するCSPハッシュも更新してください。

WebPage・WebSite・Organization・Article・FAQPage・HowTo・BreadcrumbListの7種類を保持しています。FAQと手順、日付、ドメインを変更する際は、表示内容とJSON-LDを同期してください。運営会社への個別対応を案内するリンクとContactPointは含めていません。

CSS/JavaScriptの参照には`?v=20260921-1`を付けています。OG画像は汎用性の高いPNGを参照し、編集用SVGも同梱しています。新しい検証結果は[VALIDATION.md](./VALIDATION.md)をご覧ください。
