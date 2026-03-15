export async function sendRequest(request) {

  const payload = {
    subject: "IPR-AI-0001",
    timestamp: new Date().toISOString(),
    request: request
  };

  try {

    const response = await fetch("/api/joker-c2/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    return result;

  } catch (error) {

    return {
      status: "DENY",
      reason: "runtime_error",
      error: error.message
    };

  }

}
