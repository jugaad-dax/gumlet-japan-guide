# 2026年9月21日 改修版・本番公開の検証記録

独自ドメイン向けURL、広告表記、紹介特典、情報提供メディアへの構成変更、公式料金、およびライトテーマへの刷新について、ローカル検証と本番公開後の検証を実施しました。**本番URLは [https://site-speedup.com/](https://site-speedup.com/) です。** 以下の本番検証は2026年9月21日13:39〜13:42（日本時間）の結果です。

## GitHub・Cloudflare Pages・DNS

[PR #1](https://github.com/jugaad-dax/gumlet-japan-guide/pull/1)は通常のマージ手順で`main`に反映されました。公開コードのマージコミットは`92ac05790de1931af539f16e48b1a4e83660bdce`です。GitHub上の更新ブランチの全ファイルが、事前に検証したローカル改修版と一致することも確認しました。

| 対象 | 確認結果 |
|---|---|
| 自動デプロイ | `github:push`、ブランチ`main`、対象コミット一致、`deploy`成功。 |
| PagesデプロイID | `fb5d813f-6518-4278-80e7-7ef284398057` |
| ビルド設定 | Build command：`npm run build`、Output directory：`dist`。 |
| カスタムドメイン | `site-speedup.com`の状態・所有確認・ドメイン検証はいずれも`active`。 |
| DNS | apex CNAME → `gumlet-japan-guide.pages.dev`、プロキシ有効、TTL自動。既存レコードの置換なし。 |
| HTTPS | 有効なTLS接続でHTTP 200。HTTPからHTTPSへの転送も確認。 |
| 配信内容 | HTML・CSS・JavaScript・favicon SVG・OGP SVG/PNGの6ファイルがローカル公開用ソースとバイト単位で一致。 |
| Pages既定URL | `gumlet-japan-guide.pages.dev`でも同一HTMLを配信。canonicalは独自ドメイン。 |
| セキュリティ | CSP、HSTS、nosniff、Referrer-Policyを維持。 |

## ビルド・静的検証

`npm run build`、`npx --yes html-validate --rule void-style:off index.html`、`node --check script.js`、`git diff --check`が成功しました。HTML検証の`void-style`例外は、依頼者指定のSearch Consoleの自己終了形式metaタグを維持するためです。ビルドは公開用7ファイルを`dist/`に生成し、README・検証スクリプトなどは公開成果物に含めません。

| 対象 | 確認結果 |
|---|---|
| URL | canonical・OGP・Twitterカード・JSON-LDが`https://site-speedup.com/`を参照。 |
| PR表示 | 本文より前の最上部にPRと広告開示文を表示。 |
| 紹介特典 | 5か所のCTAに統一表現と自動適用・コード不要の注記を設置。 |
| 個別対応への誘導 | 窓口案内・該当リンク・伴走表現・JSON-LDのContactPointを撤去。 |
| FAQ・手順 | 表示中の回答・3ステップと構造化データが一致。 |
| Googleタグ | Search Console認証値・GA4測定ID・ローダー・インラインコードを維持。CSPハッシュ一致。 |
| 構造化データ | WebPage・WebSite・Organization・Article・FAQPage・HowTo・BreadcrumbListを解析でき、記事日付も表示と一致。 |
| 装飾 | グリッド・グロー・グラデーション・旧AI解説画像を撤去。 |
| OGP | 1200×630のPNGを使用し、元のSVGも保持。 |

## ブラウザ検証

ローカルでは320・375・390・430・768・1024・1440 CSS px、本番の独自ドメインでは320・375・430・768・1024・1440 CSS pxをChromium / Playwrightで検証しました。各画面幅と文書幅が一致し、比較表の横スクロールは専用コンテナ内に限定されています。モバイルメニューの開閉とEscapeキー、FAQの展開が動作し、未処理のページ例外はありませんでした。

本番の375×812ではトッププレイヤーが縦位置453.84〜645.66px、1440×960では317.34〜660.48pxに表示され、スクロール前から見えます。両画面幅で実動画の`readyState=4`、正の再生時間、`paused=false`、動画エラーなしを確認しました。スマートフォンとデスクトップのスクリーンショットで、最上部の広告開示、白基調のレイアウト、実動画の表示を目視確認しています。プレイヤーはヒーローを含め4件です。

Search Console認証タグ、GA4関数、`G-9KJF5ZSXY5`への初期設定、7種類の構造化データを本番で検証しました。今回のブラウザ試験では、テストアクセスを本番GA4へ送らないようテスト側でGoogleへの外部通信を止めています。サイトコードは変更しておらず、GA4管理画面へのイベント到着は今回の確認対象ではありません。

## 価格と注記

公式情報の確認日は2026年9月21日です。VimeoはStandard $25／Advanced $75、GumletはGrowth $19／Business $99を掲載し、いずれも年払い時の月額相当と明記しました。CloudFrontの$0.085/GBは米国・欧州の例として扱い、日本の該当帯域単価$0.114/GBを併記しました。1米ドル＝156.8円の換算は`bc`で計算し、参考値として丸めています。

## 検証対象外

Search Consoleでの新ドメインのプロパティ登録・所有権確認操作とGA4管理画面の設定変更は実施していません。割引の自動適用は運営者提供の仕様を表示したもので、購入による適用実証ではありません。法令への適合を保証する法的審査、外部LLMOツールの再採点、実機全ブラウザ試験、長時間再生試験も対象外です。検索順位やAI回答への採用を保証するものではありません。
