export function updateRuntimeStatus(runtimeResult) {
  if (!runtimeResult) {
    return;
  }

  const statusCards = document.querySelectorAll(".status-card__value");

  if (statusCards.length < 4) {
    return;
  }

  const identityValue = runtimeResult.identity?.ipr_id || "Unavailable";
  const stateValue = runtimeResult.state?.current_state || runtimeResult.status || "Unknown";
  const executionValue = runtimeResult.status === "ALLOW" ? "Allowed" : "Denied";
  const registryValue = runtimeResult.registry?.registry_ref || "Not appended";

  statusCards[0].textContent = identityValue;
  statusCards[1].textContent = stateValue;
  statusCards[2].textContent = executionValue;
  statusCards[3].textContent = registryValue;
}
