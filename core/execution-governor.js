export function validateRequest(request) {

  if (!request.message) {
    return {
      status: "DENY",
      reason: "EMPTY_REQUEST"
    };
  }

  return {
    status: "ALLOW"
  };
}
