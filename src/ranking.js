export function applyClarifications(graph, clarifications = {}) {
  const assessments = normalizeAssessments(clarifications);
  const nodes = graph.nodes.map((node) => {
    const assessment = assessments[node.id];
    if (!assessment) {
      return { ...node };
    }

    return {
      ...node,
      userInfluenceability: assessment.influenceability,
      userGap: assessment.gap,
    };
  });

  return {
    ...graph,
    nodes,
    edges: graph.edges.map((edge) => ({ ...edge })),
    assessments,
    rankings: rankVariables(nodes),
  };
}

export function rankVariables(variables) {
  return variables
    .filter((variable) => variable.type !== "outcome")
    .map((variable) => ({
      ...variable,
      nodeId: variable.id,
      score: Math.round(
        variable.impact * 0.55 +
          variable.confidence * 0.25 +
          influenceabilityScore(variable) +
          gapScore(variable) +
          typeWeight(variable.type),
      ),
    }))
    .sort((left, right) => right.score - left.score || right.impact - left.impact);
}

export function indicatorTypeForVariable(variable) {
  return ["evidence", "experience"].includes(variable?.type) ? "lagging" : "leading";
}

function typeWeight(type) {
  return {
    evidence: 10,
    driver: 7,
    "failure-mode": 8,
    experience: 5,
    "upstream-driver": 3,
  }[type] ?? 0;
}

function normalizeAssessments(clarifications) {
  return Object.fromEntries(
    Object.entries(clarifications)
      .map(([nodeId, assessment]) => [
        nodeId,
        {
          influenceability: clampAssessment(assessment?.influenceability),
          gap: clampAssessment(assessment?.gap),
        },
      ])
      .filter(([, assessment]) => assessment.influenceability > 0 || assessment.gap > 0),
  );
}

function clampAssessment(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(1, Math.min(5, Math.round(number)));
}

function influenceabilityScore(variable) {
  if (variable.userInfluenceability) {
    return variable.userInfluenceability * 5;
  }

  return variable.influenceable ? 18 : 0;
}

function gapScore(variable) {
  return variable.userGap ? variable.userGap * 4 : 0;
}
