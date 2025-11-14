# 次回セッション開始ガイド

## 📋 プロジェクト概要

**プロジェクト名**: タスク管理システム (taskmanagement)
**現在地**: `C:\Users\kame\Desktop\taskmanagement`

### 🌐 本番環境
- **本番URL**: https://taskmanagement-ruby.vercel.app/
- **GitHubリポジトリ**: https://github.com/IKEMENLTD/taskmanagement
- **データベース**: Supabase (https://supabase.com/dashboard/project/nlqiuvlcxxnusmlhwcqx/)
- **ホスティング**: Vercel

### 📊 最新コミット情報
- **コミットハッシュ**: `ebcc980305f8f49e4c0ab59d6b915f232df71701`
- **コミットメッセージ**: feat: タスクカードで進捗率100%を視覚的に強調表示
- **ブランチ**: main
- **最終デプロイ日**: 2025年11月14日

---

## ✅ 実装済み機能

### 1. 進捗率100%時のUI強調表示
すべてのビューで進捗率が100%に達した際に視覚的フィードバックを提供：

#### TaskDetailModal（タスク詳細モーダル）
- 緑色の枠線と背景（`border-2 border-green-500`, `bg-green-50/bg-green-900`）
- チェックマークアイコン（CheckCircle）
- 「タスク完了！」バッジ
- 関連ファイル: `src/components/modals/TaskDetailModal.jsx`

#### Dashboard（ダッシュボード）
- 緑色の進捗率テキスト
- チェックマーク（✓）の表示
- 関連ファイル: `src/components/Dashboard.jsx` (lines 765-768)

#### GanttChartView（ガントチャート）
- 太字の進捗率表示
- チェックマーク（✓）の表示
- 関連ファイル: `src/components/views/GanttChartView.jsx`

#### TimelineView - プロジェクト一覧
- 緑色のバッジ表示
- 緑色のプログレスバーとリング
- 「プロジェクト完了」バッジ
- プロジェクト詳細モーダルでの緑色統計カード
- 関連ファイル: `src/components/views/TimelineView.jsx` (lines 659-685, 1096-1109)

#### TimelineView - タスクカード
- 緑色の背景と枠線（`bg-green-50 border-2 border-green-500`）
- 緑色のタスク名
- チェックマークアイコン
- 緑色のプログレスバーとリング
- 「完了 (100%)」バッジ
- 関連ファイル: `src/components/views/TimelineView.jsx` (lines 716-838)

### 2. 進捗率入力制限
- 100を超える値を自動的に100にクランプ
- 0未満の値を自動的に0にクランプ
- すべての入力フォームで一貫した動作

実装箇所:
- `TaskDetailModal.jsx` (lines 118-125, 497-503)
- `TimelineView.jsx` (lines 949-954, 1314-1319)

### 3. バグ修正履歴
- ✅ 進捗率バリデーションの追加
- ✅ 日付比較ロジックの確認（文字列形式YYYY-MM-DDで正常動作）
- ✅ 検索機能の確認（最小文字数制限なし）

### 4. 過去に実装された機能
- ✅ メンバー別自由記述機能（日報）
- ✅ 検索UI改善（あいまい検索デフォルト有効）
- ✅ 日本語ファイル名のアップロード対応
- ✅ ファイルダウンロード機能
- ✅ プロジェクト一覧の優先度UI改善

---

## 🛠️ 技術スタック

### フロントエンド
- **ビルドツール**: Vite
- **フレームワーク**: React
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React (CheckCircle等)

### バックエンド・インフラ
- **データベース**: Supabase (PostgreSQL)
- **ストレージ**: Supabase Storage
- **ホスティング**: Vercel
- **バージョン管理**: Git + GitHub
- **状態管理**: React Context API

### 主要ファイル構成
```
taskmanagement/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx           # ダッシュボード画面
│   │   ├── modals/
│   │   │   └── TaskDetailModal.jsx # タスク詳細・編集モーダル
│   │   ├── views/
│   │   │   ├── TimelineView.jsx    # プロジェクト一覧・タスク一覧
│   │   │   ├── GanttChartView.jsx  # ガントチャート
│   │   │   ├── DailyReportView.jsx # 日報画面
│   │   │   └── CalendarView.jsx    # カレンダー
│   │   └── search/
│   │       └── GlobalSearch.jsx    # グローバル検索
│   ├── utils/
│   │   ├── fileStorageUtils.js     # ファイルアップロード
│   │   ├── searchUtils.js          # 検索機能
│   │   └── lineMessagingApiUtils.js # LINE通知
│   └── contexts/
│       └── AuthContext.js          # 認証
├── api/                            # APIエンドポイント
├── database/                       # データベーススキーマ
├── public/                         # 静的ファイル
├── package.json
├── vite.config.js
└── tailwind.config.js
```

### データベーススキーマ
主要テーブル:
- `projects` - プロジェクト情報
- `tasks` - タスク情報（attachments カラム含む）
- `routine_tasks` - ルーティンタスク
- `routine_completions` - ルーティン完了記録
- `team_members` - チームメンバー
- `line_settings` - LINE設定

---

## 🔑 重要なコード箇所

### 進捗率バリデーション（パターン）
```javascript
// handleSave関数内でのバリデーション
const progress = parseInt(editedTask.progress);
if (isNaN(progress)) progress = 0;
if (progress < 0) progress = 0;
if (progress > 100) progress = 100;
editedTask.progress = progress;

// onChange内でのリアルタイムクランプ
onChange={(e) => {
  let value = parseInt(e.target.value) || 0;
  if (value < 0) value = 0;
  if (value > 100) value = 100;
  setFormData({ ...formData, progress: value });
}}
```

### 100%完了時のUI（パターン）
```javascript
// 条件付きスタイリング
className={`${task.progress === 100 ? 'bg-green-50 border-2 border-green-500' : '...'} ...`}

// チェックマーク表示
{task.progress === 100 && (
  <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
)}

// 完了バッジ
{task.progress === 100 && (
  <div className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
    <CheckCircle size={14} />
    タスク完了！
  </div>
)}
```

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

## 🚀 次回作業開始手順

### 1. 環境確認
```bash
cd C:\Users\kame\Desktop\taskmanagement
git status
git log -1 --oneline
```

### 2. 最新の状態を取得（必要に応じて）
```bash
# リモートの最新状態を取得
git fetch

# ローカルを最新に更新
git pull origin main

# 依存関係が更新されている場合
npm install
```

### 3. 開発サーバー起動
```bash
npm run dev
# ブラウザで確認: http://localhost:3000 (または 3001, 3002 など)
```

### 4. 変更をデプロイする場合
```bash
# ステージング＆コミット
git add .
git commit -m "コミットメッセージ"
git push origin main

# 本番デプロイ（Vercel CLI）
vercel --prod --yes
```

---

## ⚠️ 注意事項

### 環境変数
- `.env` ファイルは含まれていません（セキュリティのため）
- Supabase接続情報が必要な場合は再設定が必要
- 環境変数の設定場所: Vercelダッシュボード + ローカル`.env`

必要な環境変数:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Git管理
`.gitignore`に以下が含まれています：
- `node_modules/`
- `.env`
- `.vercel/`

### Vercel CLI
- デプロイには`--yes`フラグが必要: `vercel --prod --yes`
- フラグなしでは確認エラーが発生します

### 既知の制約事項
- 進捗率は0-100の範囲に制限
- 日付比較はYYYY-MM-DD形式の文字列で実行
- ダークモード対応済み（`dark:`プレフィックス使用）

---

## 📦 バックアップ情報

### 最新バックアップ
- **作成日時**: 2025年11月14日 14:02:26
- **場所**: `C:\Users\kame\Desktop\taskmanagement_backups\`
- **ファイル**: `taskmanagement_backup_20251114_140226.tar.gz` (193KB)
- **情報ファイル**: `BACKUP_INFO_20251114_140226.txt`

### バックアップに含まれる内容
- 全ソースコード（src/, api/, database/, public/）
- 設定ファイル（package.json, vite.config.js等）
- ドキュメント（README.md等）

### バックアップから除外されるもの
- node_modules/ (package.jsonから復元可能)
- .git/ (GitHubから復元可能)
- .vercel/ (自動生成)
- .env (セキュリティのため)

### 復元方法
```bash
# 1. バックアップを展開
tar -xzf taskmanagement_backup_20251114_140226.tar.gz

# 2. ディレクトリに移動
cd taskmanagement

# 3. 依存パッケージをインストール
npm install

# 4. 環境変数を設定（.envファイル作成）

# 5. 開発サーバー起動
npm run dev
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

4. ✅ 進捗率100%の視認性が低い
   - 解決策: 緑色の強調表示、チェックマーク、完了バッジを全ビューに実装

5. ✅ 進捗率に100以上の値が入力可能
   - 解決策: リアルタイムクランプ処理を実装（0-100に制限）

---

## 💡 今後の改善アイデア

### 機能追加の候補

1. **進捗率関連の拡張**
   - タスクの自動ステータス更新（進捗率100%で自動的にステータスを「完了」に）
   - 完了タスクのフィルタリング機能
   - 完了率に基づく統計ダッシュボード
   - 完了通知機能

2. **ファイル添付の拡張**
   - プレビュー機能（画像・PDF）
   - 複数ファイル一括アップロード
   - ファイルサイズ制限の実装

3. **日報機能の拡張**
   - 週報・月報の自動生成
   - グラフ・チャートの追加
   - PDF エクスポート

4. **検索機能の拡張**
   - フィルタ保存機能
   - 高度な検索条件（日付範囲、ステータスなど）
   - 検索結果のエクスポート

5. **通知機能**
   - タスク期限のリマインダー
   - メンション機能
   - メール通知

### パフォーマンス改善
- 大量タスクの仮想スクロール
- 画像の遅延読み込み
- キャッシュ戦略の最適化

---

## 🔧 トラブルシューティング

### ローカルサーバーが起動しない
```bash
# ポートが使用中の場合、別のポート（3001, 3002など）で自動起動します
npm run dev

# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install
```

### Supabase 接続エラー
```bash
# .env ファイルを確認
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Vercelデプロイエラー
```bash
# Vercel CLIの再認証
vercel logout
vercel login

# --yesフラグを使用
vercel --prod --yes
```

### ビルドエラー
```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュをクリア
npm run build -- --force
```

---

## 📞 リソース・リンク集

### 本番環境
- **本番サイト**: https://taskmanagement-ruby.vercel.app/
- **GitHub**: https://github.com/IKEMENLTD/taskmanagement
- **Supabase**: https://supabase.com/dashboard/project/nlqiuvlcxxnusmlhwcqx/
- **Vercel**: https://vercel.com/dashboard

### よく使うコマンド
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

# Vercelデプロイ
vercel --prod --yes
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

### コミット情報
- コミットハッシュ:
- コミットメッセージ:

### 次回対応予定
- 対応予定1
- 対応予定2
```

---

**最終更新**: 2025年11月14日 14:02
**作成者**: Claude Code
**セッション状態**: ✅ すべてのタスク完了、本番デプロイ済み、バックアップ作成済み
