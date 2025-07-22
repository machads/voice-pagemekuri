# 音声ページナビゲーター Webアプリ開発仕様書

## プロジェクト概要
手が離せない状況でも音声コマンドでWebページを操作できるWebアプリケーション

## 技術スタック
- HTML5
- CSS3
- Vanilla JavaScript（フレームワークなしでシンプルに）
- Web Speech API（音声認識）
- PWA対応（将来のアプリ化を考慮）

## ディレクトリ構造
```
voice-page-navigator/
├── index.html         # メインページ
├── css/
│   └── style.css      # スタイルシート
├── js/
│   └── app.js         # メインロジック
├── images/
│   ├── icon-192.png   # PWA用アイコン
│   └── icon-512.png   # PWA用アイコン
└── manifest.json      # PWA設定
```

## 機能仕様

### MVP機能（最初に実装）
1. URL入力してWebサイトを表示
2. 音声認識ON/OFFボタン
3. 基本音声コマンド
   - 「次」「つぎ」→ 次のページ/セクション
   - 「前」「まえ」「戻る」→ 前のページ
   - 「上」「うえ」→ 上スクロール
   - 「下」「した」→ 下スクロール

### UI設計
```
┌─────────────────────────────────────┐
│ 音声ページナビゲーター               │
│ ┌─────────────────────────────┐     │
│ │ [←][→] URL_____________[開く]│     │
│ └─────────────────────────────┘     │
│ ┌─────────────────────────────┐     │
│ │ 🎤 音声認識OFF 認識結果:      │     │
│ └─────────────────────────────┘     │
├─────────────────────────────────────┤
│                                     │
│         Webサイト表示エリア          │
│              (iframe)               │
│                                     │
└─────────────────────────────────────┘
```

## 実装詳細

### index.html
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>音声ページナビゲーター</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#4285f4">
</head>
<body>
    <header>
        <h1>音声ページナビゲーター</h1>
        
        <!-- URL入力バー -->
        <div class="url-bar">
            <button id="backBtn" class="nav-btn">←</button>
            <button id="forwardBtn" class="nav-btn">→</button>
            <input type="url" id="urlInput" placeholder="URLを入力（例: https://note.com）">
            <button id="goBtn" class="go-btn">開く</button>
        </div>
        
        <!-- 音声認識コントロール -->
        <div class="voice-control">
            <button id="voiceBtn" class="voice-btn">
                <span class="mic-icon">🎤</span>
                <span id="voiceStatus">音声認識OFF</span>
            </button>
            <div id="transcript" class="transcript">認識結果: </div>
        </div>
        
        <!-- 使い方 -->
        <details class="help">
            <summary>使い方</summary>
            <p>音声コマンド: 「次」「前」「上」「下」</p>
        </details>
    </header>
    
    <main>
        <iframe id="contentFrame" src="about:blank"></iframe>
    </main>
    
    <script src="js/app.js"></script>
</body>
</html>
```

### style.css の主要スタイル
- レスポンシブデザイン
- ヘッダー固定
- iframe最大表示
- 音声認識中のアニメーション

### app.js の実装ポイント
- 音声認識の初期化と制御
- iframe内のページ操作
- エラーハンドリング
- 状態管理

### manifest.json（PWA設定）
```json
{
    "name": "音声ページナビゲーター",
    "short_name": "VoiceNav",
    "description": "音声でWebページを操作",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#4285f4",
    "icons": [
        {
            "src": "images/icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "images/icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

## 開発手順

### Step 1: 基本構造の作成（30分）
- HTMLファイル作成
- 基本的なCSS適用
- レイアウト確認

### Step 2: 音声認識実装（1時間）
- Web Speech API実装
- 音声コマンド認識
- デバッグ表示

### Step 3: iframe制御（1時間）
- URL読み込み
- ナビゲーション実装
- エラー処理

### Step 4: UI改善（30分）
- アニメーション追加
- レスポンシブ対応
- 使いやすさ向上

### Step 5: PWA対応（30分）
- manifest.json作成
- Service Worker追加
- オフライン対応

## テスト項目
- 各種ブラウザでの動作確認
- 音声認識の精度テスト
- 様々なWebサイトでの表示テスト
- モバイル端末での動作確認

## 今後の拡張予定
- より多くの音声コマンド
- サイト別の最適化
- 履歴機能
- お気に入り機能