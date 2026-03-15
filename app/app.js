async function sendRequest() {

  const textarea = document.querySelector("textarea");
  const message = textarea.value;

  if (!message) return;

  const chat = document.querySelector(".chat");

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

  const response = await fetch("/api/joker-c2/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: message
    })
  });

  const data = await response.json();

  const aiBlock = `
  <article class="message">
    <div class="message__avatar">AI</div>
    <div class="message__bubble">
      <div class="message__meta">
        <span class="message__author">Joker-C2</span>
      </div>
      <div class="message__body">${data.reply}</div>
    </div>
  </article>
  `;

  chat.insertAdjacentHTML("beforeend", aiBlock);

}

document.querySelector(".btn--primary")
  .addEventListener("click", sendRequest);
