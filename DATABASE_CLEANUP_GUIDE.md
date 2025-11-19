# データベースクリーンアップガイド

## 問題の概要
- PC1とPC2でルーティンが共有されない問題を修正しました
- 古いデータ（user_idで保存されたルーティン）がデータベースに残っている可能性があります

## 実施した修正
1. RoutineView.jxsで`organizationId`を使用するように変更
2. useRoutines.jsで`localStorage`を削除（Supabase完全移行）
3. Dashboard.jxsで`sampleRoutines`を削除

## データベースのクリーンアップ手順

### 1. localStorageのクリア（ブラウザ側）

**手順：**
1. 本番サイト（https://taskmanagement-ruby.vercel.app/）を開く
2. ブラウザの開発者ツールを開く（F12キー）
3. `Console`タブを開く
4. 以下のコマンドを実行：

```javascript
// ルーティン関連のlocalStorageをクリア
localStorage.removeItem('routineTasks');
console.log('ルーティンのlocalStorageをクリアしました');

// ページをリロード
location.reload();
```

### 2. Supabase データベースの確認（オプション）

**Supabaseダッシュボードで確認：**
1. https://supabase.com/dashboard/project/nlqiuvlcxxnusmlhwcqx/ にアクセス
2. `Table Editor` → `routine_tasks` テーブルを開く
3. データを確認：
   - `organization_id`列を確認
   - 正しいorganization_idでデータが保存されているか確認

**古いデータの削除（必要な場合のみ）:**

```sql
-- 注意: 実行前に必ずデータをバックアップしてください

-- 現在のorganization_idを確認
SELECT DISTINCT organization_id FROM routine_tasks;

-- 古いデータ（特定のorganization_id以外）を削除する例
-- ※実際のorganization_idに置き換えてください
-- DELETE FROM routine_tasks WHERE organization_id != '正しいorganization_id';
```

### 3. プロジェクト・タスク・チームメンバーも同様に確認

**確認すべきテーブル：**
- `projects` - プロジェクトデータ
- `tasks` - タスクデータ
- `team_members` - チームメンバー
- `routine_categories` - ルーティンカテゴリー

**各テーブルで organization_id が正しいか確認：**
```sql
SELECT id, name, organization_id FROM projects;
SELECT id, name, organization_id FROM team_members;
SELECT id, name, organization_id FROM routine_categories;
```

## テスト手順

### 1. PC1でルーティンを追加
1. ルーティンビューを開く
2. 「ルーティン追加」ボタンをクリック
3. ルーティン名、時刻、担当者を入力
4. 保存

### 2. PC2で確認
1. ページをリロード（またはログインし直す）
2. ルーティンビューを開く
3. PC1で追加したルーティンが表示されることを確認

### 3. 逆方向のテスト
1. PC2でルーティンを追加
2. PC1で表示されることを確認

## トラブルシューティング

### ルーティンが表示されない場合
1. ブラウザのlocalStorageをクリア（上記手順1）
2. ページをリロード（Ctrl + Shift + R）
3. ログアウト → ログイン

### organizationIdが取得できない場合
1. AuthContextでorganizationIdが正しく設定されているか確認
2. ブラウザのコンソールでエラーが出ていないか確認

### データが重複している場合
1. Supabaseダッシュボードでデータを確認
2. 重複データを手動で削除

## 注意事項
- **データを削除する前に必ずバックアップを取ってください**
- 本番環境で作業する場合は慎重に行ってください
- 不明な点があれば、まず開発環境でテストしてください

## 次回以降の開発のために
- ルーティンは必ず`organizationId`で管理
- localStorageは使用しない（Supabaseのみ）
- サンプルデータは使用しない
