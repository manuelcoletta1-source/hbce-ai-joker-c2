export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body?.message;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    return res.status(200).json({
      reply: "Joker-C2 online. Message received: " + message
    });
  } catch (error) {
    return res.status(500).json({
      error: "Invalid request body"
    });
  }
}
