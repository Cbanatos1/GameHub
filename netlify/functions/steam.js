// netlify/functions/steam.js
const https = require("https");

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          reject(
            new Error(
              `Status code ${res.statusCode}, body: ${body.slice(0, 200)}`
            )
          );
        });
        return;
      }

      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.end();
  });
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const appId = body.appId;
    const url = body.url;

    if (!appId) {
      return {
        statusCode: 400,
        body: "Missing appId in request body.",
      };
    }

    // 用香港區＋繁中
    const apiUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=hk&l=tchinese`;

    const json = await getJson(apiUrl);
    const wrapper = json[appId];

    if (!wrapper || !wrapper.success) {
      return {
        statusCode: 404,
        body: `Steam app ${appId} not found or success=false.`,
      };
    }

    const data = wrapper.data || {};
    const price = data.price_overview || null;

    let priceText;
    if (price) {
      const finalAmount = (price.final || 0) / 100;
      const currency = price.currency || "";
      priceText = `${currency} ${finalAmount.toFixed(2)}`;
      if (price.discount_percent) {
        priceText += ` (-${price.discount_percent}%)`;
      }
    } else if (data.is_free) {
      priceText = "免費遊玩";
    } else {
      priceText = "價格未提供";
    }

    const payload = {
      appId,
      url: url || `https://store.steampowered.com/app/${appId}`,
      name: data.name || "",
      headerImage: data.header_image || "",
      shortDescription: data.short_description || "",
      priceText,
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    };
  } catch (err) {
    console.error("Steam function error:", err);
    return {
      statusCode: 500,
      body: `Failed to fetch Steam metadata: ${err.toString()}`,
    };
  }
};
