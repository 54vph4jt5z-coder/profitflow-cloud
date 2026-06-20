export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is missing in Vercel"
    });
  }

  const {
    question,
    stats,
    forecast,
    recentOrders,
    recentCosts,
    businessName,
    currency
  } = req.body || {};

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are ProfitsPilot AI Business Coach. Give specific, useful business advice based on the user's numbers. Be concise, practical, and different for each question."
          },
          {
            role: "user",
            content: JSON.stringify({
              question,
              businessName,
              currency,
              stats,
              forecast,
              recentOrders,
              recentCosts
            })
          }
        ]
      })
    });

  const data = await response.json();

let answer = "";

if (data.output_text) {
  answer = data.output_text;
} else if (data.output?.length) {
  answer = data.output
    .flatMap(item => item.content || [])
    .filter(c => c.type === "output_text")
    .map(c => c.text)
    .join("\n");
}

return res.status(200).json({
  answer: answer || "No AI answer returned.",
  source: "openai",
  debug: data
});
  } catch (error) {
    return res.status(500).json({
      error: String(error?.message || error)
    });
  }
}
