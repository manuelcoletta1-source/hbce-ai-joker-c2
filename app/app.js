function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAttachmentInput() {
  return document.querySelector('input[type="file"]');
}

function isTextReadableFile(file) {
  const name = (file?.name || "").toLowerCase();

  return (
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".json") ||
    file?.type?.startsWith("text/")
  );
}

async function readAttachment(file) {
  const base = {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size
  };

  if (!isTextReadableFile(file)) {
    return {
      ...base,
      text: "",
      content: "",
      note: "Metadata only. Text extraction not available in client runtime."
    };
  }

  try {
    const text = await file.text();

    return {
      ...base,
      text,
      content: text
    };
  } catch (error) {
    console.error("Attachment read failed:", error);

    return {
      ...base,
      text: "",
      content: "",
      note: "Read failed in client runtime."
    };
  }
}

async function buildAttachments() {
  const input = getAttachmentInput();

  if (!input || !input.files || input.files.length === 0) {
    return [];
  }

  const files = Array.from(input.files).slice(0, 8);
  return Promise.all(files.map(readAttachment));
}

function renderUserMessage(message, attachments = []) {
  const safeMessage = escapeHtml(message);
  const attachmentsBlock =
    attachments.length > 0
      ? `
      <div class="message__attachments">
        ${attachments
          .map(
            (item) => `
            <div class="message__attachment">
              📎 ${escapeHtml(item.name)}
            </div>
          `
          )
          .join("")}
      </div>
    `
      : "";

  return `
  <article class="message">
    <div class="message__avatar">YOU</div>
    <div class="message__bubble">
      <div class="message__meta">
        <span class="message__author">User</span>
      </div>
      <div class="message__body">${safeMessage}</div>
      ${attachmentsBlock}
    </div>
  </article>
  `;
}

function renderAiMessage(replyText) {
  return `
  <article class="message">
    <div class="message__avatar">AI</div>
    <div class="message__bubble">
      <div class="message__meta">
        <span class="message__author">Joker-C2</span>
      </div>
      <div class="message__body">${escapeHtml(replyText)}</div>
    </div>
  </article>
  `;
}

async function sendRequest() {
  const textarea = document.querySelector("textarea");
  const chat = document.querySelector(".chat");
  const attachmentInput = getAttachmentInput();

  if (!textarea || !chat) {
    return;
  }

  const message = textarea.value.trim();

  if (!message) {
    return;
  }

  const attachments = await buildAttachments();

  chat.insertAdjacentHTML("beforeend", renderUserMessage(message, attachments));

  textarea.value = "";

  if (attachmentInput) {
    attachmentInput.value = "";
  }

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        attachments
      })
    });

    const data = await response.json();

    const replyText =
      data?.reply?.content ||
      data?.error ||
      "Joker-C2 returned no response.";

    chat.insertAdjacentHTML("beforeend", renderAiMessage(replyText));
  } catch (error) {
    chat.insertAdjacentHTML(
      "beforeend",
      renderAiMessage("Network or runtime error while contacting /api/chat.")
    );

    console.error(error);
  }
}

const primaryButton = document.querySelector(".btn--primary");

if (primaryButton) {
  primaryButton.addEventListener("click", sendRequest);
}
