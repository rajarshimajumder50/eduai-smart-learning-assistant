export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers: corsHeaders()
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return jsonResponse({ error: "Gemini API key missing." }, 500);
  }

  try {
    const body = await request.json();
    const { prompt, system } = body || {};

    if (!prompt || typeof prompt !== "string") {
      return jsonResponse({ error: "Prompt is required." }, 400);
    }

    const finalPrompt = `${system || "You are EduAI, a helpful educational AI assistant."}\n\nUser request:\n${prompt}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }]
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return jsonResponse({
        error: data?.error?.message || "Gemini API request failed."
      }, geminiResponse.status);
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
      "No response generated.";

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
