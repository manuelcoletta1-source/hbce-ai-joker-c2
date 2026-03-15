import { buildRequest } from "../lib/request-builder.js";
import { sendRequest } from "../lib/joker-core-client.js";
import { buildResponse } from "../lib/response-builder.js";

const textarea = document.querySelector("textarea");
const sendButton = document.querySelector(".btn--primary");
const chatContainer = document.querySelector(".chat");

function appendMessage(author, label, body, meta = "") {
  const article = document.createElement("article");
  article.className = "message";

  article.innerHTML = `
    <div class="message__avatar">${label}</div>
    <div class="message__bubble">
      <div class="message__meta">
        <span class="message__author">${author}</span>
        <span>${meta || new Date().toLocaleString()}</span>
      </div>
      <div class="message__body">
        <p>${body}</p>
      </div>
    </div>
  `;

  chatContainer.appendChild(article);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function formatRuntimeMeta(runtimeResult, response) {
  const parts = [`status: ${response.status}`];

  if (runtimeResult.identity?.ipr_id) {
    parts.push(`ipr: ${runtimeResult.identity.ipr_id}`);
  }

  if (runtimeResult.identity?.baseline_event) {
    parts.push(`baseline: ${runtimeResult.identity.baseline_event}`);
  }

  if (runtimeResult.session_id) {
    parts.push(`session: ${runtimeResult.session_id}`);
  }

  if (runtimeResult.registry?.registry_ref) {
    parts.push(`registry: ${runtimeResult.registry.registry_ref}`);
  }

  if (runtimeResult.evidence?.evidence_id) {
    parts.push(`evidence: ${runtimeResult.evidence.evidence_id}`);
  }

  if (response.reason) {
    parts.push(`reason: ${response.reason}`);
  }

  return parts.join(" · ");
}

async function handleSend() {
  const userInput = textarea.value.trim();

  if (!userInput) {
    return;
  }

  appendMessage("Operator", "USER", userInput, "request submitted");
  textarea.value = "";

  const structuredRequest = buildRequest(userInput);
  const runtimeResult = await sendRequest(structuredRequest);
  const response = buildResponse(runtimeResult);

  appendMessage(
    "AI JOKER-C2",
    "J-C2",
    response.message,
    formatRuntimeMeta(runtimeResult, response)
  );
}

sendButton.addEventListener("click", handleSend);

textarea.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
});
