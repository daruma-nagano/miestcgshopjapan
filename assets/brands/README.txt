公式ブランドロゴ
================

現在このフォルダには、ご提供いただいた公式ロゴを配置済みです。

  instagram.webp   256x256  白背景（ロゴ本体は無加工）
  x.webp           256x256  透過・中央配置（クリアスペース確保のため余白を追加）
  whatnot.webp     256x256  白背景（ロゴ本体は無加工）

行った処理は「周囲の余白のトリミング」「正方形キャンバスへの中央配置」
「表示サイズに合わせたリサイズ」「WebP への変換」のみです。
マークの形・色・比率には手を加えていません。

■ 差し替える場合

  同じ名前でこのフォルダに置き換えるだけです。
  拡張子は svg / png / webp / jpg のいずれでも構いません
  （script.js が順に探して、見つかったものを使います）。
  HTML の編集は不要です。

■ 表示のされ方

  トップページ New Arrivals の各カード右下に、白い角丸バッジとして表示されます。
  ロゴ自体には枠線や加工を加えず、背景の白い板の上に置いています。

■ 補助スクリプト

  公式サイトから取り直したい場合は、リポジトリのルートで下記を実行してください。
  X は自動取得、Instagram と Whatnot は公式ページを開いて手動ダウンロードになります。

    powershell -ExecutionPolicy Bypass -File scripts\Get-BrandLogos.ps1

■ 注意

  ロゴは各社の商標です。色の変更・変形・他図形との合成など、
  各社のブランドガイドラインで禁止されている加工は行わないでください。
  X は「いかなる改変も禁止」と明記しています。

  入手先（公式）
    Instagram : https://www.meta.com/brand/resources/instagram/instagram-brand/
    X         : https://about.x.com/en/who-we-are/brand-toolkit
    Whatnot   : https://sites.google.com/whatnot.com/whatnot-brand-guidelines/assets
