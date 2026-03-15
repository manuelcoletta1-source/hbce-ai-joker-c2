export function buildResponse(runtimeResult) {

  if (!runtimeResult) {
    return {
      status: "DENY",
      message: "No response from runtime."
    };
  }

  if (runtimeResult.status === "DENY") {
    return {
      status: "DENY",
      message: "Operation denied by governance runtime.",
      reason: runtimeResult.reason || "unknown"
    };
  }

  if (runtimeResult.status === "ALLOW") {
    return {
      status: "ALLOW",
      message: runtimeResult.output || "Operation executed.",
      evidence: runtimeResult.evidence || null
    };
  }

  return {
    status: "UNKNOWN",
    message: "Unexpected runtime response."
  };
}
