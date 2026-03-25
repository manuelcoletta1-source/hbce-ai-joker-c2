import {
  getLocalNode,
  getNetworkNodes,
  getNetworkStatus,
  probeNetwork,
  type JokerNode,
  type JokerNodeProbe
} from "../joker-network";

import type {
  HBCENetworkStatus,
  HBCENodeDescriptor,
  HBCENodeProbe
} from "./node-types";

function mapNode(node: JokerNode): HBCENodeDescriptor {
  return {
    node_id: node.node_id,
    region: node.region,
    country: node.country,
    role: node.role,
    status: node.status,
    endpoint: node.endpoint
  };
}

function mapProbe(probe: JokerNodeProbe): HBCENodeProbe {
  return {
    node_id: probe.node_id,
    endpoint: probe.endpoint,
    reachable: probe.reachable,
    status: probe.status,
    checked_at: probe.checked_at
  };
}

export function nodeGetLocalDescriptor(): HBCENodeDescriptor {
  return mapNode(getLocalNode());
}

export function nodeGetDescriptors(): HBCENodeDescriptor[] {
  return getNetworkNodes().map(mapNode);
}

export function nodeGetNetworkSummary(): HBCENetworkStatus {
  const status = getNetworkStatus();

  return {
    total_nodes: status.total_nodes,
    active_nodes: status.active_nodes,
    inactive_nodes: status.inactive_nodes
  };
}

export async function nodeProbeNetwork(): Promise<HBCENodeProbe[]> {
  const probes = await probeNetwork();
  return probes.map(mapProbe);
}

export async function nodeGetNetworkSnapshot(): Promise<{
  local_node: HBCENodeDescriptor;
  nodes: HBCENodeDescriptor[];
  status: HBCENetworkStatus;
  probes: HBCENodeProbe[];
}> {
  const probes = await nodeProbeNetwork();

  return {
    local_node: nodeGetLocalDescriptor(),
    nodes: nodeGetDescriptors(),
    status: nodeGetNetworkSummary(),
    probes
  };
}
