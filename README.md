# Gumlet Japan Guide & Showcase

ジュガード株式会社が運営する日本向けGumlet導入ガイドです。HTML・CSS・JavaScriptのみで構成した1ページの静的サイトです。

## 公開・デプロイ

| 設定 | 値 |
|---|---|
| 本番URL | https://gumlet-japan-guide.pages.dev/ |
| GitHub | https://github.com/jugaad-dax/gumlet-japan-guide |
| 本番ブランチ | `main` |
| ホスティング | Cloudflare Pages（GitHub連携） |
| Build command | 空欄（静的ファイルのためビルド不要） |
| Output directory | `/` |

`main`へのプッシュによりCloudflare Pagesの本番デプロイが起動します。フレームワークやサーバー側ランタイムは不要です。公開前のHTML検証は`npx --yes html-validate index.html`、差分検査は`git diff --check`で実行できます。

## コンテンツ・実装

ページには比較表、3件のGumlet埋め込み動画、WebPの解説画像、著者情報、FAQとJSON-LDを掲載しています。FAQを変更する際は表示内容とFAQPageの両方を更新し、公開日・更新日もtime要素とJSON-LDで一致させてください。画像はAI生成の概念図であり、製品画面や実測データではありません。

アフィリエイトCTAのURLは`https://www.gumlet.com/?fpr=daisuke-okamoto-0d1593`です。外部CTAには`target="_blank" rel="noopener noreferrer"`を付けています。限定特典は運営者が提供した情報であり、残数や適用状況の自動取得機能はありません。条件変更時は表示を更新してください。

## キャッシュ・セキュリティ

`_headers`にHSTS、再検証型のCache-Control、nosniff、Gumletプレイヤーを許可するCSPなどを定義しています。CSS/JavaScriptには`?v=`のバージョンが付いているため、大きな更新時は値も更新してください。圧縮はCloudflareの配信機能に任せ、手動でContent-Encodingを付けないでください。

## 検証記録

本番でのレスポンシブ表示、動画コンテナ、操作、HTTPヘッダー、配信ファイルの一致検証と対象外事項は[検証記録](./VALIDATION.md)に記載しています。LLMO監査ツールの点数や検索順位を保証するものではありません。
