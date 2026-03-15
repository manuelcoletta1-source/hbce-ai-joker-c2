async function sendRequest(message) {

  const modelSelector = document.getElementById("model-selector");
  const preferredModel = modelSelector ? modelSelector.value : "openai";

  const payload = {
    model_preferences: {
      preferred_model: preferredModel
    },
    request: {
      payload: {
        message: message
      }
    }
  };

  try {

    const response = await fetch("/api/joker-c2/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    appendMessage("JOKER-C2", data.output || JSON.stringify(data));

  } catch (err) {

    appendMessage("SYSTEM", "Execution error: " + err.message);

  }
}

function appendMessage(author, text) {

  const chat = document.querySelector(".chat");

  const wrapper = document.createElement("article");
  wrapper.className = "message";

  const avatar = document.createElement("div");
  avatar.className = "message__avatar";
  avatar.innerText = author.substring(0,4);

  const bubble = document.createElement("div");
  bubble.className = "message__bubble";

  const meta = document.createElement("div");
  meta.className = "message__meta";

  const authorNode = document.createElement("span");
  authorNode.className = "message__author";
  authorNode.innerText = author;

  meta.appendChild(authorNode);

  const body = document.createElement("div");
  body.className = "message__body";
  body.innerText = text;

  bubble.appendChild(meta);
  bubble.appendChild(body);

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);

  chat.appendChild(wrapper);

  chat.scrollTop = chat.scrollHeight;
}

function initComposer() {

  const textarea = document.querySelector("textarea");
  const sendBtn = document.querySelector(".btn--primary");

  if (!textarea || !sendBtn) return;

  sendBtn.addEventListener("click", () => {

    const message = textarea.value.trim();

    if (!message) return;

    appendMessage("USER", message);

    textarea.value = "";

    sendRequest(message);

  });

}

document.addEventListener("DOMContentLoaded", () => {
  initComposer();
});
