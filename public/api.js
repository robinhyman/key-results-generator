export async function generateGraph(objective) {
  const { graph } = await postJson("/api/graph", { objective });
  return graph;
}

export async function generateKeyResults(graph, clarifications) {
  const { model } = await postJson("/api/key-results", { graph, clarifications });
  return model;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Request failed.");
  }

  return response.json();
}
