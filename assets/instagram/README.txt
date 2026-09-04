Instagram 投稿サムネイルの置き場所
==================================

トップページの Instagram カードに、直近の投稿を最大6件表示できます。
データが空の間はサムネイル枠ごと非表示になるので、急ぎでなければ空のままで問題ありません。

■ かんたんな手順（推奨）

  1. Instagram の投稿画像を保存し、ファイル名を「投稿の短縮コード」にする
       投稿URL  https://www.instagram.com/p/DAbc123XyZ/
       ファイル名  DAbc123XyZ.jpg
     （キャプションを付ける場合は DAbc123XyZ.txt を同じ場所に置く。1行だけ）

  2. _inbox/ フォルダに入れる（複数まとめて可）

  3. リポジトリのルートでコマンドを実行
       py scripts\add-instagram-posts.py

  4. 生成された .webp と assets/data/instagram-posts.js をコミット

  変換には Pillow を使います。入っていない場合は下記でインストールしてください。
       py -m pip install pillow
  入っていなくてもスクリプトは動きますが、画像が軽量化されません。

■ 手で編集する場合

  assets/data/instagram-posts.js の posts に直接書いても構いません。

    { "image": "assets/instagram/DAbc123XyZ.webp",
      "url": "https://www.instagram.com/p/DAbc123XyZ/",
      "alt": "入荷したBOXの写真" }

  - image はこのリポジトリ内のパスのみ有効（外部URLは無視されます）
  - url は https://instagram.com/ で始まるもののみ有効
  - 条件を満たさない項目は表示されずスキップされます
  - 表示は先頭から最大6件

■ 画像について

  自分で撮影した写真、または自社アカウントに投稿した画像を使ってください。
  スクリプトは幅640pxのWebPに変換します（1枚あたり50KB前後）。

■ フォルダ

  _inbox/  これから処理する画像を入れる場所
  _done/   処理済みの元ファイルの退避先（不要になったら削除してよい）
