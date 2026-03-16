
async function sendRequest() {

  const textarea = document.querySelector("textarea");
  const chat = document.querySelector(".chat");

  if (!textarea || !chat) {
    return;
  }

  const message = textarea.value.trim();

  if (!message) {
    return;
  }

  const userBlock = `
  <article class="message">
    <div class="message__avatar">YOU</div>
    <div class="message__bubble">
      <div class="message__meta">
        <span class="message__author">User</span>
      </div>
      <div class="message__body">${message}</div>
    </div>
  </article>
  `;

  chat.insertAdjacentHTML("beforeend", userBlock);

  textarea.value = "";

  try {

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message
      })
    });

    const data = await response.json();

    const replyText =
      data?.reply?.content ||
      data?.error ||
      "Joker-C2 returned no response.";

    const aiBlock = `
    <article class="message">
      <div class="message__avatar">AI</div>
      <div class="message__bubble">
        <div class="message__meta">
          <span class="message__author">Joker-C2</span>
        </div>
        <div class="message__body">${replyText}</div>
      </div>
    </article>
    `;

    chat.insertAdjacentHTML("beforeend", aiBlock);

  } catch (error) {

    const aiBlock = `
    <article class="message">
      <div class="message__avatar">AI</div>
      <div class="message__bubble">
        <div class="message__meta">
          <span class="message__author">Joker-C2</span>
        </div>
        <div class="message__body">
        Network or runtime error while contacting /api/chat.
        </div>
      </div>
    </article>
    `;

    chat.insertAdjacentHTML("beforeend", aiBlock);

    console.error(error);
  }

}

const primaryButton = document.querySelector(".btn--primary");

if (primaryButton) {
  primaryButton.addEventListener("click", sendRequest);
}
