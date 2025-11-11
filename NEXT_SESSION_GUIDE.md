# 次回セッション開始ガイド

## 📅 前回完了内容（2025-11-11）

### 実装した機能

1. **メンバー別自由記述機能（日報）**
   - 日報画面で各メンバーが個別に「その他の活動」を記入可能
   - チーム全体表示時：全メンバーの入力欄を一覧表示
   - 個人表示時：選択メンバーの入力欄のみ表示
   - localStorage で自動保存（キー形式: `daily_report_notes_${日付}_${メンバー名}`）
   - 日報出力時に各メンバーの自由記述が自動的に含まれる

2. **検索UI改善**
   - あいまい検索をデフォルトで有効化
   - 「完了済みを含む」をチェックボックスからトグルボタンに変更
   - あいまい検索のオンオフボタンを削除（常時有効）

### 変更したファイル

- `src/components/views/DailyReportView.jsx` - メンバー別自由記述機能
- `src/components/search/GlobalSearch.jsx` - 検索UI改善

### デプロイ状況

✅ コミット完了: `4a0b06f`
✅ GitHub にプッシュ済み
⚠️ Vercel への自動デプロイは数分かかる場合があります

---

## 🔄 次回セッション開始手順

### 1. バックアップ作成（必須）

次回作業開始時に必ずバックアップを作成してください：

```bash
# プロジェクトディレクトリに移動
cd "C:\Users\kame\Downloads\タスク管理システム＿株式会社イケメン"

# 現在のブランチとコミット状況を確認
git status
git log -1 --oneline

# バックアップブランチを作成（日付を含める）
git branch backup-2025-11-XX

# または、ディレクトリ全体をコピー
# （Windowsエクスプローラーで手動コピー推奨）
```

### 2. 最新コードの取得

```bash
# リモートの最新状態を取得
git fetch

# ローカルを最新に更新
git pull origin main

# 依存関係が更新されている場合
npm install
```

### 3. ローカル開発サーバー起動

```bash
# 開発サーバー起動
npm run dev

# ブラウザで確認
# http://localhost:3000 (または 3001, 3002 など)
```

### 4. 本番環境の確認

Vercel デプロイURL:
```
https://taskmanagement-j8xhjfr29-ikemenltds-projects.vercel.app
```

---

## 📋 保留中のタスク・改善案

現在保留中のタスクや検討事項はありません。

---

## 🛠️ 技術情報

### 主要な技術スタック

- **フロントエンド**: React (Vite)
- **データベース**: Supabase (PostgreSQL)
- **ストレージ**: Supabase Storage
- **デプロイ**: Vercel
- **状態管理**: React Context API
- **スタイリング**: Tailwind CSS

### 重要なファイルパス

```
src/
├── components/
│   ├── views/
│   │   ├── DailyReportView.jsx     # 日報画面
│   │   ├── TimelineView.jsx        # タイムライン（プロジェクト一覧）
│   │   ├── GanttView.jsx           # ガントチャート
│   │   └── CalendarView.jsx        # カレンダー
│   ├── search/
│   │   └── GlobalSearch.jsx        # グローバル検索
│   └── modals/
│       └── TaskDetailModal.jsx     # タスク詳細モーダル
├── utils/
│   ├── fileStorageUtils.js         # ファイルアップロード
│   ├── searchUtils.js              # 検索機能
│   └── lineMessagingApiUtils.js    # LINE通知
└── contexts/
    └── AuthContext.js              # 認証
```

### データベーススキーマ

主要テーブル:
- `projects` - プロジェクト情報
- `tasks` - タスク情報（attachments カラム含む）
- `routine_tasks` - ルーティンタスク
- `routine_completions` - ルーティン完了記録
- `team_members` - チームメンバー
- `line_settings` - LINE設定

### localStorage の使用状況

```javascript
// 日報の自由記述（メンバー別）
localStorage.setItem(`daily_report_notes_${日付}_${メンバー名}`, 記述内容)

// 検索履歴
localStorage.setItem('search_history', JSON.stringify(履歴配列))

// 保存済み検索
localStorage.setItem('saved_searches', JSON.stringify(検索配列))
```

---

## 🔍 既知の問題・制限事項

### 現在の既知問題

なし

### 過去に解決した問題

1. ✅ 日本語ファイル名のアップロード
   - 解決策: ASCII安全なファイル名生成、元の名前はメタデータに保存

2. ✅ ファイルダウンロードが新規タブで開く
   - 解決策: Supabase Storage の `download()` メソッドで Blob 取得

3. ✅ プロジェクト一覧で優先度UIが縦長になる
   - 解決策: 優先度バッジを編集/削除ボタンの下に配置

---

## 💡 今後の改善アイデア

### 機能追加の候補

1. **ファイル添付の拡張**
   - プレビュー機能（画像・PDF）
   - 複数ファイル一括アップロード
   - ファイルサイズ制限の実装

2. **日報機能の拡張**
   - 週報・月報の自動生成
   - グラフ・チャートの追加
   - PDF エクスポート

3. **検索機能の拡張**
   - フィルタ保存機能
   - 高度な検索条件（日付範囲、ステータスなど）
   - 検索結果のエクスポート

4. **通知機能**
   - タスク期限のリマインダー
   - メンション機能
   - メール通知

### パフォーマンス改善

- 大量タスクの仮想スクロール
- 画像の遅延読み込み
- キャッシュ戦略の最適化

---

## 📞 サポート情報

### トラブルシューティング

**ローカルサーバーが起動しない**
```bash
# ポートが使用中の場合
npm run dev
# 別のポート（3001, 3002など）で自動起動します
```

**Supabase 接続エラー**
```bash
# .env ファイルを確認
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**ビルドエラー**
```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### 重要なコマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド（本番用）
npm run build

# プレビュー（ビルド後の確認）
npm run preview

# Gitコミット
git add .
git commit -m "コミットメッセージ"
git push

# ブランチ作成
git checkout -b feature/新機能名
```

---

## 📝 作業ログ記録テンプレート

次回作業時は以下の形式で記録することを推奨：

```markdown
## 作業日: 2025-XX-XX

### 実装内容
- [ ] タスク1
- [ ] タスク2

### 変更ファイル
- ファイルパス1 - 変更内容
- ファイルパス2 - 変更内容

### 動作確認
- [ ] ローカル環境
- [ ] 本番環境

### 次回対応予定
- 対応予定1
- 対応予定2
```

---

**最終更新**: 2025-11-11
**作成者**: Claude Code
