export const maxObjectiveLength = 500;

export function validateGraphRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError("Request body must be a JSON object.", "INVALID_REQUEST", 400);
  }

  if (typeof body.objective !== "string" || body.objective.trim().length === 0) {
    throw httpError("A non-empty objective string is required.", "INVALID_REQUEST", 400);
  }

  if (body.objective.length > maxObjectiveLength) {
    throw httpError(`Objective must be ${maxObjectiveLength} characters or fewer.`, "OBJECTIVE_TOO_LONG", 400);
  }
}

export function validateKeyResultsRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError("Request body must be a JSON object.", "INVALID_REQUEST", 400);
  }

  if (!body.graph || typeof body.graph !== "object" || Array.isArray(body.graph)) {
    throw httpError("A graph object is required.", "INVALID_REQUEST", 400);
  }

  validateGraphPayload(body.graph);

  if (
    body.clarifications !== undefined &&
    (!body.clarifications || typeof body.clarifications !== "object" || Array.isArray(body.clarifications))
  ) {
    throw httpError("Clarifications must be an object when provided.", "INVALID_REQUEST", 400);
  }
}

function validateGraphPayload(graph) {
  if (!Array.isArray(graph.nodes) || graph.nodes.length < 4) {
    throw httpError("Graph nodes must be an array with at least four items.", "INVALID_GRAPH", 400);
  }

  if (!Array.isArray(graph.edges)) {
    throw httpError("Graph edges must be an array.", "INVALID_GRAPH", 400);
  }

  for (const node of graph.nodes) {
    if (!node || typeof node !== "object" || typeof node.id !== "string" || node.id.trim().length === 0) {
      throw httpError("Every graph node must include a non-empty id.", "INVALID_GRAPH", 400);
    }
  }

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  for (const edge of graph.edges) {
    validateGraphEdge(edge, nodeIds);
  }
}

function validateGraphEdge(edge, nodeIds) {
  if (
    !edge ||
    typeof edge !== "object" ||
    typeof edge.source !== "string" ||
    typeof edge.target !== "string"
  ) {
    throw httpError("Every graph edge must include source and target ids.", "INVALID_GRAPH", 400);
  }

  if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target) {
    throw httpError("Every graph edge must reference distinct known node ids.", "INVALID_GRAPH", 400);
  }
}

function httpError(message, code, statusCode) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.expose = true;
  return error;
}
