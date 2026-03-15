import { buildRequest } from "../lib/request-builder.js";
import { sendRequest } from "../lib/joker-core-client.js";
import { buildResponse } from "../lib/response-builder.js";

const textarea = document.querySelector("textarea");
const sendButton = document.querySelector(".btn--primary");
const chatContainer = document.querySelector(".chat");

function appendMessage(author, label, body) {
  const article = document.createElement("article");
  article.className = "message";

  article.innerHTML = `
    <div class="message__avatar">${label}</div>
    <div class="message__bubble">
      <div class="message__meta">
        <span class="message__author">${author}</span>
        <span>${new Date().toLocaleString()}</span>
      </div>
      <div class="message__body">
        <p>${body}</p>
      </div>
    </div>
  `;

  chatContainer.appendChild(article);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function handleSend() {
  const userInput = textarea.value.trim();

  if (!userInput) {
    return;
  }

  appendMessage("Operator", "USER", userInput);
  textarea.value = "";

  const structuredRequest = buildRequest(userInput);
  const runtimeResult = await sendRequest(structuredRequest);
  const response = buildResponse(runtimeResult);

  appendMessage("AI JOKER-C2", "J-C2", response.message);
}

sendButton.addEventListener("click", handleSend);

textarea.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
});
