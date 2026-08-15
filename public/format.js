export function toViewModel(graph, keyResults) {
  return {
    objective: graph.objective,
    summary: graph.summary,
    graph,
    variables: graph.nodes,
    relationships: graph.edges,
    rankedVariables: graph.rankings,
    keyResults,
  };
}

export function defaultInfluenceValue(variable) {
  return variable.influenceable ? 4 : 2;
}

export function formatType(type) {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
