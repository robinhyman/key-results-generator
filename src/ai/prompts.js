const sharedSystemInstruction = [
  "You are an OKR planning analyst.",
  "Generate concise, realistic, graph-backed OKR planning data.",
  "Work from causal relationships: objective -> outcome evidence -> drivers -> upstream causes and failure modes.",
  "Prefer measurable, influenceable, domain-specific variables over generic activity or vanity metrics.",
  "Use only the provided objective, graph, schema, and user clarification data; do not invent external facts.",
  "Return valid JSON only, exactly matching the requested schema.",
].join(" ");

const graphTaskInstruction = [
  "Create a causal metrics graph for the objective.",
  "Treat the objective as the downstream outcome, then work backward through measurable evidence, experience factors, operating drivers, upstream causes, and failure modes.",
  "Use domain-specific variables that a team could plausibly understand and influence during an OKR period.",
  "Prefer concrete measurable factors over generic activity, effort, engagement, or vanity metrics.",
  "Include one outcome node, useful non-outcome nodes across stages 1-3, and directional cause-to-effect edges with concise rationales.",
  "Estimate impact, confidence, influenceability, stage, and desired direction for each node.",
  "Return only schema-valid JSON.",
].join(" ");

const keyResultsTaskInstruction = [
  "Generate 3 to 5 final key results from the clarified causal metrics graph.",
  "Select only existing non-outcome graph variables and preserve each selected variableId.",
  "Set indicatorType to either leading or lagging for every key result.",
  "Use the graph ranking plus the user's influenceability and perceived-gap ratings to choose variables that are high-impact, realistically influenceable, and important now.",
  "Produce a balanced set with 1 or 2 lagging KRs and 2 or 3 leading KRs.",
  "Lagging KRs should usually use downstream evidence or experience measures; leading KRs should usually use operating drivers, upstream drivers, or failure-mode reductions that plausibly move the lagging measures.",
  "Make each KR measurable, time-bounded, and outcome-oriented rather than an activity checklist.",
  "In each rationale, explain how the graph and user clarification influenced the choice.",
  "Return only schema-valid JSON.",
].join(" ");

export function buildGraphPrompt(objective) {
  return [
    `Objective: ${objective}`,
    graphTaskInstruction,
    "Use 8 to 10 nodes, including exactly one outcome node at stage 4.",
    "Use stable lowercase kebab-case ids. Scores are integers from 1 to 100. Stages are integers 1 to 4.",
    "Return only data that fits the schema.",
  ].join("\n");
}

export function buildKeyResultsPrompt(graph) {
  return [
    `Objective: ${graph.objective}`,
    keyResultsTaskInstruction,
    JSON.stringify({
      summary: graph.summary,
      nodes: graph.nodes,
      edges: graph.edges,
      rankings: graph.rankings.slice(0, 6),
      assessments: graph.assessments,
    }),
  ].join("\n");
}

export function buildResponseInput(prompt) {
  return [
    {
      role: "system",
      content: sharedSystemInstruction,
    },
    {
      role: "user",
      content: prompt,
    },
  ];
}
