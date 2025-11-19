-- ルーティン関連テーブルにorganization_id列を追加して組織ベースの共有を実現

-- 1. routine_tasksテーブルにorganization_id列を追加（存在しない場合のみ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'routine_tasks' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE routine_tasks ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
END $$;

-- 2. routine_categoriesテーブルにorganization_id列を追加（存在しない場合のみ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'routine_categories' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE routine_categories ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
END $$;

-- 3. 既存のroutine_tasksデータにorganization_idを設定
-- 全てのNULLデータを最初の組織に設定（シンプルなアプローチ）
UPDATE routine_tasks
SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
WHERE organization_id IS NULL;

-- 4. 既存のroutine_categoriesデータのorganization_idを設定
-- 全てのNULLデータを最初の組織に設定
UPDATE routine_categories
SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
WHERE organization_id IS NULL;

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
