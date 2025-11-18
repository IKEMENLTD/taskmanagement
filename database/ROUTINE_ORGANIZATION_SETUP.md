# ルーティン機能の組織共有設定

## 概要

ルーティンタスクとルーティンカテゴリーを組織全体で共有できるようにします。

### 変更内容

- `routine_tasks`テーブルに`organization_id`列を追加
- `routine_categories`テーブルに`organization_id`列を追加
- 既存データを組織ベースに移行
- パフォーマンス向上のためのインデックス追加

---

## セットアップ手順

### ステップ1: Supabase Dashboardにアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択
3. 左サイドバーの **「SQL Editor」** をクリック

### ステップ2: SQLを実行

1. **「New query」** をクリック
2. `database/add_organization_id_to_routines.sql` の内容をコピー＆ペースト
3. **「Run」** をクリック

### ステップ3: 実行結果を確認

以下のクエリでNULLのデータがないことを確認：

```sql
SELECT COUNT(*) FROM routine_tasks WHERE organization_id IS NULL;
SELECT COUNT(*) FROM routine_categories WHERE organization_id IS NULL;
```

両方とも `0` が返されればOK。

---

## 変更の影響

### Before（修正前）
- ルーティンは`user_id`で管理
- 異なるPCで異なるユーザーでログインすると別のデータが表示される

### After（修正後）
- ルーティンは`organization_id`で管理
- どのPCからでも、同じ組織のユーザーであれば同じルーティンが表示される
- タスクやプロジェクトと同じ動作

---

## トラブルシューティング

### エラー: `column "organization_id" already exists`

すでに列が存在する場合は、このエラーが出ます。以下で確認：

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'routine_tasks' AND column_name = 'organization_id';
```

列が存在する場合は、SQLの`ALTER TABLE ADD COLUMN`部分をスキップして、
`UPDATE`と`CREATE INDEX`のみ実行してください。

### 既存データがない場合

`UPDATE`文でエラーが出る場合は、既存データがない可能性があります。
その場合は`UPDATE`部分をスキップしても問題ありません。

---

## 実行後の確認

### ルーティンタスクの確認

```sql
SELECT id, name, organization_id, user_id, date
FROM routine_tasks
ORDER BY created_at DESC
LIMIT 10;
```

### ルーティンカテゴリーの確認

```sql
SELECT id, name, organization_id
FROM routine_categories
ORDER BY created_at DESC;
```

---

## ロールバック（元に戻す）

もし問題が発生した場合は、以下のSQLで元に戻せます：

```sql
-- インデックスを削除
DROP INDEX IF EXISTS idx_routine_tasks_organization_id;
DROP INDEX IF EXISTS idx_routine_categories_organization_id;

-- 列を削除
ALTER TABLE routine_tasks DROP COLUMN organization_id;
ALTER TABLE routine_categories DROP COLUMN organization_id;
```

**注意**: これを実行すると`organization_id`のデータが失われます。
