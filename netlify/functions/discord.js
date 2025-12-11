// netlify/functions/discord.js
exports.handler = async function(event, context) {
  // 透過 Netlify 環境變數讀取 Webhook URL (防止前端洩露)
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL; 

  if (!webhookUrl) {
    return { statusCode: 500, body: "Discord Webhook URL not configured." };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { slotName } = JSON.parse(event.body);

    const message = `@everyone ⚠️ 召喚！【${slotName}】5人戰隊已集結完畢！請準備上線！`;
    
    // 發送請求給 Discord
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message,
        username: "Gaming Squad Bot",
        avatar_url: "https://i.imgur.com/L1N7iH6.png" // 替換成你喜歡的 Bot 頭像
      })
    });

    return { statusCode: 200, body: "Discord message sent successfully." };
  } catch (error) {
    console.error("Discord error:", error);
    return { statusCode: 500, body: `Failed to send Discord notification: ${error.toString()}` };
  }
};