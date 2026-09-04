#!/usr/bin/env python3
"""Instagram 投稿サムネイルの更新スクリプト

使い方
------
1. Instagram の投稿から画像を保存し、ファイル名を「投稿の短縮コード」にする。
   投稿URLが https://www.instagram.com/p/DAbc123XyZ/ なら → DAbc123XyZ.jpg
2. その画像を assets/instagram/_inbox/ に入れる（複数まとめて可）。
   キャプションを付けたい場合は DAbc123XyZ.txt を同じ場所に置く（1行だけ）。
3. リポジトリのルートで実行:  py scripts/add-instagram-posts.py
4. 生成された WebP とデータファイルをコミットする。

やること
--------
- _inbox の画像を 640px 幅の WebP に変換して assets/instagram/ に保存
- assets/data/instagram-posts.js を新しい順（最大6件）で作り直す
- 処理済みの元ファイルは _done/ に移動（削除はしない）
"""

import json
import shutil
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "assets" / "instagram" / "_inbox"
DONE = ROOT / "assets" / "instagram" / "_done"
OUT_DIR = ROOT / "assets" / "instagram"
DATA_PATH = ROOT / "assets" / "data" / "instagram-posts.js"

MAX_POSTS = 6
WIDTH = 640
SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def convert(src: Path, dst: Path) -> bool:
    """640px 幅の WebP に変換する。Pillow が無ければそのままコピーする。"""
    try:
        from PIL import Image
    except ImportError:
        shutil.copy2(src, dst.with_suffix(src.suffix))
        size_kb = src.stat().st_size // 1024
        print(f"  ! Pillow が無いため変換せずコピーしました（{size_kb}KB）")
        print("    軽量化する場合: py -m pip install pillow")
        return False

    with Image.open(src) as im:
        im = im.convert("RGB")
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        im.save(dst, "WEBP", quality=80, method=6)
    return True


def main() -> int:
    if not INBOX.exists():
        print(f"見つかりません: {INBOX}")
        return 1

    DONE.mkdir(parents=True, exist_ok=True)
    incoming = sorted(
        (p for p in INBOX.iterdir() if p.is_file() and p.suffix.lower() in SUFFIXES),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    if not incoming:
        print(f"_inbox に画像がありません: {INBOX}")
        print("投稿の短縮コードをファイル名にした画像を入れてから、もう一度実行してください。")
        return 0

    print(f"{len(incoming)} 件を処理します\n")
    added = []
    for src in incoming:
        code = src.stem
        if not code.replace("-", "").replace("_", "").isalnum():
            print(f"  スキップ {src.name}: ファイル名が投稿の短縮コードになっていません")
            continue

        dst = OUT_DIR / f"{code}.webp"
        print(f"  {src.name} → assets/instagram/{dst.name}")
        converted = convert(src, dst)

        caption_file = src.with_suffix(".txt")
        alt = "Instagram post"
        if caption_file.exists():
            alt = caption_file.read_text(encoding="utf-8").strip().splitlines()[0][:120]
            caption_file.replace(DONE / caption_file.name)

        added.append({
            "image": f"assets/instagram/{dst.name if converted else code + src.suffix}",
            "url": f"https://www.instagram.com/p/{code}/",
            "alt": alt,
        })
        src.replace(DONE / src.name)

    if not added:
        print("\n追加できる投稿がありませんでした。")
        return 1

    existing = []
    if DATA_PATH.exists():
        raw = DATA_PATH.read_text(encoding="utf-8")
        try:
            body = raw[raw.index("{"):raw.rindex("}") + 1]
            existing = json.loads(body).get("posts", [])
        except (ValueError, json.JSONDecodeError):
            print("\n! 既存のデータが読めなかったため、新規に作り直します")

    seen = set()
    merged = []
    for post in added + existing:
        if post["url"] in seen:
            continue
        seen.add(post["url"])
        merged.append(post)
    merged = merged[:MAX_POSTS]

    payload = {
        "account": "mie_pcg_japancard",
        "profileUrl": "https://www.instagram.com/mie_pcg_japancard/",
        "updated": date.today().isoformat(),
        "posts": merged,
    }
    header = (
        "/* トップページ Instagram カードのサムネイル。\n"
        "   scripts/add-instagram-posts.py で更新する。手で編集しても構わない。\n"
        "   posts を空配列にすると、サムネイル枠ごと非表示になる。 */\n"
    )
    DATA_PATH.write_text(
        header + "window.NEXUS_INSTAGRAM_POSTS = "
        + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )

    print(f"\n完了: {len(added)} 件追加、掲載は新しい順に {len(merged)} 件")
    print(f"更新: {DATA_PATH.relative_to(ROOT)}")
    print("\n次の手順: index.html をブラウザで開いて表示を確認し、変更をコミットしてください。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
