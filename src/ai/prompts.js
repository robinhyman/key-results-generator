const sharedSystemInstruction = [
  "You are an OKR planning analyst.",
  "Generate concise, realistic, graph-backed OKR planning data.",
  "Work from causal relationships: objective -> outcome evidence -> drivers -> upstream causes and failure modes.",
  "Prefer measurable, influenceable, domain-specific variables over generic activity or vanity metrics.",
  "Use only the provided objective, graph, schema, and user clarification data; do not invent external facts.",
  "Return valid JSON only, exactly matching the requested schema.",
].join(" ");

const graphTaskInstruction = [
  "Create a rich causal map for the objective, then converge it into a smaller planning graph.",
  "Treat the objective as the downstream outcome, then work backward through measurable outcome evidence, experience factors, operating drivers, upstream constraints or capabilities, and failure modes.",
  "Use domain-specific variables that a team could plausibly understand and influence during an OKR period.",
  "Prefer concrete measurable factors over generic activity, effort, engagement, or vanity metrics.",
  "Build fullGraph first as broad causal discovery, comparable to a manual whiteboard exploration.",
  "Then build planningGraph by removing duplicate, vague, non-measurable, activity-shaped, and disconnected nodes.",
  "Select planningGraph nodes by outcome proximity, causal leverage, measurability, influenceability, diagnostic value, planning relevance, and penalties for externality, vanity metrics, and redundancy.",
  "Preserve causal branch coverage and useful paths across outcome evidence, experience measures, operating drivers, upstream constraints or capabilities, and failure modes.",
  "Include exactly one outcome node at stage 4 in each graph, useful non-outcome nodes across stages 1-3, and directional cause-to-effect edges with concise rationales.",
  "Add convergenceRationale to every planningGraph node explaining why it survived convergence.",
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
    "Use 40 to 60 nodes in fullGraph and 12 to 18 nodes in planningGraph.",
    "Use stable lowercase kebab-case ids. Scores are integers from 1 to 100. Stages are integers 1 to 4.",
    "planningGraph nodes should be a meaningful subset of fullGraph nodes unless a retained node needs a clearer consolidated id.",
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
