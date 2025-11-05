-- ===================================
-- チーム共有機能のためのテーブル作成
-- ===================================

-- 1. プロジェクトテーブル
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  timeline_start DATE,
  timeline_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. タスクテーブル
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  progress INTEGER DEFAULT 0,
  assignee TEXT,
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  dependencies BIGINT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. チームメンバーテーブル
CREATE TABLE IF NOT EXISTS team_members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'メンバー',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- 5. RLS（Row Level Security）ポリシーを設定
-- すべてのユーザーがデータを読み書きできるようにする（チーム共有）

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "全員がプロジェクトを閲覧可能" ON projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "全員がプロジェクトを作成可能" ON projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "全員がプロジェクトを更新可能" ON projects
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "全員がプロジェクトを削除可能" ON projects
  FOR DELETE USING (auth.role() = 'authenticated');

-- Tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "全員がタスクを閲覧可能" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "全員がタスクを作成可能" ON tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "全員がタスクを更新可能" ON tasks
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "全員がタスクを削除可能" ON tasks
  FOR DELETE USING (auth.role() = 'authenticated');

-- Team Members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "全員がチームメンバーを閲覧可能" ON team_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "全員がチームメンバーを作成可能" ON team_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "全員がチームメンバーを更新可能" ON team_members
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "全員がチームメンバーを削除可能" ON team_members
  FOR DELETE USING (auth.role() = 'authenticated');

-- 6. ルーティンタスクテーブル
CREATE TABLE IF NOT EXISTS routine_tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  time TEXT,
  category TEXT,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  assignee TEXT,
  repeat TEXT,
  duration INTEGER,
  status TEXT DEFAULT 'pending',
  skip_reason TEXT,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ルーティンカテゴリーテーブル
CREATE TABLE IF NOT EXISTS routine_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 8. 追加インデックスを作成
CREATE INDEX IF NOT EXISTS idx_routine_tasks_user_id ON routine_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_tasks_date ON routine_tasks(date);
CREATE INDEX IF NOT EXISTS idx_routine_tasks_status ON routine_tasks(status);
CREATE INDEX IF NOT EXISTS idx_routine_categories_created_at ON routine_categories(created_at);

-- 9. ルーティン関連のRLSポリシー
-- Routine Tasks
ALTER TABLE routine_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "全員がルーティンタスクを閲覧可能" ON routine_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "全員がルーティンタスクを作成可能" ON routine_tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "全員がルーティンタスクを更新可能" ON routine_tasks
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "全員がルーティンタスクを削除可能" ON routine_tasks
  FOR DELETE USING (auth.role() = 'authenticated');

-- Routine Categories
ALTER TABLE routine_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "全員がルーティンカテゴリーを閲覧可能" ON routine_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "全員がルーティンカテゴリーを作成可能" ON routine_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "全員がルーティンカテゴリーを更新可能" ON routine_categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "全員がルーティンカテゴリーを削除可能" ON routine_categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- 10. リアルタイム同期を有効化
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE routine_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE routine_categories;
