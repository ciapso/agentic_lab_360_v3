import { WorkflowGraph } from './types';

// Example: generate Python code from workflow graph
export function generateCodeFromWorkflow(graph: WorkflowGraph): string {
  // Traverse nodes/edges and build code string
  let code = "# Generated code\n";
  for (const node of graph.nodes) {
    if (node.type === 'initial-node') {
      code += `# Start: ${node.data.title}\n`;
    }
    // ...handle other node types...
  }
  return code;
}