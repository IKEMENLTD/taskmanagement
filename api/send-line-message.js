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

    // バリデーション
    if (!channelAccessToken || !groupId || !message) {
      return res.status(400).json({
        success: false,
        error: 'channelAccessToken、groupId、messageは必須です'
      });
    }

    // LINE Messaging APIへリクエスト送信
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        to: groupId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      })
    });

    // レスポンスチェック
    if (!lineResponse.ok) {
      const errorData = await lineResponse.json();
      console.error('LINE API Error:', JSON.stringify(errorData, null, 2));

      return res.status(lineResponse.status).json({
        success: false,
        error: errorData.message || 'LINEメッセージの送信に失敗しました',
        details: errorData
      });
    }

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
