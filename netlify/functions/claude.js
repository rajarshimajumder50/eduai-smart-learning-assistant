export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("", { status: 200, headers: corsHeaders() });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return jsonResponse({ error: "Groq API key missing." }, 500);
  }

  try {
    const body = await request.json();
    const { prompt, system } = body || {};

    if (!prompt || typeof prompt !== "string") {
      return jsonResponse({ error: "Prompt is required." }, 400);
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: system || "You are EduAI, a helpful educational AI assistant designed for students. Give clear, simple, student-friendly answers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return jsonResponse({
        error: data?.error?.message || "Groq API request failed."
      }, groqResponse.status);
    }

    const reply = data?.choices?.[0]?.message?.content || "No response generated.";

    return jsonResponse({ reply }, 200);
  } catch (error) {
    return jsonResponse({ error: error.message || "Server error." }, 500);
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders()
  });
}
