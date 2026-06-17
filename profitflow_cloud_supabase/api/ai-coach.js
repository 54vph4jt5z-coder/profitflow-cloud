export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { question, stats, forecast, businessName } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  const fallback = [
    `For ${businessName || "your business"}, focus on profit margin, fast-selling items, and controlled expenses.`,
    `Current profit is ${stats?.profit ?? 0}. Forecast profit is ${forecast?.nextProfit ?? 0}.`,
    "Recommended actions: review low-margin products, replenish fast movers, reduce unnecessary costs, and track every sale accurately."
  ].join("\\n\\n");

  if (!apiKey) {
    res.status(200).json({ answer: fallback });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `You are an expert small-business coach. Give concise practical advice. Question: ${question || "Give me advice"} Stats: ${JSON.stringify(stats)} Forecast: ${JSON.stringify(forecast)}`
      })
    });

    const data = await response.json();
    const answer =
      data.output_text ||
      data.output?.flatMap(o => o.content || []).map(c => c.text).filter(Boolean).join("\\n") ||
      fallback;

    res.status(200).json({ answer });
  } catch {
    res.status(200).json({ answer: fallback });
  }
}
