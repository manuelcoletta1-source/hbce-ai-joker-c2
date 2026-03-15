import { inspectPublicProof } from "./proof-viewer.js";

function initProofButton() {

  const proofButton = document.createElement("button");

  proofButton.innerText = "Verify Joker-C2";
  proofButton.className = "btn";

  proofButton.addEventListener("click", async () => {

    const proof = await fetch("/api/joker-c2/proof");
    const data = await proof.json();

    appendMessage(
      "VERIFY",
      JSON.stringify(data, null, 2)
    );

    inspectPublicProof();

  });

  const actions = document.querySelector(".btn-row");

  if (actions) {
    actions.appendChild(proofButton);
  }
}

document.addEventListener("DOMContentLoaded", () => {

  initComposer();
  initProofButton();

});
