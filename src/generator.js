import { buildCausalMetricsGraph } from "./graph-construction.js";
import {
  generateKeyResultsForGraph,
  selectKeyResultVariables,
} from "./key-results.js";
import {
  applyClarifications,
  indicatorTypeForVariable,
  rankVariables,
} from "./ranking.js";

export {
  applyClarifications,
  indicatorTypeForVariable,
  rankVariables,
};
export { exploreKeyResultSets } from "./candidate-sets.js";
export { selectKeyResultVariables } from "./key-results.js";

export function generateKeyResultsModel(rawObjective, clarifications = {}) {
  const graph = applyClarifications(generateCausalMetricsGraph(rawObjective), clarifications);
  const { candidateKeyResultSets, keyResults } = generateKeyResultsForGraph(graph, { count: 4 });

  return {
    objective: graph.objective,
    summary: graph.summary,
    graph,
    candidateKeyResultSets,
    keyResults,
  };
}

export function generateCausalMetricsGraph(rawObjective) {
  return buildCausalMetricsGraph(rawObjective, rankVariables);
}
