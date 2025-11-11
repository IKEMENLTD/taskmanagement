-- LINE Messaging API設定テーブル
-- 組織ごとのLINE通知設定を管理

CREATE TABLE IF NOT EXISTS public.line_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- LINE API設定
  enabled BOOLEAN DEFAULT false,
  channel_access_token TEXT,
  group_id TEXT,

  -- スケジュール設定
  scheduled_time TEXT DEFAULT '18:30',
  selected_members TEXT[] DEFAULT '{}',
  last_sent_date DATE,

  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 制約
  UNIQUE(organization_id)
);

-- RLS (Row Level Security) ポリシーを有効化
ALTER TABLE public.line_settings ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全ての組織のLINE設定を読み取れる
CREATE POLICY "Authenticated users can read LINE settings"
  ON public.line_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 認証済みユーザーはLINE設定を更新できる
CREATE POLICY "Authenticated users can update LINE settings"
  ON public.line_settings
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 認証済みユーザーはLINE設定を作成できる
CREATE POLICY "Authenticated users can insert LINE settings"
  ON public.line_settings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 認証済みユーザーはLINE設定を削除できる
CREATE POLICY "Authenticated users can delete LINE settings"
  ON public.line_settings
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_line_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER line_settings_updated_at
  BEFORE UPDATE ON public.line_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_line_settings_updated_at();

-- インデックス
CREATE INDEX IF NOT EXISTS idx_line_settings_organization_id
  ON public.line_settings(organization_id);

-- コメント
COMMENT ON TABLE public.line_settings IS 'LINE Messaging API設定（組織ごと）';
COMMENT ON COLUMN public.line_settings.channel_access_token IS 'LINEチャネルアクセストークン';
COMMENT ON COLUMN public.line_settings.group_id IS 'LINE通知先グループID';
COMMENT ON COLUMN public.line_settings.scheduled_time IS '日報送信時刻 (HH:MM形式)';
COMMENT ON COLUMN public.line_settings.selected_members IS '日報対象メンバー名のリスト';
COMMENT ON COLUMN public.line_settings.last_sent_date IS '最後に日報を送信した日付';
