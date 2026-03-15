function buildAgentId(name) {
  return `agent-${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAgent(name, role, input) {
  return {
    agent_id: buildAgentId(name),
    name,
    role,
    status: "READY",
    input,
    created_at: new Date().toISOString()
  };
}

function runAgent(agent) {
  const message =
    typeof agent.input === "string"
      ? agent.input
      : agent.input?.payload?.message || JSON.stringify(agent.input);

  return {
    ...agent,
    status: "COMPLETED",
    output: `[${agent.name}] processed: ${message}`,
    completed_at: new Date().toISOString()
  };
}

export async function runAgents(payload) {
  if (!payload || !payload.request) {
    return {
      status: "DENY",
      reason: "missing_agent_input"
    };
  }

  const planner = createAgent("planner", "task_planning", payload.request);
  const analyst = createAgent("analyst", "analysis", payload.request);
  const verifier = createAgent("verifier", "verification", payload.request);

  const completedAgents = [
    runAgent(planner),
    runAgent(analyst),
    runAgent(verifier)
  ];

  return {
    status: "ALLOW",
    mode: "multi-agent",
    agents: completedAgents,
    output: completedAgents.map((agent) => agent.output).join("\n")
  };
}
