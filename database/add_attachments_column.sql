-- タスクテーブルにattachmentsカラムを追加
-- ファイル添付機能のために必要

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- コメントを追加
COMMENT ON COLUMN tasks.attachments IS '添付ファイル情報（JSON配列: [{id, name, size, type, uploadDate, uploadTime, url, path}]）';
