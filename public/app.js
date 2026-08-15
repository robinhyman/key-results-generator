import { generateKeyResultsModel } from "/src/generator.js";

const form = document.querySelector("#objective-form");
const objectiveInput = document.querySelector("#objective");
const objectiveHeading = document.querySelector("#objective-heading");
const modelSummary = document.querySelector("#model-summary");
const graphGrid = document.querySelector("#graph-grid");
const keyResultsList = document.querySelector("#kr-list");
const rankedList = document.querySelector("#ranked-list");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderModel(objectiveInput.value);
});

renderModel(objectiveInput.value);

function renderModel(objective) {
  const model = generateKeyResultsModel(objective);
  objectiveHeading.textContent = model.objective;
  modelSummary.textContent = model.summary;
  renderGraph(model);
  renderKeyResults(model);
  renderRanking(model);
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
  meta.textContent = `${formatType(variable.type)} | Impact ${variable.impact} | Confidence ${variable.confidence}`;

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

function renderKeyResults(model) {
  keyResultsList.replaceChildren(
    ...model.keyResults.map((keyResult) => {
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

function formatType(type) {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
