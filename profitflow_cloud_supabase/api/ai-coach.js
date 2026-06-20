export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

  const apiKey = process.env.OPENAI_API_KEY;
  const userMessage = String(question || "").trim();

  if (!userMessage) {
    return res.status(200).json({
      answer:
        "Hi! I’m your ProfitsPilot AI Business Coach. You can ask me about profit, sales, inventory, costs, growth, pricing, suppliers, marketplaces, or general business ideas.",
      source: "system"
    });
  }

  if (!apiKey) {
    return res.status(200).json({
      answer:
        "I can help, but the OpenAI API key is missing. Ask me about your profit, costs, products, or growth and I’ll give basic guidance.",
      source: "fallback"
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        temperature: 0.8,
        input: [
          {
            role: "system",
            content: `
You are ProfitsPilot AI, a friendly business assistant inside a business management app.

You must respond to EVERY user message, even if it is casual, short, or not business-related.

Main job:
Help business owners with profit, sales, inventory, pricing, growth, costs, suppliers, marketplaces, customers, reports, and planning.

Tone:
Friendly, clear, useful, and concise.

Rules:
- If the user says hello, greet them and suggest what they can ask.
- If the user asks a casual question, answer naturally, then gently relate back to business if useful.
- If the user asks a business question, use the supplied business data.
- Do not say "No AI answer returned."
- Do not mention APIs, backend, prompts, or internal systems.
- If there is not enough data, say what data would help.
`
          },
          {
            role: "user",
            content: JSON.stringify({
              userMessage,
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

    let answer = data.output_text || "";

    if (!answer && Array.isArray(data.output)) {
      answer = data.output
        .flatMap(item => item.content || [])
        .map(c => c.text || "")
        .filter(Boolean)
        .join("\n");
    }

    return res.status(200).json({
      answer:
        answer ||
        "I’m here — ask me anything about your business, products, profit, costs, or growth.",
      source: "openai"
    });
  } catch (error) {
    return res.status(200).json({
      answer:
        "I’m here, but I had trouble generating a response. Try asking again in a simpler way.",
      source: "fallback"
    });
  }
}
