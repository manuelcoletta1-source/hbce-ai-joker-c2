export type JokerNode = {
  id: string;
  url: string;
  region: string;
  active: boolean;
};

const FEDERATION_NODES: JokerNode[] = [
  {
    id: "HBCE-MATRIX-NODE-0001-TORINO",
    url: "http://localhost:3000",
    region: "IT-PIEMONTE",
    active: true
  }
];

export function getActiveNodes(): JokerNode[] {
  return FEDERATION_NODES.filter((n) => n.active);
}

export function getNodeById(id: string): JokerNode | undefined {
  return FEDERATION_NODES.find((n) => n.id === id);
}
