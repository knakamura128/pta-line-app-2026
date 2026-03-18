export async function sendLinePushTextMessage(to: string, text: string) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    return {
      ok: false as const,
      error: "LINE_CHANNEL_ACCESS_TOKEN が未設定です。"
    };
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
      "X-Line-Retry-Key": crypto.randomUUID()
    },
    body: JSON.stringify({
      to,
      messages: [
        {
          type: "text",
          text
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      ok: false as const,
      error: errorText || `LINE Messaging API error: ${response.status}`
    };
  }

  return {
    ok: true as const
  };
}
