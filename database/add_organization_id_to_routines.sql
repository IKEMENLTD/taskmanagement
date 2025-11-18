-- ルーティン関連テーブルにorganization_id列を追加して組織ベースの共有を実現

-- 1. routine_tasksテーブルにorganization_id列を追加
ALTER TABLE routine_tasks
ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- 2. routine_categoriesテーブルにorganization_id列を追加
ALTER TABLE routine_categories
ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- 3. 既存のroutine_tasksデータにorganization_idを設定
-- user_idから対応するorganization_idを取得して設定
UPDATE routine_tasks rt
SET organization_id = u.id
FROM users u
WHERE rt.user_id = u.id;

-- 4. 既存のroutine_categoriesデータのorganization_idを設定
-- 最初のユーザーのorganization_idを使用（カテゴリはグローバルな可能性があるため）
UPDATE routine_categories rc
SET organization_id = (SELECT id FROM users LIMIT 1)
WHERE rc.organization_id IS NULL;

-- 5. インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_routine_tasks_organization_id ON routine_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_routine_tasks_date ON routine_tasks(date);
CREATE INDEX IF NOT EXISTS idx_routine_categories_organization_id ON routine_categories(organization_id);

-- 6. コメント追加
COMMENT ON COLUMN routine_tasks.organization_id IS '組織ID - ルーティンタスクを組織全体で共有';
COMMENT ON COLUMN routine_categories.organization_id IS '組織ID - ルーティンカテゴリーを組織全体で共有';

-- 実行後の確認クエリ
-- SELECT COUNT(*) FROM routine_tasks WHERE organization_id IS NULL;
-- SELECT COUNT(*) FROM routine_categories WHERE organization_id IS NULL;
