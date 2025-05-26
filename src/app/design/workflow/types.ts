export type WorkflowNode = {
  id: string;
  type: string;
  data: Record<string, any>;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  data?: Record<string, any>;
};

export type WorkflowGraph = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};