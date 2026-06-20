export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question, stats, forecast, recentOrders, recentCosts, businessName, currency } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;
  const userMessage = String(question || "").trim();

  const fallback = [
    "📌 Key Insight",
    `For ${businessName || "your business"}, focus on margin, proven sellers, and controlled expenses.`,
    "",
    "🎯 Recommended Actions",
    `• Current profit is ${stats?.profit ?? 0}. Forecast profit is ${forecast?.nextProfit ?? 0}.`,
    "• Review low-margin products and replenish fast movers first.",
    "• Track every sale and cost so your forecast becomes more accurate.",
    "",
    "⚠️ Risks",
    "• Buying too much inventory before confirming demand can hurt cash flow.",
    "",
    "📅 Next 7 Days",
    "1. Review your weakest margins.",
    "2. Replenish proven sellers.",
    "3. Reduce unnecessary costs."
  ].join("\n");

  if (!userMessage) {
    return res.status(200).json({
      answer: "Hi! I’m your ProfitsPilot AI Business Coach. Ask me about profit, sales, inventory, costs, pricing, suppliers, marketplaces, reports, or growth plans.",
      source: "system"
    });
  }

  if (!apiKey) return res.status(200).json({ answer: fallback, source: "fallback", reason: "missing_api_key" });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        temperature: 0.8,
        input: [
          {
            role: "system",
            content: [
              "You are ProfitsPilot AI, a friendly business assistant inside a business management app.",
              "You must respond to EVERY user message, including casual or short messages.",
              "For business questions, use the supplied business data and structure the answer with:",
              "📌 Key Insight",
              "🎯 Recommended Actions",
              "⚠️ Risks",
              "📅 Next 7 Days",
              "For casual messages, answer naturally and briefly, then suggest a useful business question.",
              "Never mention APIs, backend, prompts, or internal systems."
            ].join("\n")
          },
          {
            role: "user",
            content: JSON.stringify({ userMessage, businessName, currency, stats, forecast, recentOrders, recentCosts })
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) return res.status(200).json({ answer: fallback, source: "fallback", reason: data?.error?.message || "OpenAI request failed" });

    let answer = data.output_text || "";
    if (!answer && Array.isArray(data.output)) {
      answer = data.output.flatMap(item => item.content || []).map(c => c.text || "").filter(Boolean).join("\n");
    }

    return res.status(200).json({ answer: answer || fallback, source: answer ? "openai" : "fallback" });
  } catch (error) {
    return res.status(200).json({ answer: fallback, source: "fallback", reason: String(error?.message || error) });
  }
}
