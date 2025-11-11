# LINE設定のSupabase移行ガイド

## 概要

LINE Messaging API設定を`localStorage`からSupabaseデータベースに移行し、複数のブラウザ・デバイスから設定を共有できるようにしました。

## セットアップ手順

### 1. データベーステーブルの作成

Supabaseのダッシュボードで以下のSQLを実行してください：

```sql
-- database/line_settings.sql の内容を実行
```

または、Supabase CLIを使用する場合：

```bash
supabase db push
```

### 2. 既存データの確認（任意）

既存のlocalStorageにLINE設定がある場合、初回ログイン時に自動的にSupabaseに移行されます。

### 3. 動作確認

1. アプリケーションにログイン
2. 設定パネルを開く
3. 「LINE通知」タブに移動
4. LINE設定を入力・保存
5. 別のブラウザでログインして、設定が共有されていることを確認

## 主な変更点

### 保存場所の変更

- **Before**: `localStorage` (ブラウザローカル)
- **After**: Supabase `line_settings` テーブル

### 機能強化

- ✅ 複数デバイス・ブラウザ間で設定を共有
- ✅ 組織ごとに設定を管理
- ✅ Row Level Security (RLS) によるアクセス制御
- ✅ localStorageへのバックアップ（オフライン時用）
- ✅ 既存設定の自動マイグレーション

## データ構造

```typescript
interface LineSettings {
  id: string;                    // UUID
  organization_id: string;       // 組織ID
  enabled: boolean;              // 有効化フラグ
  channel_access_token: string;  // LINEチャネルアクセストークン
  group_id: string;             // LINE通知先グループID
  scheduled_time: string;       // 送信時刻 (HH:MM形式)
  selected_members: string[];   // 対象メンバー名リスト
  last_sent_date: string | null; // 最終送信日
  created_at: timestamp;        // 作成日時
  updated_at: timestamp;        // 更新日時
}
```

## API変更

### `saveLineSettings()`

```typescript
// Before
saveLineSettings(settings: LineSettings): boolean

// After
saveLineSettings(organizationId: string, settings: LineSettings): Promise<{success: boolean, error?: string}>
```

### `getLineSettings()`

```typescript
// Before
getLineSettings(): LineSettings

// After
getLineSettings(organizationId: string): Promise<LineSettings>
```

## セキュリティ

### Row Level Security (RLS) ポリシー

1. **読み取り**: 組織メンバーは自分の組織の設定を読み取れる
2. **作成**: 組織管理者のみが設定を作成できる
3. **更新**: 組織管理者のみが設定を更新できる
4. **削除**: 組織管理者のみが設定を削除できる

### Channel Access Tokenの取り扱い

- Supabaseに暗号化されて保存
- HTTPS通信で送受信
- localStorageにもバックアップ（ブラウザのセキュリティに依存）

## トラブルシューティング

### 設定が保存されない

1. Supabaseの接続を確認
2. ユーザーが組織に所属しているか確認
3. ユーザーが管理者権限を持っているか確認
4. ブラウザのコンソールでエラーを確認

### 設定が共有されない

1. 両方のブラウザで同じユーザーアカウントでログインしているか確認
2. 同じ組織に所属しているか確認
3. Supabaseのテーブルにデータが保存されているか確認

```sql
-- Supabaseダッシュボードで実行
SELECT * FROM line_settings WHERE organization_id = 'your-org-id';
```

### マイグレーションが失敗する

localStorageから手動でエクスポートして、設定画面で再入力してください。

## 今後の拡張

- [ ] 設定履歴の記録
- [ ] 複数の通知先グループの管理
- [ ] スケジュールの複数設定
- [ ] 通知テンプレートのカスタマイズ

## 関連ファイル

- `database/line_settings.sql` - テーブル定義
- `src/utils/lineMessagingApiUtils.js` - LINE API ユーティリティ
- `src/components/settings/LineNotifySettings.jsx` - LINE設定UI
- `src/components/views/DailyReportView.jsx` - 日報ビュー

## サポート

問題が発生した場合は、開発チームにお問い合わせください。
