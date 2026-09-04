<#
.SYNOPSIS
    SNS の公式ブランドロゴを assets\brands\ に配置する補助スクリプト

.DESCRIPTION
    X のロゴは公式サイトが ZIP を直リンクで公開しているため自動取得します。
    Instagram と Whatnot は、ダウンロード前に利用規約への同意（Meta）や
    Google アカウントでのサインイン（Whatnot）が必要なため自動取得できません。
    このスクリプトは該当ページをブラウザで開き、手元にダウンロードされた
    ZIP や画像を assets\brands\_downloads\ から拾って、展開・選択・リネームまでを行います。

.EXAMPLE
    py 不要。リポジトリのルートで:
        powershell -ExecutionPolicy Bypass -File scripts\Get-BrandLogos.ps1

.NOTES
    ロゴは各社の商標です。必ず公式配布物を使い、色の変更・変形・他図形との合成など、
    各社のブランドガイドラインで禁止されている加工は行わないでください。
#>

[CmdletBinding()]
param(
    [string]$RepoRoot = (Split-Path -Parent $PSScriptRoot),
    [switch]$SkipBrowser
)

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'

$BrandsDir    = Join-Path $RepoRoot 'assets\brands'
$DownloadsDir = Join-Path $BrandsDir '_downloads'
$ExtractDir   = Join-Path $DownloadsDir 'extracted'

$Pages = @{
    instagram = 'https://www.meta.com/brand/resources/instagram/instagram-brand/'
    whatnot   = 'https://sites.google.com/whatnot.com/whatnot-brand-guidelines/assets'
    x         = 'https://about.x.com/en/who-we-are/brand-toolkit'
}
$XLogoZip = 'https://about.x.com/content/dam/about-twitter/x/brand-toolkit/x-logo.zip'

$ImageExt = @('.svg', '.png', '.webp', '.jpg', '.jpeg')

function Write-Step   { param($m) Write-Host "`n== $m" -ForegroundColor Cyan }
function Write-Ok     { param($m) Write-Host "   $m" -ForegroundColor Green }
function Write-Warn2  { param($m) Write-Host "   $m" -ForegroundColor Yellow }
function Write-Info   { param($m) Write-Host "   $m" -ForegroundColor Gray }

# ---------------------------------------------------------------- 事前確認
if (-not (Test-Path (Join-Path $RepoRoot 'index.html'))) {
    Write-Host "index.html が見つかりません: $RepoRoot" -ForegroundColor Red
    Write-Host "リポジトリのルートで実行するか、-RepoRoot でパスを指定してください。" -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force -Path $BrandsDir, $DownloadsDir, $ExtractDir | Out-Null
Write-Step "作業フォルダ"
Write-Info "配置先   : $BrandsDir"
Write-Info "受け取り : $DownloadsDir"

# ---------------------------------------------------------------- X を自動取得
Write-Step "X のロゴを公式サイトから取得します"
$xZip = Join-Path $DownloadsDir 'x-logo.zip'
try {
    Invoke-WebRequest -Uri $XLogoZip -OutFile $xZip -UseBasicParsing -TimeoutSec 60
    Write-Ok ("取得しました: x-logo.zip ({0:N0} KB)" -f ((Get-Item $xZip).Length / 1KB))
}
catch {
    Write-Warn2 "自動取得できませんでした: $($_.Exception.Message)"
    Write-Warn2 "X のブランドツールキットを手動で開いて、ZIP を _downloads に置いてください。"
    if (-not $SkipBrowser) { Start-Process $Pages.x }
}

# ---------------------------------------------------------------- 手動が必要なもの
Write-Step "Instagram と Whatnot は手動ダウンロードが必要です"
Write-Info "Instagram : 規約への同意チェックが必要なため、自動取得できません"
Write-Info "Whatnot   : Google アカウントでのサインインが必要なため、自動取得できません"
Write-Host ""
Write-Info "ブラウザで開くページからロゴをダウンロードし、"
Write-Info "ZIP でも画像単体でも構わないので、次のフォルダに置いてください:"
Write-Host "     $DownloadsDir" -ForegroundColor White

if (-not $SkipBrowser) {
    Start-Process $Pages.instagram
    Start-Process $Pages.whatnot
    Write-Ok "2ページをブラウザで開きました"
}

Write-Host ""
Write-Host "   置き終えたら Enter を押してください（中断は Ctrl+C）" -ForegroundColor White -NoNewline
[void](Read-Host)

# ---------------------------------------------------------------- ZIP を展開
Write-Step "ZIP を展開します"
$zips = Get-ChildItem -Path $DownloadsDir -Filter *.zip -File -ErrorAction SilentlyContinue
if ($zips) {
    foreach ($z in $zips) {
        $dest = Join-Path $ExtractDir $z.BaseName
        if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
        try {
            Expand-Archive -Path $z.FullName -DestinationPath $dest -Force
            Write-Ok "$($z.Name) を展開しました"
        }
        catch {
            Write-Warn2 "$($z.Name) を展開できませんでした: $($_.Exception.Message)"
        }
    }
}
else {
    Write-Info "ZIP はありませんでした（画像を直接置いた場合はこのままで問題ありません）"
}

# ---------------------------------------------------------------- 候補の収集と採点
function Get-SvgSize {
    param([string]$Path)
    try {
        $head = Get-Content -Path $Path -TotalCount 20 -ErrorAction Stop -Encoding UTF8
        $text = ($head -join ' ')
        if ($text -match 'viewBox\s*=\s*"[\d.\-]+\s+[\d.\-]+\s+([\d.]+)\s+([\d.]+)"') {
            return @{ W = [double]$Matches[1]; H = [double]$Matches[2] }
        }
    }
    catch { }
    return $null
}

function Get-RasterSize {
    param([string]$Path)
    try {
        Add-Type -AssemblyName System.Drawing -ErrorAction Stop
        $img = [System.Drawing.Image]::FromFile($Path)
        $size = @{ W = [double]$img.Width; H = [double]$img.Height }
        $img.Dispose()
        return $size
    }
    catch { }
    return $null
}

function Get-Candidates {
    param([string]$Brand)

    $all = Get-ChildItem -Path $DownloadsDir -Recurse -File -ErrorAction SilentlyContinue |
           Where-Object { $ImageExt -contains $_.Extension.ToLower() }

    $results = @()
    foreach ($f in $all) {
        $full = $f.FullName.ToLower()
        # ブランド名がパスに含まれるものを優先。X は 1文字なのでファイル名の一致条件を緩める
        $matchesBrand = switch ($Brand) {
            'x'         { $full -match '[\\/]x[-_.]' -or $full -match 'x-logo' -or $full -match 'twitter' }
            default     { $full -match $Brand }
        }
        if (-not $matchesBrand) { continue }

        $score = 0
        $name  = $f.Name.ToLower()

        if ($name -match 'glyph|icon|app|mark|symbol|badge') { $score += 40 }
        if ($name -match 'wordmark|lockup|horizontal|wide|type') { $score -= 30 }
        if ($f.Extension -ieq '.svg') { $score += 25 }
        if ($name -match 'black|primary|color|colour|gradient') { $score += 10 }
        if ($name -match 'white|reverse|mono') { $score += 3 }

        $size = if ($f.Extension -ieq '.svg') { Get-SvgSize $f.FullName } else { Get-RasterSize $f.FullName }
        $dim  = '-'
        if ($size -and $size.W -gt 0 -and $size.H -gt 0) {
            $dim = "$([int]$size.W)x$([int]$size.H)"
            $ratio = $size.W / $size.H
            if ($ratio -gt 0.85 -and $ratio -lt 1.18) { $score += 45 }   # 正方形＝アイコン版
            else { $score -= 25 }
        }

        $results += [pscustomobject]@{
            Score = $score
            Name  = $f.Name
            Dim   = $dim
            Path  = $f.FullName
        }
    }
    return $results | Sort-Object -Property Score -Descending
}

function Install-Logo {
    param([string]$Brand)

    Write-Step "$Brand のロゴを選びます"
    $cands = @(Get-Candidates -Brand $Brand)

    if ($cands.Count -eq 0) {
        Write-Warn2 "候補が見つかりませんでした。ファイル名に '$Brand' を含む画像を _downloads に置いてください。"
        return $false
    }

    $top = [Math]::Min($cands.Count, 12)
    for ($i = 0; $i -lt $top; $i++) {
        $c = $cands[$i]
        $mark = if ($i -eq 0) { '>' } else { ' ' }
        Write-Host ("  {0} [{1,2}] {2,-46} {3,-12} score {4}" -f $mark, ($i + 1), $c.Name, $c.Dim, $c.Score)
    }
    if ($cands.Count -gt $top) { Write-Info "... 他 $($cands.Count - $top) 件" }

    Write-Host ""
    Write-Host "   番号を入力（Enter で 1 番、s でスキップ）: " -ForegroundColor White -NoNewline
    $answer = Read-Host
    if ($answer -match '^\s*[sS]\s*$') { Write-Info "スキップしました"; return $false }
    $index = 0
    if ($answer -match '^\s*(\d+)\s*$') { $index = [int]$Matches[1] - 1 }
    if ($index -lt 0 -or $index -ge $cands.Count) {
        Write-Warn2 "番号が範囲外です。スキップしました。"
        return $false
    }

    $chosen = $cands[$index]
    $dest   = Join-Path $BrandsDir ($Brand + $chosen.Path.Substring($chosen.Path.LastIndexOf('.')).ToLower())

    Get-ChildItem -Path $BrandsDir -Filter "$Brand.*" -File -ErrorAction SilentlyContinue |
        Where-Object { $ImageExt -contains $_.Extension.ToLower() } |
        Remove-Item -Force

    Copy-Item -Path $chosen.Path -Destination $dest -Force
    Write-Ok "配置しました: assets\brands\$(Split-Path $dest -Leaf)  <- $($chosen.Name)"
    return $true
}

$placed = 0
foreach ($brand in @('instagram', 'x', 'whatnot')) {
    if (Install-Logo -Brand $brand) { $placed++ }
}

# ---------------------------------------------------------------- 結果
Write-Step "結果"
$final = Get-ChildItem -Path $BrandsDir -File -ErrorAction SilentlyContinue |
         Where-Object { $ImageExt -contains $_.Extension.ToLower() }

if ($final) {
    foreach ($f in $final) {
        Write-Ok ("{0,-18} {1,8:N0} KB" -f $f.Name, ($f.Length / 1KB))
    }
}
else {
    Write-Warn2 "配置されたロゴはありません"
}

Write-Host ""
Write-Info "確認   : index.html をブラウザで開き、New Arrivals の各カード右下を見てください"
Write-Info "後始末 : $DownloadsDir は消して構いません"
Write-Info "注意   : ロゴは各社の商標です。バッジ枠に載せた状態が各社のガイドライン"
Write-Info "         （余白・背景色・改変禁止など）に反していないか確認してください"
Write-Host ""
