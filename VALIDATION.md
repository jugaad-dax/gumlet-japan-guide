# 本番リリース検証記録

2026年9月18日（日本時間）、[本番サイト](https://gumlet-japan-guide.pages.dev/)に対して実施した検証の記録です。HTML・CSSの最終実装コミットは `a7db677` です。

## レスポンシブ表示と操作

Chromium / Playwrightでビューポートを明示して検証しました。ブラウザの画面サイズ指定だけで代用せず、375・390・430・768・1024・1440 CSS pxの各幅で、文書幅とビューポート幅が一致することを確認しています。対象の本文、見出し、CTA、画像、動画カードに画面外へのはみ出しは検出されませんでした。

| 確認対象 | 結果 |
|---|---|
| 375・390・430pxのスマートフォン幅 | ページ全体の横スクロールなし。ヘッダー、特典バッジ、本文、CTAを確認。 |
| 768・1024・1440px | レイアウト幅を確認。1440pxのヒーローを目視確認。 |
| 比較表 | 表のコンテナ内のみ横スクロール可能。375pxで表示幅341px、内容幅680px。 |
| 動画コンテナ | 3件とも16:9。375pxでは各341 × 191.8125px。 |
| モバイルメニュー | 開く、ナビゲーションを押す、閉じる操作が成功。 |
| FAQ | `details/summary`で展開・折り畳みが機能。 |
| 実行エラー | レスポンシブ検証中に未処理のページ例外なし。 |

375pxと1440pxのヒーロー、および375pxの比較表を画像で確認しました。動画プレイヤーは、初回読み込みに時間がかかる場合があります。別途読み込み後に3件すべての`video`要素で`readyState=4`、`paused=false`、正の再生時間を確認しています。自動再生の可否は端末・ブラウザ設定によって異なります。Gumlet側のレポート専用CSPに起因する警告はありましたが、親ページのCSPによるフレーム拒否は確認されていません。

## HTML・構造化データ

`npx --yes html-validate index.html`と`git diff --check`が成功しました。別途、次の内容をソースから検証しました。

| 項目 | 検証内容 |
|---|---|
| 文書構造 | `lang="ja"`、viewport、単一h1、重複しないID、有効な内部アンカー。 |
| アフィリエイト | 指定の紹介URL、`target="_blank"`、`rel="noopener noreferrer"`。 |
| 動画 | 指定の3件、lazy loading、title、referrerpolicy、fullscreen許可。 |
| 解説画像 | WebP 3件。alt、実寸width/height、lazy loading、figure/figcaption。 |
| FAQ | 表示中の4問とFAQPage JSON-LDの質問・回答が完全一致。 |
| 著者・日付 | 著者・役職・専門領域、運営者・連絡先、timeとJSON-LDの日付同期。 |
| フッター | プライバシーポリシーと利用規約へのリンクを実装。 |

## Cloudflare本番応答

HTML・CSS・JavaScript・favicon・WebP 3件の公開URLがHTTP 200を返し、取得した本文のSHA-256がローカルの対応ファイルと一致しました。HTML・CSS・JavaScript・SVGはBrotli圧縮で配信されました。WebPは既に圧縮された画像形式であり、Content-Encodingを偽装していません。

| ヘッダー | 確認値 |
|---|---|
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` |
| Cache-Control | `public, max-age=0, must-revalidate` |
| X-Content-Type-Options | `nosniff` |
| Content-Security-Policy | `frame-src https://play.gumlet.io`を許可し、他の基本制限を維持。 |

CSS/JavaScriptのURLにバージョンを付け、旧キャッシュによる表示崩れを避けています。内容が変わり得る固定ファイル名に対して長期immutableキャッシュは設定していません。Cloudflare Pagesがコンテンツ圧縮を処理するため、`_headers`でContent-Encodingを強制していません。

## 検証範囲

ご提示の監査項目に対応する実装と本番検証を実施しました。ただし、LLMO監査ツールそのものの再実行・再採点は行っていません。点数の改善幅、検索順位、AI回答への採用を保証するものではありません。また、iOS SafariやAndroid Chromeの実機網羅試験、長時間再生試験、DRMの不正視聴耐性試験はこの記録の対象外です。
