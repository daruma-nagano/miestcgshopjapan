# Nexus Trading — miestcgshopjapan

Nexus Trading Co., Ltd. が運営するトレーディングカードショップ **Daruma Kaitori Nagano**（長野県松本市）の、海外向け英語ランディングページ。

- 公開URL: https://daruma-nagano.github.io/miestcgshopjapan/
- 構成: 静的HTML（ビルド工程なし）。GitHub Pages で配信

## ファイル

| ファイル | 役割 |
|---|---|
| `index.html` | 本体。1ページ構成 |
| `privacy.html` | プライバシー・クッキーに関する説明 |
| `404.html` | GitHub Pages 用のエラーページ |
| `styles.css` | 全スタイル |
| `script.js` | メニュー、カードカルーセル、営業状態表示 |
| `price-list/` | 価格表ページ（データ・スタイル・商品画像を同梱） |
| `scripts/` | 更新用スクリプト（Instagram サムネイル / ブランドロゴ配置） |
| `assets/` | 画像（すべて WebP） |
| `favicon.svg` / `robots.txt` / `sitemap.xml` | メタ関連 |

## セクション構成

`#home` → Connect（X / Google Maps / SNS3枚）→ `#new-arrivals` → `#how-to-buy`（`#shipping` を内包）→ `#faq` → Why shop with us → `#contact`

別ページ: `price-list/`（価格表）、`privacy.html`、`404.html`

## 公式ブランドロゴ

チャネルカードのヘッダーには、当サイトで描き起こしたイラストを使っている。各社の公式ロゴを重ねたい場合は、ブランドガイドラインに従って公式配布ファイルを取得し、下記に置く。

| ファイル | 入手先（公式） |
|---|---|
| `assets/brands/instagram.*` | https://www.meta.com/brand/resources/instagram/instagram-brand/ |
| `assets/brands/x.*` | https://about.x.com/en/who-we-are/brand-toolkit |
| `assets/brands/whatnot.*` | https://sites.google.com/whatnot.com/whatnot-brand-guidelines/assets |

### 補助スクリプト

```
powershell -ExecutionPolicy Bypass -File scripts\Get-BrandLogos.ps1
```

X のロゴは公式サイトが ZIP を直リンク公開しているため自動取得する。Instagram は規約同意のチェックボックス、Whatnot は Google サインインがダウンロード前に必要なため自動取得できない。スクリプトは該当ページをブラウザで開き、`assets/brands/_downloads/` に置かれた ZIP や画像を展開し、正方形のアイコン版を優先して候補を並べ、選んだものを `instagram.*` / `x.*` / `whatnot.*` にリネームして配置する。

拡張子は `svg` / `png` / `webp` / `jpg` のいずれでもよい。`script.js` が順に試し、見つかったファイルをカード右下のバッジとして表示する。どれも無ければ `<img>` ごと取り除くのでレイアウトは変わらない。**ダウンロードしたファイルの名前を上表のとおりに変えるだけで、HTML を編集する必要はない。**第三者サイトが再配布しているロゴは使わず、必ず公式から取得すること。色の変更・変形・他図形との合成は各社ガイドラインで禁止されている場合がある。

## Instagram 投稿サムネイルの更新（手動）

トップページの Instagram カードに、直近の投稿を最大6件表示できる。データが空の間はサムネイル枠ごと非表示になるため、更新をさぼっても見た目は崩れない。

### 手順

1. Instagram の投稿画像を保存し、**ファイル名を投稿の短縮コードにする**
   投稿URL `https://www.instagram.com/p/DAbc123XyZ/` → `DAbc123XyZ.jpg`
   （キャプションを付けたい場合は `DAbc123XyZ.txt` を同じ場所に。1行だけ）
2. `assets/instagram/_inbox/` に入れる（複数まとめて可）
3. リポジトリのルートで `py scripts\add-instagram-posts.py`
4. 生成された `.webp` と `assets/data/instagram-posts.js` をコミット

スクリプトは画像を幅640pxの WebP（1枚50KB前後）に変換し、データファイルを新しい順に最大6件で作り直す。処理済みの元ファイルは `_done/` に退避され、削除はされない。変換には Pillow を使う（`py -m pip install pillow`）。入っていなくても動くが画像が軽量化されない。

### 手で編集する場合

`assets/data/instagram-posts.js` の `posts` に直接書いてもよい。

```js
{ "image": "assets/instagram/DAbc123XyZ.webp",
  "url": "https://www.instagram.com/p/DAbc123XyZ/",
  "alt": "入荷したBOXの写真" }
```

- `image` はリポジトリ内のパスのみ有効（外部URLは無視される）
- `url` は `https://instagram.com/` で始まるもののみ有効
- 条件を満たさない項目は表示されずスキップされる

**JSON ではなく JS ファイルで持っている理由。** `fetch()` は `file://` で開いたときに読めないため、ローカルで `index.html` をダブルクリックして確認できなくなる。`<script src>` なら両方で動く。価格表データ（`price-list-data.js`）も同じ理由でこの形式。

### 自動取得について

GitHub Pages は静的配信なので、リポジトリ自体が Instagram の投稿を取りに行くことはできない。自動化する場合は GitHub Actions で定期実行し、Instagram Graph API の結果をこのデータファイルと画像としてコミットする形になる。API 自体は無料だが、プロアカウント・Facebookページ連携・Meta アプリ審査・アクセストークンの定期更新が必要。姉妹サイト daruma-nagano には X 向けの同種スクリプト（`scripts/update_x_posts.py`）が残っているが運用は止めている。

## 価格表の更新

`price-list/price-list-data.js` の `window.DARUMA_PRICE_GROUPS` を差し替える。画像は `price-list/assets/price-images/` に WebP で置き、データ側のパスを合わせること。更新日の表示は `price-list/index.html` の `.pl-updated` を手で書き換える。

## フォント

Google Fonts の3書体を使用。CSS変数で切り替える。

- `--font-display` : Luckiest Guy — 見出し・ナビ・ボタン
- `--font-body` : Nunito — 本文
- `--font-hand` : Gochi Hand — 「Drag to spin」など手書き注記

## 画像の追加・差し替え

すべて WebP。追加する場合は表示幅の約2倍にリサイズしてから変換し、`<img>` に `width` / `height` / `loading` / `decoding` を必ず付与すること（レイアウトシフト防止のため）。

## 記載内容の方針

送料・配送日数・支払方法は変動するため固定値を掲載せず、「注文ごとに見積り・問い合わせ」と案内している。値を確定して掲載する場合は `#shipping` の `.fact-list` と `#faq` の該当項目を同時に更新すること。

## 変更履歴

### 2026-09-03 (10) チャネルカードを公式ロゴのみに
- AI で描き起こしたヘッダーイラスト4点（`assets/icons/`）を削除。各社の公式ロゴと実際の商品写真だけを使う構成に変更
- 価格表カードは価格表の商品画像（`pok-mon-black-bolt.webp`）を全体表示
- タグの配色をロゴから抽出した各社の色に統一
  - Instagram: `#7b19fe → #ee01ba → #fc3360 → #ffa207`（ロゴのグラデーションから採取）
  - X: `#000000`
  - Whatnot: 地 `#282028` / 文字 `#f8e010`
  - Price List: サイトのアクセント `--pink`（自社ブランドのため）
- ロゴの読み込みに失敗した場合は `<img>` ではなくパネルごと取り除くよう変更（主画像になったため）

### 2026-09-03 (9) 公式ロゴを配置
- ご提供いただいた Instagram / X / Whatnot の公式ロゴを `assets/brands/` に配置（各 256x256 WebP、2〜9KB）
- 処理は余白トリミング・正方形化・リサイズ・WebP 変換のみ。マークの形・色・比率は無加工
- バッジの背景をクリーム(`--paper`)から白に変更。Instagram と Whatnot のロゴが白背景を持つため、地色を合わせて継ぎ目が出ないようにした
- X のロゴは透過のまま、クリアスペース確保のためキャンバスの58%に収めて中央配置

### 2026-09-03 (8) ロゴ配置スクリプト
- `scripts/Get-BrandLogos.ps1` を追加。X の公式 ZIP を自動取得し、Instagram / Whatnot は公式ページを開いたうえで、ダウンロード済みファイルの展開・候補提示・リネーム配置を行う

### 2026-09-03 (7) ブランドロゴの拡張子フォールバック
- `assets/brands/` のロゴを svg / png / webp / jpg の順に自動探索する方式に変更。ダウンロードしたファイルをリネームして置くだけでよく、HTML の編集が不要になった

### 2026-09-03 (6) 公式ロゴ差し込み / Instagram 手動更新の整備
- チャネルカードに公式ブランドロゴのバッジ枠を追加。`assets/brands/` にファイルを置けば自動表示、無ければ `<img>` ごと除去
- Instagram サムネイルのデータを JSON から JS ファイルへ変更。`fetch()` は `file://` で読めず、ローカル確認ができなくなるため
- 更新スクリプト `scripts/add-instagram-posts.py` を追加。画像を `_inbox/` に入れて実行するだけで WebP 変換とデータ更新が済む

### 2026-09-03 (5) SNS導線の重複解消 / チャネル画像
- Connect セクションと New Arrivals セクションで SNS 導線が二重になっていたため、SNS はチャネル一覧の1箇所に集約
- 旧 Connect を「Visit the shop in Matsumoto」に変更し、地図パネルとレビューパネルの2枚組に。レビューの行数制限を解除して全文表示に
- チャネル一覧を4枚（価格表 / Instagram / X / Whatnot）に再構成（ヘッダー画像は後に公式ロゴへ差し替え）
- Instagram 投稿サムネイルの表示機構を追加（`assets/data/instagram-posts.json`）。データが空の間は枠ごと非表示
- 未使用になった CSS 44ルールを削除

### 2026-09-03 (4) 価格表ページ新設
- `price-list/` を新設。daruma-nagano の英語版価格表データ（125商品・322バリアント）を取り込み、当サイトのデザインで再構成した
- 価格表画像53点を WebP 化・360px にリサイズ（6.69MB → 1.22MB、82%削減）
- ヒーローの主CTAを「See What's In（#new-arrivals）」から「See the Price List（price-list/）」に変更。ナビと Price List カードのリンク先も同ページへ統一
- 絞り込み（カテゴリ／商品種別）、検索、並び替え、カード／コンパクト表示切替は元の実装を流用。画像に loading / width / height を追加し、該当0件時の表示を `hidden` 属性に修正
- サイトは英語のまま。掲載文言の日本語対訳は別資料にまとめた

### 2026-09-03 (3) 炎の見切れ修正
- `fire-ring.webp` / `fire-glow.webp` の透明余白をトリミング（1024x1488 → 948x1007 ほか）。素材の上下に大きな透明領域があり、これが位置合わせを難しくしていた
- 炎をカード周回の中心に `translate(-50%,-50%)` で配置し直し、幅に上限（PC 690px）を設定。ヒーローの高さは画面幅が広がっても固定なので、幅だけが伸びると縦に見切れる構造だった
- カード周回の半径上限を 440/380 → 330/290 に変更。炎が高さで頭打ちになる一方でカードだけが広がり、広い画面で両者が離れてしまうため
- 320〜2560px の全幅で、炎がヒーロー領域からはみ出さないことを確認

### 2026-09-04 (7) X の位置づけを変更 / 郵便番号を掲載
- **New Arrivals から X カードを撤去**。SNS導線を「価格表・Instagram・Whatnot」の3枚に。X は Nexus のチャネルではなく、だるま買取 長野店のアカウントであるため
- 代わりに**店舗パネル（Daruma Kaitori Nagano）に X 導線を新設**。「店頭の入荷やライブ配信の予定を X で告知（主に日本語）」と実態どおりの説明にし、`@kaitorinagano` へのテキストリンクと「The shop on X →」ボタン（公式ロゴ入り・黒）を配置
- 旧 X カードの「Restocks first ／ 入荷情報をいち早く」は、Instagram が主導線である実態と食い違うため削除
- Contact の副ボタンを「DM on X」→「How to Buy」に変更。DM 導線は Instagram のみに
- How to Buy 01・02 の文面からも X を削除
- **郵便番号 390-0815 を掲載**（Contact / privacy.html）。日本郵便のデータで松本市深志＝390-0815 を確認。既存 daruma サイトの 390-0034 は松本市内の別町域で誤り
- privacy.html から、既に撤去済みだった X タイムライン埋め込みの記述と、連絡手段としての X を削除。最終更新日を 2026-09-04 に

### 2026-09-04 (6) daruma 側への反映と、別名重複の追加修正
- daruma-nagano リポジトリ（`daruma-nagano-main.zip`）に、今回の商品追加・商品名修正・画像追加を反映
  - 価格表は GitHub Actions が1日3回 `scripts/update_price_list.py` で再生成しているため、`MANUAL_ALIASES` と `data/image-url-map.json` に反映。データファイルだけの修正では翌日に戻るため
  - 反映後のデータで自動実行を模擬し、商品名・画像とも変化しないこと（冪等）を確認済み
- daruma の別名表から、Nexus 側で見落としていた重複2件を発見し統合
  - `Munikis Zero` ＋ `Nihil Zero` → **Nihil Zero**
  - `Terastal Festival ex` ＋ `Terastal Fest ex` → **Terastal Fest ex**
  - いずれも既に画像が入っていたため、画像URLによる重複検出をすり抜けていた
- daruma 側の実データから、シートで名称未解決だった SM1+ が実在の単一商品と確認できたため `Sun & Moon Enhanced Expansion [SM1+]` として追加
- 両サイトの商品名を統一。**143商品（ポケモン 96 / ワンピース 35 / バルク 12）で完全一致**
- 命名の正は Nexus 側に統一（Matchless Fighters / Full Metal Force / Nihil Zero / Terastal Fest ex / Pokémon Card 151 / Pokémon GO / Super Burst Impact）

### 2026-09-04 (5) 商品画像を84点追加
- 画像URLの出所: シンソク取得DB `data/shinsoku_shopify_sync.db` の `source_items_latest` / `source_items_history` にある `raw_json.img_url1`（履歴27,834行から商品ごとの最新URLを採用）。画像の実体はローカルになく `storage.googleapis.com/shinsoku-tcg-public/` 上にあるため、`YONE\price-images\Get-PriceImages.ps1` で取得してもらい、長辺480pxの WebP に変換（84点で計3.1MB／平均38KB）
- 画像付き商品 53 → **132 点**（残る12点はバルクで、元から画像なし）
- 元画像URLが一致する＝同一商品として、英訳ゆれによる重複 5 組を統合。いずれもDB上で同じ日本語弾名・同じ商品IDであることを確認済み
  - `Champion Road` ＋ `Champion's Road` →「チャンピオンロード」(SM6b)
  - `Full Metal Wall` ＋ `Full Metal Force` →「フルメタルウォール」(SM9b)
  - `Peerless Fighters` ＋ `Matchless Fighters` →「双璧のファイター」(S5a)
  - `Rebellion Crash` ＋ `Rebel Clash` →「反逆クラッシュ」(S2)
  - `Towering Perfection` ＋ `Skyscraping Perfection` →「摩天パーフェクト」(S7D)
- アクセント表記ゆれの重複 2 組（`Pokemon Card 151` / `Pokemon GO`）も `Pokémon …` に統合
- 商品数 149 → **144**（ポケモン 97 / ワンピース 35 / バルク 12）
- G:\マイドライブ 配下は読み取りのみ。書き込み・変更は一切していません

### 2026-09-04 (4) 価格表データを最新シートから再取り込み
- 取り込み元: `G:\マイドライブ\ツール\シンソク取得\exports\price_list_preview.csv`（Google スプレッドシート PRICE LIST の書き出し。読み取りのみ／G配下は一切変更していません）
- 商品数 125 → 149（この後の重複統合で最終 144。ポケモン 97 / ワンピース 35 / バルク 12）
- アクセント表記違いで重複していた `Pokemon Card 151` / `Pokemon GO` を `Pokémon …` に統合（画像は既存分を引き継ぎ、価格は新しい方を採用）
- 新規追加 24 件（ポケモン 18・ワンピース 6）
- 既存 116 件の価格・在庫・更新日をシートの最新値に更新。ページの「Latest update」を 2026-09-04 に変更
- ワンピース 22 件を型番表記から正式タイトル表記へ（例: `OP-16` → `THE TIME OF BATTLE [OP-16]`）
- 日本語名のままだった 15 件を英語表記に。日本限定弾は英語圏の流通名＋日本の型番を併記（`Fever Burst Fighter [XY11]` / `GX Battle Boost [SM4+]` / `Premium Card Collection — Best Selection vol.2` など）
- シート内で商品名が未解決だった「強化拡張パック「サン＆ムーン」(SM1+)」14 行は、商品を特定できないため取り込み対象外
- シート内の重複 5 件は、価格・更新日が新しい方を採用して 1 件に統合
- サイトにあってシートにない `Journey Together` は削除せず据え置き
- 既存の商品画像 53 点はすべて引き継ぎ

### 2026-09-04 (3) 価格表を旧レイアウトへ差し戻し
- ご指摘により、価格表ページを 2026-09-04 の行レイアウトから **元のカード表示に差し戻し**（表示切替は Cards / Compact、リード文・注意書きも旧版に復帰）
- ただし CTA の DM ボタンは Instagram のまま（`primary-button--instagram`）を維持

### 2026-09-04 (2) DM 主導線を Instagram へ
- Contact と価格表ページの主ボタンを「DM on X」→「DM on Instagram」に変更。X は副ボタン（黒）に降格
- Instagram のボタン配色を公式ロゴ画像から採った 4 色（#7b19fe / #ee01ba / #fc3360 / #ffa207）のグラデーションに統一。`--ig-1`〜`--ig-4` として CSS 変数化し、Contact・価格表・チャネルカードで共通利用
- チャネルカードのリンクボタンも各ブランド色に統一（Instagram＝グラデ／X＝黒／Whatnot＝黒地に黄／価格表＝ピンク）。あわせてボタン幅をカード幅に合わせ、はみ出していたのを修正
- Contact のリード文、How to Buy 02、JSON-LD の sameAs、privacy.html の連絡先で Instagram を先に記載

### 2026-09-04 Contact 2カラム化 / 価格表レイアウト刷新
- Contact セクションを左右2カラムに変更。左＝見出しとDMボタン、右＝店舗情報カード（Shop / Phone / Hours / Operated by ＋ Google マップ導線）。980px 以下で1カラムに折り返す
- `.love-note` ステッカーが縦に引き伸ばされていた不具合を修正（HTML の height 属性を CSS の `height: auto` で打ち消し）
- 価格表ページを行レイアウト中心に作り直し
  - 1商品＝1行。CASE / BOX（シュリンク有）/ BOX（シュリンク無）を固定3列に割り当て、全行で価格の桁位置がそろうようにした
  - 表示切替を Cards/Compact から **List（既定）/ Gallery** に変更。125商品中72商品は画像が未登録のため、既定を行表示にして空の枠が並ばないようにした
  - 画像なしの商品はカテゴリ色のイニシャルタイルで代替（Pokémon＝黄／One Piece＝ピンク／Bulk＝黒）
  - Bulk はロット単位がまちまちなため専用の帯で表示。`-` や空欄の価格は ASK として扱う
  - 列見出し（CASE / BOX シュリンク有・無）を一覧上部に固定表示。820px 以下と Gallery 表示、Bulk のみの絞り込み時は非表示
  - 「Before you order」に CASE / BOX / シュリンク有無 と `—` の意味を追記

### 2026-09-03 (2) レビュー反映
- ヒーローのコピー枠を上下端で固定するレイアウトに変更。書体差でCTAが下にはみ出し、Connect セクションと重なる問題を解消（1024〜2560px で 63px 以上の間隔を確保）
- X の公式タイムライン埋め込み（platform.twitter.com/widgets.js）を撤去。読み込みが安定しないため、X で何を投稿しているかを示す静的カードに置き換えた
- Luckiest Guy は小文字が小型大文字になるため、ボタン類を大文字に統一。FAQ の設問のみ可読性優先で Nunito に変更

### 2026-09-03 本番化
- 画像を WebP 化・リサイズし、未使用9ファイルを削除（16.8MB → 1.0MB）
- Google Fonts（Luckiest Guy / Nunito / Gochi Hand）を導入。OS標準フォント依存を解消
- 断リンクだった `#how-to-buy` / `#faq` / `#new-arrivals` の各セクションを新設
- `#shipping` / `#contact` を実体のあるセクションに置き換え
- モック要素を削除（`Nexus Trading Mock` タイトル、ニュースレターの `alert()` 応答）
- Google Maps 枠の固定値（評価・営業状態）を撤去し、実時刻連動の営業状態表示に変更
- favicon / OGP / Twitter Card / canonical / JSON-LD / robots.txt / sitemap.xml / 404 を追加
- 「Drag to spin」とマスコット画像の重なりを解消
- 未使用CSS 24クラス・65ルールを削除
- 特典アイコンを文字グリフからインラインSVGに変更

### 2026-08-05 以前
初期アートワークとレスポンシブ調整。ヒーローの配置は当時の承認済みワイヤーフレームに準拠。
