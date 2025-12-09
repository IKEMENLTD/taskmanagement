# プロジェクト引き継ぎ書

最終更新日: 2025年12月9日
作成者: Claude Code
対象: 別開発環境への移行

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [ディレクトリ構造](#ディレクトリ構造)
4. [セットアップ手順](#セットアップ手順)
5. [環境変数の設定](#環境変数の設定)
6. [データベースセットアップ](#データベースセットアップ)
7. [開発サーバーの起動](#開発サーバーの起動)
8. [デプロイ方法](#デプロイ方法)
9. [重要な実装ポイント](#重要な実装ポイント)
10. [最近の変更履歴](#最近の変更履歴)
11. [トラブルシューティング](#トラブルシューティング)

---

## プロジェクト概要

### プロジェクト名
**4次元プロジェクト管理ダッシュボード** (4d-project-dashboard)

### 概要
チームのタスク管理、プロジェクト管理、ルーティン業務の管理を統合したWebアプリケーション。組織単位でデータを共有し、複数のPC間でリアルタイムに同期します。

### 主な機能
- **タスク管理**: プロジェクト単位でのタスク作成・管理・完了
- **ルーティン管理**: 毎日・平日・曜日指定での繰り返しタスク管理
- **日報機能**: 日次の作業記録と振り返り
- **統計表示**: プロジェクトごとの進捗率、完了タスク数などの可視化
- **LINE通知**: 日報完了時のLINE通知機能
- **組織管理**: 組織単位でのデータ共有とメンバー管理

---

## 技術スタック

### フロントエンド
- **React 18.2.0** - UIフレームワーク
- **Vite 4.4.5** - ビルドツール
- **Tailwind CSS 3.3.3** - CSSフレームワーク
- **Lucide React** - アイコンライブラリ

### バックエンド
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL データベース
  - リアルタイム同期
  - Row Level Security (RLS)
  - 認証・認可機能

### デプロイ
- **Vercel** - ホスティングプラットフォーム
  - 自動デプロイ（GitHub連携）
  - Serverless Functions (LINE通知API)

### バージョン管理
- **Git / GitHub**
  - リポジトリ: `IKEMENLTD/taskmanagement`
  - ブランチ: `main` (本番環境に自動デプロイ)

---

## ディレクトリ構造

```
taskmanagement/
├── api/                          # Vercel Serverless Functions
│   └── send-line-message.js      # LINE通知API
├── database/                     # データベース関連
│   ├── migrate_routines_structure.sql  # ルーティン構造移行スクリプト
│   ├── add_organization_id_to_routines.sql
│   ├── add_attachments_column.sql
│   ├── line_settings.sql
│   ├── LINE_SETTINGS_SETUP.md
│   └── ROUTINE_ORGANIZATION_SETUP.md
├── src/
│   ├── components/               # Reactコンポーネント
│   │   ├── cards/                # カードコンポーネント
│   │   ├── modals/               # モーダルコンポーネント
│   │   └── views/                # ビューコンポーネント
│   ├── contexts/                 # React Context
│   │   └── AuthContext.jsx       # 認証コンテキスト
│   ├── data/                     # 静的データ
│   ├── hooks/                    # カスタムフック
│   ├── lib/                      # ライブラリ
│   │   └── supabaseClient.js     # Supabaseクライアント
│   ├── utils/                    # ユーティリティ関数
│   │   ├── routineUtils.js       # ルーティン管理
│   │   ├── taskUtils.js          # タスク管理
│   │   ├── projectUtils.js       # プロジェクト管理
│   │   └── colorUtils.js         # カラー設定
│   ├── App.jsx                   # メインアプリ
│   ├── main.jsx                  # エントリーポイント
│   └── index.css                 # グローバルCSS
├── .env                          # 環境変数（ローカル）
├── .gitignore                    # Git除外設定
├── database_setup.sql            # 初期DB設定
├── vercel.json                   # Vercel設定
├── vite.config.js                # Vite設定
├── tailwind.config.js            # Tailwind設定
├── package.json                  # 依存関係
├── NEXT_SESSION_GUIDE.md         # 次セッション用ガイド
├── DATABASE_CLEANUP_GUIDE.md     # DB整理ガイド
├── SETUP_INSTRUCTIONS.md         # セットアップ手順
└── README.md                     # プロジェクト説明
```

---

## セットアップ手順

### 前提条件
- Node.js (v16以上推奨)
- npm または yarn
- Git
- Supabaseアカウント（既存プロジェクトを使用）

### 1. リポジトリのクローン

```bash
# GitHubからクローン
git clone https://github.com/IKEMENLTD/taskmanagement.git
cd taskmanagement
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成：

```env
VITE_SUPABASE_URL=https://nlqiuvlcxxnusmlhwcqx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scWl1dmxjeHhudXNtbGh3Y3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDU1NDgsImV4cCI6MjA3NzgyMTU0OH0.OQXmzJLfDMj1bjufT-Xj9AzpeL-w1UlcE9mD4cYlEcA
```

**注意**:
- これらの値は既存のSupabaseプロジェクトの値です
- 新しい環境でも同じSupabaseプロジェクトを使用する場合は、この値をそのまま使用
- 別のSupabaseプロジェクトを使用する場合は、新しい値に置き換え

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

---

## 環境変数の設定

### ローカル開発環境

`.env` ファイルに以下の変数が必要：

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `VITE_SUPABASE_URL` | SupabaseプロジェクトURL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase匿名キー | ✅ |

### Vercel本番環境

Vercelの環境変数設定で以下を設定済み：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

新しいVercelプロジェクトを作成する場合は、これらの環境変数を再設定する必要があります。

---

## データベースセットアップ

### 既存データベースを使用する場合

現在のSupabaseプロジェクト（`nlqiuvlcxxnusmlhwcqx`）がすでにセットアップ済みです。新しい開発環境でも同じ`.env`設定を使用すれば、そのまま接続できます。

### 新しいデータベースを作成する場合

1. **Supabaseで新規プロジェクトを作成**

2. **初期テーブル作成**
   - Supabase SQL Editorで `database_setup.sql` を実行

3. **ルーティン構造の移行**
   - `database/migrate_routines_structure.sql` を実行
   - これにより、ルーティンのマスターテーブル（`routines`）と実行記録テーブル（`routine_tasks`）が作成されます

4. **組織ID対応**
   - `database/add_organization_id_to_routines.sql` を実行（必要に応じて）

### 主要テーブル構造

#### organizations
組織情報を管理

```sql
- id (UUID, PRIMARY KEY)
- name (TEXT)
- created_at (TIMESTAMPTZ)
```

#### tasks
タスク情報を管理

```sql
- id (BIGSERIAL, PRIMARY KEY)
- organization_id (UUID, FK)
- project_id (BIGINT, FK)
- name (TEXT)
- status (TEXT)
- assignee (TEXT)
- priority (TEXT)
- due_date (DATE)
- completed (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

#### routines
ルーティンのマスター定義（2025年11月19日に新設）

```sql
- id (BIGSERIAL, PRIMARY KEY)
- organization_id (UUID, FK)
- name (TEXT)
- description (TEXT)
- time (TEXT)
- category (TEXT)
- project_id (BIGINT, FK)
- assignee (TEXT)
- repeat (TEXT) - 'daily', 'weekdays', 'custom'
- selected_days (INTEGER[]) - 曜日指定用
- duration (INTEGER) - 所要時間（分）
- is_active (BOOLEAN) - 有効/無効フラグ
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- created_by (UUID, FK)
```

#### routine_tasks
ルーティンの実行記録（日次）

```sql
- id (BIGSERIAL, PRIMARY KEY)
- routine_id (BIGINT, FK) - routinesテーブルへの参照
- organization_id (UUID, FK)
- date (DATE) - 実行日
- name (TEXT)
- time (TEXT)
- status (TEXT) - 'pending', 'completed', 'skipped'
- completed_at (TIMESTAMPTZ)
- skip_reason (TEXT)
- ... その他マスターからコピーされた情報
```

#### projects
プロジェクト情報

```sql
- id (BIGSERIAL, PRIMARY KEY)
- organization_id (UUID, FK)
- name (TEXT)
- color (TEXT)
- status (TEXT)
- created_at (TIMESTAMPTZ)
```

---

## 開発サーバーの起動

### ローカル開発

```bash
# 開発サーバー起動（ホットリロード有効）
npm run dev

# ポート: http://localhost:3000
```

### ビルド確認

```bash
# 本番ビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

---

## デプロイ方法

### 自動デプロイ（推奨）

**現在の設定**: GitHubの`main`ブランチにpushすると、Vercelが自動的にデプロイします。

```bash
# 変更をコミット
git add .
git commit -m "変更内容"

# mainブランチにpush（自動デプロイ開始）
git push origin main
```

**本番URL**: https://taskmanagement-ruby.vercel.app/

### 新しいVercelプロジェクトを作成する場合

1. **Vercelアカウントでプロジェクトをインポート**
   - GitHubリポジトリを連携
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **環境変数を設定**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **デプロイ**
   - 自動的にビルド・デプロイが開始されます

---

## 重要な実装ポイント

### 1. ルーティン機能のアーキテクチャ

**2025年11月19日に大幅改修** - 最も重要な変更点

#### 改修前の問題
- 日を跨ぐとルーティンデータが消える
- ルーティン定義と実行記録が混在していた

#### 改修後の構造
- **routines テーブル**: ルーティンのマスター定義（「何を」「いつ」「誰が」）
- **routine_tasks テーブル**: 日次の実行記録（「完了した」「スキップした」）

#### データフロー
```
1. routinesテーブルから有効なルーティン定義を取得
2. 今日の実行記録（routine_tasks）を取得
3. 両者を組み合わせて表示
   - 実行記録がある → 完了/スキップ状態を表示
   - 実行記録がない → 未完了として表示
```

#### 関連ファイル
- `src/utils/routineUtils.js`: ルーティン管理ロジック
  - `getAllRoutines()` - マスター取得
  - `getTodaysRoutines()` - 今日のルーティン取得（マスター+記録）
  - `completeRoutine()` - 完了記録作成
  - `skipRoutine()` - スキップ記録作成
- `src/components/views/RoutineView.jsx`: ルーティンビューUI
- `src/components/Dashboard.jsx`: メインダッシュボード（データ取得・リアルタイム同期）

### 2. 組織ベースのデータ共有

すべてのデータは `organization_id` で管理され、同じ組織のメンバー間で共有されます。

**認証コンテキスト**: `src/contexts/AuthContext.jsx`
```javascript
// ユーザーログイン時に組織IDを取得
const { organizationId } = useAuth();

// すべてのクエリで組織IDをフィルター
await supabase
  .from('tasks')
  .select('*')
  .eq('organization_id', organizationId);
```

### 3. リアルタイム同期

Supabaseのリアルタイム機能を使用して、複数のクライアント間でデータを自動同期：

```javascript
// 例: routinesテーブルの変更を監視
const routinesSubscription = supabase
  .channel('routines-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'routines'
  }, async (payload) => {
    // データ再取得
    await loadData();
  })
  .subscribe();
```

### 4. React Keyの一意性

**2025年11月25日修正**

RoutineCardコンポーネントのkeyには、実行記録ID（`routine.id`）ではなく、マスターID（`routine.routineId`）を使用します。

理由: 実行記録がまだない場合、`routine.id`はnullになり、複数のカードで重複してReact警告が発生するため。

```jsx
// 修正後
{routines.map(routine => (
  <RoutineCard
    key={routine.routineId}  // マスターID（常に存在）
    routine={routine}
  />
))}
```

### 5. LINE通知機能

日報完了時にLINE通知を送信する機能（Vercel Serverless Function）

**APIエンドポイント**: `/api/send-line-message`

**設定ファイル**:
- `database/line_settings.sql` - LINE設定テーブル
- `database/LINE_SETTINGS_SETUP.md` - 設定手順

### 6. チームメンバー負荷率自動計算（2025年12月9日追加）

メンバーごとの負荷率を自動計算して表示する機能。

**計算式**:
```
負荷率 = (担当タスク数 × 10) + (今日のルーティン数 × 5) + (本日期限タスク × 10)
```

**表示内容**:
- MemberCard: PJ数、タスク数、ルーティン数、負荷率、期限切れ警告
- TeamView詳細モーダル: 担当プロジェクト一覧、担当タスク一覧、今日のルーティン、負荷率内訳

**関連ファイル**:
- `src/utils/workloadUtils.js` - 負荷率計算ユーティリティ
- `src/components/cards/MemberCard.jsx` - メンバーカード
- `src/components/views/TeamView.jsx` - チームビュー

---

## 最近の変更履歴

### 2025年12月9日
- **チームメンバー負荷率自動計算機能を追加** (コミット: `78fd778`)
  - `workloadUtils.js`: 負荷率計算ユーティリティを新規作成
  - 計算式: タスク数×10 + ルーティン数×5 + 本日期限タスク×10
  - MemberCard: 担当数サマリー（PJ/タスク/ルーティン）を表示
  - TeamView: 負荷率を自動計算、詳細モーダルに担当タスク一覧を追加
  - チーム統計に「期限切れタスク」項目を追加

### 2025年11月26日
- **ルーティン削除時のID渡し修正** (コミット: `7f09a82`)
  - `handleDelete(selectedRoutine.routineId)`に修正

### 2025年11月25日
- **React key警告を修正** (コミット: `5d4307e`)
  - RoutineCardのkeyを`routine.id`から`routine.routineId`に変更
  - 実行記録がないルーティンでも一意なkeyを保証

### 2025年11月19日
- **ルーティン機能の大幅改修** (コミット: `665c74d`)
  - routinesテーブル（マスター）とroutine_tasksテーブル（実行記録）に分離
  - 「日を跨ぐとデータが消える」問題を解決
  - 既存データの自動移行スクリプトを作成

- **ルーティン完了・スキップのエラー修正** (コミット: `a8c3c77`)
  - 初回完了時にマスターデータを取得してから実行記録を作成
  - `name`カラムのNOT NULL制約エラーを解決

### 2025年11月18日
- **ルーティン管理を組織ベースに変更** (コミット: `f5cb5b4`, `0850dcb`)
  - PC間でのデータ共有を実現
  - `organization_id`を全ルーティン関連テーブルに追加

### その他の改善
- 日報・統計ビューの表示改善
- デバッグログの削除とコードクリーンアップ
- Vercel Functionへの詳細ログ追加

---

## トラブルシューティング

### 1. データが表示されない

**原因**:
- 環境変数が正しく設定されていない
- Supabaseへの接続に失敗している

**解決方法**:
```bash
# .envファイルを確認
cat .env

# 開発サーバーを再起動
npm run dev
```

**ブラウザコンソールを確認**:
- Supabase接続エラーがないか確認
- 認証状態を確認

### 2. ルーティンが日を跨いで消える

**原因**:
- 旧バージョンのコード（2025年11月19日以前）を使用している

**解決方法**:
```bash
# 最新版にアップデート
git pull origin main

# マイグレーションを実行（まだの場合）
# Supabase SQL Editorで以下を実行:
# database/migrate_routines_structure.sql
```

### 3. React Key Warning

**原因**:
- RoutineCardのkeyに`routine.id`を使用している（旧バージョン）

**解決方法**:
```bash
# 最新版にアップデート（2025年11月25日以降）
git pull origin main
```

### 4. npm installでエラーが出る

**原因**:
- Node.jsのバージョンが古い

**解決方法**:
```bash
# Node.jsバージョンを確認
node -v

# v16以上が必要
# 必要に応じてNode.jsをアップデート
```

### 5. Vercelデプロイが失敗する

**原因**:
- 環境変数が設定されていない
- ビルドエラー

**解決方法**:
1. Vercelダッシュボードで環境変数を確認
2. ローカルで`npm run build`を実行してビルドエラーがないか確認
3. Vercelのデプロイログを確認

### 6. データベースマイグレーションエラー

**エラー例**: `ERROR: 22007: invalid input syntax for type time: ""`

**原因**:
- TIME型のカラムを空文字列と比較しようとしている

**解決方法**:
```sql
-- TIME型をTEXT型にキャストしてから比較
COALESCE(time::text, '')
```

---

## 開発時の注意事項

### Gitワークフロー

```bash
# 作業開始前に最新版を取得
git pull origin main

# 変更をコミット
git add .
git commit -m "変更内容を明確に記載"

# プッシュ（自動デプロイされる）
git push origin main
```

### コード規約

- **ファイル命名**: PascalCase（コンポーネント）、camelCase（ユーティリティ）
- **コメント**: 複雑なロジックには日本語でコメントを記載
- **インポート順**: React → サードパーティ → 自作モジュール

### データベース変更

1. SQLファイルを`database/`フォルダに作成
2. Supabase SQL Editorで実行
3. `NEXT_SESSION_GUIDE.md`に変更内容を記録

---

## 参考ドキュメント

- `README.md` - プロジェクト全体の説明
- `SETUP_INSTRUCTIONS.md` - 初期セットアップ手順
- `NEXT_SESSION_GUIDE.md` - 次回セッション用の引き継ぎ情報（最新の変更内容）
- `DATABASE_CLEANUP_GUIDE.md` - データベース整理ガイド
- `database/LINE_SETTINGS_SETUP.md` - LINE通知設定
- `database/ROUTINE_ORGANIZATION_SETUP.md` - ルーティン組織対応

---

## 連絡先・サポート

### GitHubリポジトリ
https://github.com/IKEMENLTD/taskmanagement

### 本番環境URL
https://taskmanagement-ruby.vercel.app/

### Supabaseプロジェクト
https://nlqiuvlcxxnusmlhwcqx.supabase.co

---

## チェックリスト：新環境でのセットアップ

- [ ] Node.js (v16以上) をインストール
- [ ] リポジトリをクローン
- [ ] `npm install` を実行
- [ ] `.env` ファイルを作成・設定
- [ ] `npm run dev` で開発サーバー起動
- [ ] ブラウザで `http://localhost:3000` にアクセス
- [ ] ログイン機能の動作確認
- [ ] タスク作成・完了の動作確認
- [ ] ルーティン作成・完了の動作確認
- [ ] （必要に応じて）Vercelプロジェクトを作成
- [ ] （必要に応じて）環境変数をVercelに設定
- [ ] （必要に応じて）GitHub連携を設定

---

**以上でセットアップ完了です。何か問題が発生した場合は、トラブルシューティングセクションを参照してください。**
