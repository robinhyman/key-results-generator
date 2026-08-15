import {
  generateCausalMetricsGraph,
  generateKeyResultsModel,
} from "/src/generator.js";

const form = document.querySelector("#objective-form");
const objectiveInput = document.querySelector("#objective");
const objectiveHeading = document.querySelector("#objective-heading");
const modelSummary = document.querySelector("#model-summary");
const graphGrid = document.querySelector("#graph-grid");
const keyResultsList = document.querySelector("#kr-list");
const rankedList = document.querySelector("#ranked-list");
const clarificationForm = document.querySelector("#clarification-form");

let currentGraph;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderGraphOnly(objectiveInput.value);
});

clarificationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!currentGraph) {
    return;
  }

  const clarifications = readClarifications();
  const model = generateKeyResultsModel(currentGraph.objective, clarifications);
  currentGraph = model.graph;
  renderModel(model);
});

renderGraphOnly(objectiveInput.value);

function renderGraphOnly(objective) {
  currentGraph = generateCausalMetricsGraph(objective);
  const model = toViewModel(currentGraph, []);
  renderModel(model);
  renderClarification(currentGraph);
  renderPendingKeyResults();
}

function renderModel(model) {
  objectiveHeading.textContent = model.objective;
  modelSummary.textContent = model.summary;
  renderGraph(model);
  renderKeyResults(model.keyResults);
  renderRanking(model);
}

function toViewModel(graph, keyResults) {
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

function renderGraph(model) {
  const stages = [
    ["Upstream causes", 1],
    ["Operating drivers", 2],
    ["Evidence and experience", 3],
    ["Outcome", 4],
  ];

  graphGrid.replaceChildren(
    ...stages.map(([title, stage]) => {
      const column = document.createElement("section");
      column.className = "graph-column";
      column.setAttribute("aria-label", title);

      const heading = document.createElement("h3");
      heading.textContent = title;
      column.append(heading);

      const variables = model.variables.filter((variable) => variable.stage === stage);
      for (const variable of variables) {
        column.append(createVariableNode(variable, model));
      }

      return column;
    }),
  );
}

function createVariableNode(variable, model) {
  const node = document.createElement("article");
  node.className = `variable-node ${variable.type}`;

  const title = document.createElement("h4");
  title.textContent = variable.label;

  const meta = document.createElement("p");
  meta.className = "node-meta";
  meta.textContent = [
    formatType(variable.type),
    `Impact ${variable.impact}`,
    `Confidence ${variable.confidence}`,
    variable.userInfluenceability ? `Influence ${variable.userInfluenceability}/5` : null,
    variable.userGap ? `Gap ${variable.userGap}/5` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const description = document.createElement("p");
  description.textContent = variable.description;

  const links = document.createElement("ul");
  links.className = "link-list";
  for (const relationship of model.relationships.filter(
    (candidate) => candidate.source === variable.id,
  )) {
    const target = model.variables.find((candidate) => candidate.id === relationship.target);
    const item = document.createElement("li");
    item.textContent = `-> ${target?.label ?? relationship.target}: ${relationship.rationale}`;
    links.append(item);
  }

  node.append(title, meta, description);
  if (links.children.length > 0) {
    node.append(links);
  }

  return node;
}

function renderClarification(graph) {
  const fields = graph.rankings.slice(0, 6).map((variable) => createClarificationField(variable));
  const actions = document.createElement("div");
  actions.className = "clarification-actions";

  const previewButton = document.createElement("button");
  previewButton.type = "submit";
  previewButton.textContent = "Generate final KRs";

  actions.append(previewButton);
  clarificationForm.replaceChildren(...fields, actions);
}

function createClarificationField(variable) {
  const field = document.createElement("fieldset");
  field.className = "clarification-field";

  const legend = document.createElement("legend");
  legend.textContent = variable.label;

  const meta = document.createElement("p");
  meta.textContent = `${formatType(variable.type)} | Impact ${variable.impact} | Score ${variable.score}`;

  field.append(
    legend,
    meta,
    createRangeControl(variable.id, "influenceability", "Influenceability", defaultInfluenceValue(variable)),
    createRangeControl(variable.id, "gap", "Perceived gap", 3),
  );

  return field;
}

function createRangeControl(variableId, name, labelText, value) {
  const label = document.createElement("label");
  label.className = "range-control";

  const text = document.createElement("span");
  text.textContent = labelText;

  const input = document.createElement("input");
  input.type = "range";
  input.min = "1";
  input.max = "5";
  input.value = String(value);
  input.name = `${variableId}:${name}`;
  input.dataset.variableId = variableId;
  input.dataset.assessment = name;

  const output = document.createElement("output");
  output.textContent = input.value;
  input.addEventListener("input", () => {
    output.textContent = input.value;
  });

  label.append(text, input, output);
  return label;
}

function readClarifications() {
  const clarifications = {};
  for (const input of clarificationForm.querySelectorAll("input[type='range']")) {
    const variableId = input.dataset.variableId;
    const assessment = input.dataset.assessment;
    clarifications[variableId] ??= {};
    clarifications[variableId][assessment] = Number(input.value);
  }

  return clarifications;
}

function renderKeyResults(keyResults) {
  keyResultsList.replaceChildren(
    ...keyResults.map((keyResult) => {
      const item = document.createElement("li");
      item.className = "kr-item";

      const title = document.createElement("h3");
      title.textContent = keyResult.text;

      const rationale = document.createElement("p");
      rationale.textContent = keyResult.rationale;

      const driverText = document.createElement("p");
      driverText.className = "drivers";
      driverText.textContent = `Related drivers: ${keyResult.relatedDrivers.join(", ") || "top outcome model"}`;

      item.append(title, rationale, driverText);
      return item;
    }),
  );
}

function renderPendingKeyResults() {
  const item = document.createElement("li");
  item.className = "kr-item pending";

  const title = document.createElement("h3");
  title.textContent = "Awaiting clarification";

  const body = document.createElement("p");
  body.textContent = "Rate the top metrics, then generate the final recommended set.";

  item.append(title, body);
  keyResultsList.replaceChildren(item);
}

function renderRanking(model) {
  rankedList.replaceChildren(
    ...model.rankedVariables.slice(0, 6).map((variable) => {
      const row = document.createElement("article");
      row.className = "ranked-row";
      row.style.setProperty("--score", `${Math.min(variable.score, 100)}%`);

      const title = document.createElement("h3");
      title.textContent = variable.label;

      const meta = document.createElement("p");
      meta.textContent = `${formatType(variable.type)} | Score ${variable.score} | ${variable.influenceable ? "Influenceable" : "Evidence only"}`;

      row.append(title, meta);
      return row;
    }),
  );
}

function defaultInfluenceValue(variable) {
  return variable.influenceable ? 4 : 2;
}

function formatType(type) {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
