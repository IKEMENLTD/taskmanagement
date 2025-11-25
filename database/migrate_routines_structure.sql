-- ルーティンの構造を修正：マスターと実行記録を分離
-- 実行日: 2025-11-19

-- ====================================
-- 1. routines テーブルを作成（マスター定義）
-- ====================================
CREATE TABLE IF NOT EXISTS routines (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  time TEXT,
  category TEXT,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  assignee TEXT,
  repeat TEXT DEFAULT 'daily',
  selected_days INTEGER[],
  duration INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_routines_organization_id ON routines(organization_id);
CREATE INDEX IF NOT EXISTS idx_routines_assignee ON routines(assignee);
CREATE INDEX IF NOT EXISTS idx_routines_is_active ON routines(is_active);

-- コメント追加
COMMENT ON TABLE routines IS 'ルーティンのマスター定義（繰り返しタスクの設定）';
COMMENT ON COLUMN routines.is_active IS 'ルーティンが有効かどうか（無効にしても実行記録は残る）';

-- ====================================
-- 2. 既存データを routines テーブルに移行
-- ====================================
-- routine_tasks から重複を除いてユニークなルーティンを抽出し、routines に挿入
INSERT INTO routines (
  organization_id,
  name,
  description,
  time,
  category,
  project_id,
  assignee,
  repeat,
  selected_days,
  duration,
  created_at,
  created_by
)
SELECT DISTINCT ON (
  organization_id,
  name,
  COALESCE(time::text, ''),
  COALESCE(category, ''),
  COALESCE(assignee, ''),
  COALESCE(repeat, 'daily'),
  COALESCE(project_id, 0)
)
  organization_id,
  name,
  description,
  time,
  category,
  project_id,
  assignee,
  COALESCE(repeat, 'daily') as repeat,
  selected_days,
  COALESCE(duration, 30) as duration,
  MIN(created_at) as created_at,
  user_id as created_by
FROM routine_tasks
WHERE organization_id IS NOT NULL
GROUP BY
  organization_id,
  name,
  description,
  time,
  category,
  project_id,
  assignee,
  repeat,
  selected_days,
  duration,
  user_id
ORDER BY
  organization_id,
  name,
  COALESCE(time::text, ''),
  COALESCE(category, ''),
  COALESCE(assignee, ''),
  COALESCE(repeat, 'daily'),
  COALESCE(project_id, 0),
  MIN(created_at);

-- ====================================
-- 3. routine_tasks に routine_id 列を追加
-- ====================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'routine_tasks' AND column_name = 'routine_id'
    ) THEN
        ALTER TABLE routine_tasks ADD COLUMN routine_id BIGINT REFERENCES routines(id) ON DELETE CASCADE;
    END IF;
END $$;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_routine_tasks_routine_id ON routine_tasks(routine_id);

-- ====================================
-- 4. 既存の routine_tasks に routine_id を設定
-- ====================================
-- 各 routine_task に対応する routine を見つけて、routine_id を設定
UPDATE routine_tasks rt
SET routine_id = r.id
FROM routines r
WHERE rt.routine_id IS NULL
  AND rt.organization_id = r.organization_id
  AND rt.name = r.name
  AND COALESCE(rt.time::text, '') = COALESCE(r.time::text, '')
  AND COALESCE(rt.category, '') = COALESCE(r.category, '')
  AND COALESCE(rt.assignee, '') = COALESCE(r.assignee, '')
  AND COALESCE(rt.repeat, 'daily') = COALESCE(r.repeat, 'daily')
  AND COALESCE(rt.project_id, 0) = COALESCE(r.project_id, 0);

-- ====================================
-- 5. RLS ポリシーを設定
-- ====================================
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "全員がルーティンを閲覧可能" ON routines
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "全員がルーティンを作成可能" ON routines
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "全員がルーティンを更新可能" ON routines
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "全員がルーティンを削除可能" ON routines
  FOR DELETE USING (auth.role() = 'authenticated');

-- ====================================
-- 6. リアルタイム同期を有効化
-- ====================================
ALTER PUBLICATION supabase_realtime ADD TABLE routines;

-- ====================================
-- 7. 確認クエリ
-- ====================================
-- 実行後に以下のクエリで確認
-- SELECT COUNT(*) as routines_count FROM routines;
-- SELECT COUNT(*) as tasks_with_routine_id FROM routine_tasks WHERE routine_id IS NOT NULL;
-- SELECT COUNT(*) as tasks_without_routine_id FROM routine_tasks WHERE routine_id IS NULL;
