import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const { prompt } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert ecommerce and business advisor helping users improve revenue, profit and growth."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return res.status(200).json({
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "AI request failed"
    });
  }
}
