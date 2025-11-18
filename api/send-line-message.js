/**
 * Vercel Serverless Function for LINE Messaging API
 *
 * このエンドポイントはフロントエンドからのリクエストを受け取り、
 * LINE Messaging APIへメッセージを送信します。
 *
 * CORS制限を回避するためのプロキシとして機能します。
 */

export default async function handler(req, res) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // プリフライトリクエストの処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { channelAccessToken, groupId, message } = req.body;

    // デバッグログ
    console.log('[send-line-message] リクエスト受信');
    console.log('[send-line-message] トークン長:', channelAccessToken?.length);
    console.log('[send-line-message] トークンプレビュー:', channelAccessToken?.substring(0, 20) + '...');
    console.log('[send-line-message] グループID:', groupId);
    console.log('[send-line-message] メッセージ長:', message?.length);

    // バリデーション
    if (!channelAccessToken || !groupId || !message) {
      console.error('[send-line-message] バリデーションエラー:', {
        hasToken: !!channelAccessToken,
        hasGroupId: !!groupId,
        hasMessage: !!message
      });
      return res.status(400).json({
        success: false,
        error: 'channelAccessToken、groupId、messageは必須です'
      });
    }

    // LINE Messaging APIへのリクエストボディを準備
    const requestBody = {
      to: groupId,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    };

    console.log('[send-line-message] LINE APIへリクエスト送信');
    console.log('[send-line-message] リクエストボディ:', JSON.stringify(requestBody));

    // LINE Messaging APIへリクエスト送信
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[send-line-message] LINE APIレスポンスステータス:', lineResponse.status);

    // レスポンスチェック
    if (!lineResponse.ok) {
      const errorData = await lineResponse.json();
      console.error('[send-line-message] LINE APIエラー詳細:', JSON.stringify(errorData, null, 2));

      return res.status(lineResponse.status).json({
        success: false,
        error: errorData.message || 'LINEメッセージの送信に失敗しました',
        details: errorData
      });
    }

    console.log('[send-line-message] 送信成功');

    // 成功レスポンス
    return res.status(200).json({
      success: true,
      message: 'メッセージを送信しました'
    });

  } catch (error) {
    console.error('Server Error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'サーバーエラーが発生しました'
    });
  }
}
