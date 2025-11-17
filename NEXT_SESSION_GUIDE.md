# 次回セッション開始ガイド

## 📖 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [アーキテクチャ詳細](#アーキテクチャ詳細)
   - プロジェクト全体の構成
   - 認証の仕組み
   - 状態管理の詳細
   - 主要なReactコンポーネント階層
   - API構造
   - データフロー例
3. [実装済み機能](#実装済み機能)
4. [技術スタック](#技術スタック)
5. [重要なコード箇所](#重要なコード箇所)
6. [次回作業開始手順](#次回作業開始手順)
7. [注意事項](#注意事項)
8. [バックアップ情報](#バックアップ情報)
9. [既知の問題・制限事項](#既知の問題制限事項)
10. [今後の改善アイデア](#今後の改善アイデア)
11. [トラブルシューティング](#トラブルシューティング)
12. [リソース・リンク集](#リソースリンク集)

---

## 📋 プロジェクト概要

**プロジェクト名**: タスク管理システム (taskmanagement)
**現在地**: `C:\Users\kame\Desktop\taskmanagement`

### 🌐 本番環境
- **本番URL**: https://taskmanagement-ruby.vercel.app/
- **GitHubリポジトリ**: https://github.com/IKEMENLTD/taskmanagement
- **データベース**: Supabase (https://supabase.com/dashboard/project/nlqiuvlcxxnusmlhwcqx/)
- **ホスティング**: Vercel

### 📊 最新コミット情報
- **コミットハッシュ**: `cb47f3e`
- **コミットメッセージ**: improve: 日報にタスクのコメント追加 & LINE設定をSupabaseで完全共有化
- **ブランチ**: main
- **最終デプロイ日**: 2025年11月17日 14:20頃

---

## 🏗️ アーキテクチャ詳細

### プロジェクト全体の構成

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザー                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (本番環境)                          │
│  https://taskmanagement-ruby.vercel.app/                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  React アプリケーション                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  App.jsx (ルート)                                    │    │
│  │    ↓                                                │    │
│  │  AuthProvider (認証コンテキスト)                      │    │
│  │    ↓                                                │    │
│  │  LoginPage / SignUpPage (未ログイン)                 │    │
│  │         or                                          │    │
│  │  Dashboard.jsx (ログイン済み)                         │    │
│  │    ├─ TimelineView (プロジェクト一覧)                 │    │
│  │    ├─ GanttChartView (ガントチャート)                │    │
│  │    ├─ CalendarView (カレンダー)                      │    │
│  │    ├─ DailyReportView (日報)                        │    │
│  │    ├─ RoutineView (ルーティン)                       │    │
│  │    ├─ TeamView (チーム)                             │    │
│  │    ├─ StatisticsView (統計)                         │    │
│  │    └─ SettingsPanel (設定)                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Supabase DB    │  │ Supabase Storage │  │  LINE API        │
│   (PostgreSQL)   │  │  (ファイル保存)   │  │  (通知送信)       │
│                  │  │                  │  │                  │
│ - projects       │  │ - タスク添付     │  │ - 日報自動送信   │
│ - tasks          │  │   ファイル       │  │ - 手動送信       │
│ - routine_tasks  │  │                  │  │ - テスト送信     │
│ - team_members   │  │                  │  │                  │
│ - line_settings  │  │                  │  │ (Vercel関数経由) │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 認証の仕組み

**AuthContext** (`src/contexts/AuthContext.jsx`)

```javascript
// 認証フロー
1. App起動
   ↓
2. AuthProvider が getCurrentUser() でセッション確認
   ↓
3. ログイン済み → Dashboard表示
   未ログイン → LoginPage表示
   ↓
4. onAuthStateChange() で認証状態を監視
   - SIGNED_IN: ログイン成功
   - SIGNED_OUT: ログアウト
   - TOKEN_REFRESHED: トークン更新
   - USER_UPDATED: ユーザー情報更新
   ↓
5. ユーザーテーマを取得・適用 (getUserTheme)
```

**認証が必要な操作**:
- プロジェクト・タスクのCRUD
- 日報作成・送信
- 設定変更
- ファイルアップロード

**認証情報の保存先**:
- Supabase Auth (セッション管理)
- ブラウザの Cookie/LocalStorage

### 状態管理の詳細

#### 1. **グローバル状態 (AuthContext)**
```javascript
// src/contexts/AuthContext.jsx
- user: 現在のユーザー情報
- session: セッション情報
- theme: ユーザーのテーマ設定
- loading: 認証状態のロード中フラグ
```

#### 2. **ローカル状態 (各コンポーネント)**
```javascript
// Dashboard.jsx
- projects: プロジェクト一覧 (Supabaseから取得)
- tasks: タスク一覧 (各プロジェクトに紐付け)
- routineTasks: ルーティンタスク (日付ごと)
- teamMembers: チームメンバー一覧
- darkMode: ダークモード設定

// DailyReportView.jsx
- selectedDate: 選択された日付
- selectedMember: 選択されたメンバー
- memberNotes: メンバー別の自由記述 (localStorage)
- lineSettings: LINE通知設定 (Supabase)

// TimelineView.jsx
- プロジェクト・タスクの編集フォーム状態
- ドラッグ&ドロップ状態
- モーダルの開閉状態
```

#### 3. **永続化されるデータ**
```javascript
// Supabase (データベース)
- プロジェクト、タスク、ルーティン、メンバー、LINE設定

// Supabase Storage
- タスクの添付ファイル

// localStorage
- 日報の自由記述: daily_report_notes_{日付}_{メンバー名}
- 検索履歴: search_history
- 保存済み検索: saved_searches
- LINE設定のバックアップ: lineMessagingApiSettings
```

### 主要なReactコンポーネント階層

```
App.jsx
└─ AuthProvider
   ├─ LoginPage.jsx (未ログイン時)
   ├─ SignUpPage.jsx (新規登録時)
   └─ Dashboard.jsx (ログイン済み)
      ├─ MobileHeader.jsx (モバイルヘッダー)
      ├─ MobileSidebar.jsx (モバイルサイドバー)
      ├─ GlobalSearch.jsx (グローバル検索)
      ├─ OnboardingTour.jsx (初回ガイド)
      ├─ KeyboardShortcutsHelp.jsx (ショートカットヘルプ)
      │
      ├─ ビュー (表示モード)
      │  ├─ TimelineView.jsx (プロジェクト一覧)
      │  │  ├─ TaskDetailModal.jsx (タスク詳細)
      │  │  └─ BulkActionsToolbar.jsx (一括操作)
      │  ├─ GanttChartView.jsx (ガントチャート)
      │  ├─ CalendarView.jsx (カレンダー)
      │  ├─ DailyReportView.jsx (日報)
      │  ├─ RoutineView.jsx (ルーティン)
      │  │  └─ RoutineDetailModal.jsx (ルーティン詳細)
      │  ├─ TeamView.jsx (チーム)
      │  │  └─ MemberCard.jsx (メンバーカード)
      │  └─ StatisticsView.jsx (統計)
      │     ├─ SimpleBarChart.jsx
      │     ├─ SimpleLineChart.jsx
      │     └─ SimplePieChart.jsx
      │
      └─ パネル (設定・管理)
         ├─ SettingsPanel.jsx (設定パネル)
         │  ├─ LineNotifySettings.jsx (LINE通知設定)
         │  └─ NotificationSettings.jsx (通知設定)
         └─ DataManagementPanel.jsx (データ管理)
```

### API構造

#### Vercel Serverless Functions (`api/`)

```javascript
// api/send-line-message.js
- 機能: LINE Messaging APIへのプロキシ
- メソッド: POST
- 入力: { channelAccessToken, groupId, message }
- 出力: { success, message/error }
- 役割: CORS制限を回避してLINE APIへリクエスト送信

// 処理フロー
フロントエンド (DailyReportView.jsx)
  ↓ sendLineMessage()
Vercel Function (/api/send-line-message)
  ↓ fetch('https://api.line.me/v2/bot/message/push')
LINE Messaging API
  ↓
LINEグループへ通知
```

#### Supabaseへの直接アクセス

```javascript
// src/lib/supabase.js
- supabase クライアントの初期化
- VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

// 各コンポーネントから直接 Supabase を使用
- プロジェクトCRUD: Dashboard.jsx
- タスクCRUD: TimelineView.jsx, TaskDetailModal.jsx
- ルーティンCRUD: RoutineView.jsx
- LINE設定: lineMessagingApiUtils.js
- 認証: authUtils.js
```

### データフロー例

#### 1. **タスク作成のフロー**
```
ユーザー操作 (TimelineView.jsx)
  ↓
handleCreateTask()
  ↓
supabase.from('tasks').insert()
  ↓
Supabase Database (tasks テーブル)
  ↓
リアルタイム更新 (Supabaseのリアルタイム機能)
  ↓
画面更新 (fetchProjects() → setProjects())
```

#### 2. **日報送信のフロー**
```
ユーザー操作 (DailyReportView.jsx)
  ↓
handleSendLine()
  ↓
generateTeamReport() (日報テキスト生成)
  ↓
sendLineMessage() → fetch('/api/send-line-message')
  ↓
Vercel Function
  ↓
fetch('https://api.line.me/v2/bot/message/push')
  ↓
LINE Messaging API
  ↓
LINEグループへ通知
  ↓
lastSentDate を Supabase に保存
```

#### 3. **自動送信のフロー**
```
Dashboard起動
  ↓
useLineNotifyScheduler() フック実行
  ↓
1分ごとに checkAndSend()
  ↓
shouldSendReport() で送信時刻チェック
  ↓
送信時刻 & 未送信の場合
  ↓
generateTeamReport() → sendLineMessage()
  ↓
LINE通知送信 & lastSentDate 更新
```

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

### 3. 日報の重複送信防止
日報が2回送信される問題を修正：

#### 自動送信（useLineNotifyScheduler.js）
- 送信中フラグ（`isSendingRef`）で同時実行を完全に防止
- 初回チェックを削除し、setIntervalのみで1分ごとに実行
- try-finally構文で確実なフラグ解除を保証
- 関連ファイル: `src/hooks/useLineNotifyScheduler.js`

#### 手動送信（DailyReportView.jsx）
- 送信中チェックの早期リターンを追加
- 重複クリック防止を強化
- 関連ファイル: `src/components/views/DailyReportView.jsx` (lines 377-382)

### 4. LINE認証エラーメッセージの詳細化
LINE送信でエラーが発生した際に、具体的な対処方法を提示：

#### 日報画面（DailyReportView.jsx）
- アクセストークンエラー: LINE Developersでの確認・再発行を案内
- グループIDエラー: 設定確認を案内
- エラー表示時間を8秒に延長
- 関連ファイル: `src/components/views/DailyReportView.jsx` (lines 423-437)

#### 自動送信（useLineNotifyScheduler.js）
- アクセストークンエラーの詳細ログ出力
- エラー種別による適切なログメッセージ
- 関連ファイル: `src/hooks/useLineNotifyScheduler.js` (lines 107-121)

#### 設定画面（LineNotifySettings.jsx）
- LINE Developersコンソールへの直リンク追加
- アクセストークン・グループID別の詳細エラーメッセージ
- エラー時は8秒、成功時は5秒の表示時間
- 関連ファイル: `src/components/settings/LineNotifySettings.jsx` (lines 228-245)

### 5. タスクのコメントを日報に表示
タスクにコメントが記載されている場合、そのコメントも日報に反映：

#### 日報生成（lineMessagingApiUtils.js）
- 本日完了タスク: 最新のコメントを `[コメント: ○○]` 形式で表示
- 進行中タスク: 最新のコメントを `[コメント: ○○]` 形式で表示
- ブロック中タスク: 最新のコメントを `[コメント: ○○]` 形式で表示
- コメントがない場合は表示されない
- 関連ファイル: `src/utils/lineMessagingApiUtils.js` (lines 114-157)

### 6. LINE設定のSupabase完全共有化
全PC・全ブラウザで同じLINE設定を共有できるように改善：

#### Supabaseのみで管理
- localStorage へのバックアップ保存を削除
- エラー時の localStorage フォールバックを削除
- 設定変更時に Supabase のみに保存
- 全てのデバイスで即座に同じ設定が表示される
- 関連ファイル: `src/utils/lineMessagingApiUtils.js` (saveLineSettings, getLineSettings)

#### マイグレーション機能
- 既存の localStorage データがある場合、初回のみ Supabase に自動移行
- 移行完了後、localStorage から設定を削除
- 以降は Supabase のみから設定を読み込む

### 7. バグ修正履歴
- ✅ 進捗率バリデーションの追加
- ✅ 日付比較ロジックの確認（文字列形式YYYY-MM-DDで正常動作）
- ✅ 検索機能の確認（最小文字数制限なし）
- ✅ 日報の重複送信防止
- ✅ LINE認証エラーメッセージの詳細化
- ✅ タスクのコメントを日報に表示
- ✅ LINE設定をSupabaseで完全共有化

### 8. 過去に実装された機能
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

### 日報の重複送信防止（パターン）
```javascript
// 自動送信: 送信中フラグで同時実行を防止
export const useLineNotifyScheduler = (projects, routineTasks) => {
  const isSendingRef = useRef(false); // 送信中フラグ

  const checkAndSend = async () => {
    // 既に送信処理が実行中の場合はスキップ
    if (isSendingRef.current) {
      console.log('[LINE通知] 送信処理が実行中のためスキップ');
      return;
    }

    // 送信開始フラグを立てる
    isSendingRef.current = true;

    try {
      // 日報を生成して送信
      const result = await sendLineMessage(...);
    } catch (error) {
      console.error('[LINE通知] エラー:', error);
    } finally {
      // 送信処理完了後、フラグを解除
      isSendingRef.current = false;
    }
  };
};

// 手動送信: 送信中の早期リターン
const handleSendLine = async () => {
  if (isSendingLine) {
    console.log('[LINE送信] 送信処理が実行中のためスキップ');
    return;
  }

  setIsSendingLine(true);
  // 送信処理...
  setIsSendingLine(false);
};
```

### LINE認証エラーの詳細メッセージ（パターン）
```javascript
// エラーハンドリング
catch (error) {
  // エラーメッセージを詳細化
  let errorMessage = '送信エラー: ';
  if (error.message.includes('Authentication failed') || error.message.includes('access token')) {
    errorMessage += 'アクセストークンが無効です。設定画面でLINEのチャンネルアクセストークンを確認してください。トークンが期限切れの場合は、LINE Developersコンソールで再発行してください。';
  } else if (error.message.includes('Invalid reply token')) {
    errorMessage += 'グループIDまたはユーザーIDが無効です。設定を確認してください。';
  } else {
    errorMessage += error.message;
  }

  setLineMessage({ type: 'error', text: errorMessage });
} finally {
  setIsSendingLine(false);
  setTimeout(() => setLineMessage({ type: '', text: '' }), 8000); // エラー時は8秒表示
}
```

### タスクのコメントを日報に表示（パターン）
```javascript
// 日報生成時にコメントを追加
// 本日完了タスク
if (projectData.completed.length > 0) {
  report += `  ✅ 本日完了:\n`;
  projectData.completed.forEach(task => {
    report += `    - ${task.name}`;
    // 最新のコメントがあれば追加
    if (task.comments && task.comments.length > 0) {
      const latestComment = task.comments[task.comments.length - 1];
      report += ` [コメント: ${latestComment.text}]`;
    }
    report += `\n`;
  });
}

// 進行中タスク
if (projectData.active.length > 0) {
  report += `  🔄 進行中:\n`;
  projectData.active.forEach(task => {
    const priority = task.priority === 'urgent' ? '🔴' :
                     task.priority === 'high' ? '🟠' :
                     task.priority === 'medium' ? '🟡' : '🟢';
    report += `    ${priority} ${task.name} (${task.progress}%)`;
    if (task.dueDate) {
      report += ` 期限:${task.dueDate}`;
    }
    // 最新のコメントがあれば追加
    if (task.comments && task.comments.length > 0) {
      const latestComment = task.comments[task.comments.length - 1];
      report += ` [コメント: ${latestComment.text}]`;
    }
    report += `\n`;
  });
}
```

### LINE設定のSupabase管理（パターン）
```javascript
// 保存時: Supabaseのみに保存（localStorageバックアップなし）
export const saveLineSettings = async (organizationId, settings) => {
  // ... Supabaseへの保存処理 ...

  // localStorage にバックアップを保存する行を削除
  // localStorage.setItem('lineMessagingApiSettings', JSON.stringify(settings)); // 削除済み

  console.log('[saveLineSettings] 保存成功（Supabaseのみに保存）');
  return { success: true };
};

// 読み込み時: Supabaseから読み込み（マイグレーション機能あり）
export const getLineSettings = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('line_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (data) {
      return { /* Supabaseのデータを返す */ };
    }

    // データがない場合はlocalStorageから取得を試みる（マイグレーション用・初回のみ）
    const localSettings = localStorage.getItem('lineMessagingApiSettings');
    if (localSettings) {
      console.log('[getLineSettings] localStorageからSupabaseへマイグレーション中...');
      const parsed = JSON.parse(localSettings);
      await saveLineSettings(organizationId, parsed);
      // マイグレーション完了後、localStorageから削除
      localStorage.removeItem('lineMessagingApiSettings');
      console.log('[getLineSettings] マイグレーション完了、localStorageを削除しました');
      return parsed;
    }

    return { /* デフォルト値 */ };
  } catch (error) {
    console.error('LINE設定の取得に失敗しました:', error);
    // エラー時はlocalStorageフォールバックなし、デフォルト値を返す
    return { /* デフォルト値 */ };
  }
};
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
- **作成日時**: 2025年11月17日 14:22:33
- **場所**: `C:\Users\kame\Desktop\taskmanagement_backups\`
- **ファイル**: `taskmanagement_backup_20251117_142233.tar.gz` (200KB)
- **情報ファイル**: `BACKUP_INFO_20251117_142233.txt`
- **含まれる実装**: タスクのコメント表示機能、LINE設定のSupabase完全共有化

### 前回バックアップ
- **作成日時**: 2025年11月17日 10:54:08
- **ファイル**: `taskmanagement_backup_20251117_105408.tar.gz` (200KB)

### その他のバックアップ
- **作成日時**: 2025年11月14日 15:49:51
- **ファイル**: `taskmanagement_backup_20251114_154951.tar.gz` (195KB)

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

6. ✅ 日報が2回送信される（重複送信）
   - 原因: 初回チェックの即時実行とsetIntervalの競合、React Strict Modeの影響
   - 解決策: 送信中フラグ（isSendingRef）の追加、初回チェックの削除、try-finally構文による確実なフラグ解除

7. ✅ LINE認証エラーメッセージが不明瞭
   - 問題: エラー時に具体的な対処方法がわからない
   - 解決策: エラー種別による詳細メッセージ、LINE Developersコンソールへのリンク追加、表示時間延長（8秒）

8. ✅ 日報にタスクのコメントが表示されない
   - 問題: タスクに重要なコメントがあっても日報に反映されない
   - 解決策: 本日完了・進行中・ブロック中の全タスクに最新コメントを表示（コメントがある場合のみ）

9. ✅ LINE設定が異なるPCで異なる値になる
   - 問題: localStorage にバックアップ保存していたため、各PC個別の設定が表示される
   - 解決策: localStorage バックアップ機能を削除、Supabase のみで管理し全デバイスで共有

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

**最終更新**: 2025年11月17日 14:25
**作成者**: Claude Code
**セッション状態**: ✅ すべてのタスク完了、本番デプロイ済み、バックアップ作成済み

## 📝 今回のセッションで実施した内容

### 実施内容（2025年11月17日）
1. **タスクのコメントを日報に追加**
   - 本日完了タスク: 最新のコメントを `[コメント: ○○]` 形式で表示
   - 進行中タスク: 最新のコメントを `[コメント: ○○]` 形式で表示
   - ブロック中タスク: 最新のコメントを `[コメント: ○○]` 形式で表示
   - コメントがない場合は表示されない
   - 修正ファイル: `src/utils/lineMessagingApiUtils.js`

2. **LINE設定をSupabaseで完全共有化**
   - localStorage へのバックアップ保存を削除
   - エラー時の localStorage フォールバックを削除
   - 設定変更時に Supabase のみに保存
   - 既存の localStorage データは初回のみ Supabase に自動移行後削除
   - 全てのPC・全ブラウザで即座に同じ設定が表示される
   - 修正ファイル: `src/utils/lineMessagingApiUtils.js`
   - コミット: cb47f3e "improve: 日報にタスクのコメント追加 & LINE設定をSupabaseで完全共有化"

3. **デプロイ**
   - GitHub: プッシュ完了
   - Vercel: 本番デプロイ完了

4. **バックアップ作成**
   - バックアップファイル: taskmanagement_backup_20251117_142233.tar.gz (200KB)
   - 情報ファイル: BACKUP_INFO_20251117_142233.txt

5. **ドキュメント更新**
   - NEXT_SESSION_GUIDE.md を最新情報に更新（実装済み機能、重要なコード箇所、バックアップ情報、既知の問題）

### 解決した問題
- ✅ 日報にタスクのコメントが表示されない問題
- ✅ LINE設定が異なるPCで異なる値になる問題

---

## 📝 前回のセッション（2025年11月14日）

### 実施内容
1. **日報の重複送信問題を調査・修正**
   - 原因特定: 初回チェックの即時実行とsetIntervalの競合
   - 自動送信: 送信中フラグ（isSendingRef）の実装
   - 手動送信: 重複クリック防止の強化
   - コミット: c2de8ff "fix: 日報の重複送信を防止"

2. **LINE認証エラーメッセージの詳細化**
   - アクセストークンエラー: LINE Developersでの確認・再発行を案内
   - グループIDエラー: 設定確認を案内
   - エラー表示時間を8秒に延長
   - LINE Developersコンソールへの直リンク追加
   - コミット: 99e478a "improve: LINE認証エラーのメッセージを詳細化"

### 解決した問題
- ✅ 日報が2回送信される問題
- ✅ LINE認証エラーメッセージが不明瞭な問題
