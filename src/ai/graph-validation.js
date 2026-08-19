export function validateGraphSemantics(graph, { label, requireReachableOutcome = true }) {
  const nodeIds = new Set();
  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) {
      throw new Error(`AI ${label} contains duplicate node id: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  const edgeIds = new Set();
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) {
      throw new Error(`AI ${label} contains duplicate edge id: ${edge.id}`);
    }
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target) {
      throw new Error(`AI ${label} contains an invalid edge: ${edge.id}`);
    }
  }

  const outcomes = graph.nodes.filter((node) => node.type === "outcome" && node.stage === 4);
  if (outcomes.length !== 1) {
    throw new Error(`AI ${label} must include exactly one stage-4 outcome.`);
  }

  if (hasCycle(graph)) {
    throw new Error(`AI ${label} must be acyclic.`);
  }

  if (requireReachableOutcome && !allNodesReachOutcome(graph, outcomes[0].id)) {
    throw new Error(`AI ${label} must connect every node to the stage-4 outcome.`);
  }
}

export function validatePlanningSubset(fullGraph, planningGraph) {
  const fullNodeIds = new Set(fullGraph.nodes.map((node) => node.id));
  const missingNode = planningGraph.nodes.find((node) => !fullNodeIds.has(node.id));
  if (missingNode) {
    throw new Error(`AI planning graph node is missing from the full graph: ${missingNode.id}`);
  }

  const fullEdgeKeys = new Set(fullGraph.edges.map((edge) => `${edge.source}->${edge.target}`));
  const missingEdge = planningGraph.edges.find((edge) => !fullEdgeKeys.has(`${edge.source}->${edge.target}`));
  if (missingEdge) {
    throw new Error(`AI planning graph edge is missing from the full graph: ${missingEdge.id}`);
  }
}

function hasCycle(graph) {
  const outgoing = edgesBySource(graph);
  const visiting = new Set();
  const visited = new Set();

  function visit(nodeId) {
    if (visiting.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visiting.add(nodeId);
    for (const edge of outgoing.get(nodeId) ?? []) {
      if (visit(edge.target)) {
        return true;
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  }

  return graph.nodes.some((node) => visit(node.id));
}

function allNodesReachOutcome(graph, outcomeId) {
  const outgoing = edgesBySource(graph);
  return graph.nodes.every((node) => reachesOutcome(node.id, outcomeId, outgoing, new Set()));
}

function reachesOutcome(nodeId, outcomeId, outgoing, seen) {
  if (nodeId === outcomeId) {
    return true;
  }
  if (seen.has(nodeId)) {
    return false;
  }
  seen.add(nodeId);
  return (outgoing.get(nodeId) ?? []).some((edge) =>
    reachesOutcome(edge.target, outcomeId, outgoing, seen),
  );
}

function edgesBySource(graph) {
  const outgoing = new Map(graph.nodes.map((node) => [node.id, []]));
  for (const edge of graph.edges) {
    outgoing.get(edge.source)?.push(edge);
  }
  return outgoing;
}
