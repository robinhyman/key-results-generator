export const graphTypes = new Set([
  "outcome",
  "evidence",
  "experience",
  "driver",
  "failure-mode",
  "upstream-driver",
]);

const graphNodeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "type", "label", "description", "impact", "confidence", "influenceable", "stage", "direction"],
  properties: {
    id: { type: "string" },
    type: { type: "string", enum: [...graphTypes] },
    label: { type: "string" },
    description: { type: "string" },
    impact: { type: "integer", minimum: 1, maximum: 100 },
    confidence: { type: "integer", minimum: 1, maximum: 100 },
    influenceable: { type: "boolean" },
    stage: { type: "integer", minimum: 1, maximum: 4 },
    direction: { type: "string", enum: ["increase", "reduce", "improve"] },
  },
};

const planningGraphNodeSchema = {
  ...graphNodeSchema,
  required: [...graphNodeSchema.required, "convergenceRationale"],
  properties: {
    ...graphNodeSchema.properties,
    convergenceRationale: { type: "string" },
  },
};

const graphEdgeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "source", "target", "rationale", "strength"],
  properties: {
    id: { type: "string" },
    source: { type: "string" },
    target: { type: "string" },
    rationale: { type: "string" },
    strength: { type: "integer", minimum: 1, maximum: 100 },
  },
};

function graphContainerSchema({ minNodes, maxNodes, maxEdges, nodeSchema }) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["summary", "nodes", "edges"],
    properties: {
      summary: { type: "string" },
      nodes: {
        type: "array",
        minItems: minNodes,
        maxItems: maxNodes,
        items: nodeSchema,
      },
      edges: {
        type: "array",
        maxItems: maxEdges,
        items: graphEdgeSchema,
      },
    },
  };
}

export const graphResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "fullGraph", "planningGraph"],
  properties: {
    summary: { type: "string" },
    fullGraph: graphContainerSchema({
      minNodes: 20,
      maxNodes: 70,
      maxEdges: 120,
      nodeSchema: graphNodeSchema,
    }),
    planningGraph: graphContainerSchema({
      minNodes: 4,
      maxNodes: 20,
      maxEdges: 32,
      nodeSchema: planningGraphNodeSchema,
    }),
  },
};

export const keyResultsResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["keyResults"],
  properties: {
    keyResults: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "variableId", "indicatorType", "text", "rationale", "relatedDrivers"],
        properties: {
          id: { type: "string" },
          variableId: { type: "string" },
          indicatorType: { type: "string", enum: ["leading", "lagging"] },
          text: { type: "string" },
          rationale: { type: "string" },
          relatedDrivers: {
            type: "array",
            maxItems: 4,
            items: { type: "string" },
          },
        },
      },
    },
  },
};
