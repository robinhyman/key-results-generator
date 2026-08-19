import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { rankVariables } from "../../src/generator.js";

export function aiNode(id, type, label, stage, influenceable, direction = "increase") {
  return {
    id,
    type,
    label,
    description: `${label} description`,
    impact: 80,
    confidence: 75,
    influenceable,
    stage,
    direction,
  };
}

export function aiEdge(source, target) {
  return {
    id: `${source}-to-${target}`,
    source,
    target,
    rationale: `${source} affects ${target}`,
    strength: 78,
  };
}

export function graphForSetExploration() {
  const nodes = [
    {
      id: "outcome",
      type: "outcome",
      label: "Improve activation",
      description: "The outcome.",
      impact: 100,
      confidence: 90,
      influenceable: false,
      stage: 4,
      direction: "improve",
    },
    testNode("primary-result", "evidence", "Activation rate", 94, 86, 3),
    testNode("quality-result", "experience", "Setup quality", 88, 80, 3),
    testNode("speed-result", "experience", "Setup speed", 87, 80, 3, "reduce"),
    testNode("quality-driver", "driver", "Guidance quality", 86, 78, 2),
    testNode("speed-driver", "driver", "Time to first action", 85, 78, 2, "reduce"),
    testNode("capacity-driver", "upstream-driver", "Instrumentation coverage", 84, 76, 1),
    testNode("support-driver", "upstream-driver", "Support response time", 68, 62, 1, "reduce"),
    testNode("duplicate-speed", "driver", "Time to first action duplicate", 84, 77, 2, "reduce"),
  ];
  const edges = [
    testEdge("primary-result", "outcome", 95),
    testEdge("quality-result", "primary-result", 88),
    testEdge("speed-result", "primary-result", 87),
    testEdge("quality-driver", "quality-result", 86),
    testEdge("speed-driver", "speed-result", 86),
    testEdge("capacity-driver", "primary-result", 84),
    testEdge("support-driver", "quality-result", 70),
    testEdge("duplicate-speed", "speed-result", 84),
  ];

  return {
    objective: "Improve activation",
    summary: "Fixture graph for KR set exploration.",
    nodes,
    edges,
    rankings: rankVariables(nodes),
    assessments: {},
  };
}

export function testNode(id, type, label, impact, confidence, stage, direction = "increase") {
  return {
    id,
    type,
    label,
    description: `${label} description.`,
    impact,
    confidence,
    influenceable: true,
    stage,
    direction,
  };
}

export function testEdge(source, target, strength) {
  return {
    id: `${source}-to-${target}`,
    source,
    target,
    rationale: `${source} affects ${target}.`,
    strength,
  };
}

export function richAiGraphResponse() {
  const fullNodes = [
    aiNode("activation", "outcome", "Improve onboarding activation", 4, false),
    aiNode("time-to-value", "driver", "Time to first value", 2, true, "reduce"),
    aiNode("setup-completion", "evidence", "Setup completion rate", 3, true),
    aiNode("guided-help", "upstream-driver", "Guided help quality", 1, true),
    aiNode("qualitative-comment", "experience", "Qualitative comments about onboarding", 3, true),
    aiNode("support-backlog", "failure-mode", "Support backlog from onboarding confusion", 1, true, "reduce"),
  ];
  const fullEdges = [
    aiEdge("support-backlog", "guided-help"),
    aiEdge("guided-help", "time-to-value"),
    aiEdge("time-to-value", "setup-completion"),
    aiEdge("setup-completion", "activation"),
    aiEdge("qualitative-comment", "activation"),
  ];

  return {
    summary: "Activation depends on speed, clarity, and early value.",
    fullGraph: {
      summary: "A broad causal map with discarded and retained discovery nodes.",
      nodes: fullNodes,
      edges: fullEdges,
    },
    planningGraph: {
      summary: "A converged planning graph for clarification and KR selection.",
      nodes: fullNodes.slice(0, 4).map((node) => ({
        ...node,
        convergenceRationale: `${node.label} remains measurable, influenceable, and causally useful.`,
      })),
      edges: fullEdges.slice(1, 4),
    },
  };
}

export function aiKeyResult(id, variableId, indicatorTypeOrText, maybeText) {
  const text = maybeText ?? indicatorTypeOrText;
  const indicatorType = maybeText
    ? indicatorTypeOrText
    : ["primary-result", "experience-quality", "setup-completion"].includes(variableId)
      ? "lagging"
      : "leading";

  return {
    id,
    variableId,
    indicatorType,
    text,
    rationale: `Selected because ${variableId} was highly ranked and matched the user clarification.`,
    relatedDrivers: ["Guided help quality"],
  };
}

export function jsonResponse(data) {
  return jsonEnvelope({
    output: [
      {
        content: [
          {
            text: JSON.stringify(data),
          },
        ],
      },
    ],
  });
}

export function jsonEnvelope(body) {
  return {
    ok: true,
    status: 200,
    async json() {
      return body;
    },
  };
}

export function textResponse(text) {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        output: [
          {
            content: [{ text }],
          },
        ],
      };
    },
  };
}

export function assertValidIndicatorMix(keyResults) {
  const lagging = keyResults.filter((keyResult) => keyResult.indicatorType === "lagging").length;
  const leading = keyResults.filter((keyResult) => keyResult.indicatorType === "leading").length;
  assert.ok(lagging >= 1 && lagging <= 2, `expected 1-2 lagging KRs, got ${lagging}`);
  assert.ok(leading >= 2 && leading <= 3, `expected 2-3 leading KRs, got ${leading}`);
}

export async function tempTracePath() {
  const dir = await mkdtemp(join(tmpdir(), "kr-ai-trace-"));
  return join(dir, "ai-traces.jsonl");
}

export async function readTraceLines(traceLogPath) {
  return (await readFile(traceLogPath, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
