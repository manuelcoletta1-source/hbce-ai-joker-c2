export async function fetchPublicProof() {
  try {
    const response = await fetch("/api/joker-c2/proof");

    const result = await response.json();

    return result;

  } catch (error) {
    return {
      status: "DENY",
      reason: "proof_fetch_error",
      error: error.message
    };
  }
}

export async function inspectPublicProof() {
  const proof = await fetchPublicProof();

  if (proof.status !== "ALLOW") {
    console.error("JOKER-C2 public proof unavailable:", proof.reason);
    return;
  }

  console.group("JOKER-C2 PUBLIC VERIFICATION PROOF");
  console.log("IPR:", proof.ipr_id);
  console.log("Entity:", proof.entity_name);
  console.log("Baseline Event:", proof.baseline_event);
  console.log("Latest Event:", proof.latest_event_id);
  console.log("Latest Event Hash:", proof.latest_event_hash);
  console.log("Merkle Root:", proof.merkle_root);
  console.log("Total Events:", proof.total_events);
  console.log("Anchors:", proof.anchors);
  console.groupEnd();
}
