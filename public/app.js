import { generateGraph, generateKeyResults } from "./api.js";
import {
  modelToViewModel,
  toViewModel,
} from "./format.js";
import {
  readClarifications,
  renderClarification,
  renderClarificationUnavailable,
  renderGenerationStatus,
  renderModel,
  renderPendingKeyResults,
  setProviderStatus,
} from "./render.js";

const elements = {
  form: document.querySelector("#objective-form"),
  objectiveInput: document.querySelector("#objective"),
  objectiveHeading: document.querySelector("#objective-heading"),
  modelSummary: document.querySelector("#model-summary"),
  graphGrid: document.querySelector("#graph-grid"),
  keyResultsList: document.querySelector("#kr-list"),
  rankedList: document.querySelector("#ranked-list"),
  clarificationForm: document.querySelector("#clarification-form"),
  providerStatus: document.querySelector("#provider-status"),
};

let currentGraph;

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await renderGraphOnly(elements.objectiveInput.value);
});

elements.clarificationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentGraph) {
    return;
  }

  const clarifications = readClarifications(elements.clarificationForm);
  setBusy(true, "Synthesizing final KRs...");
  renderPendingKeyResults(elements.keyResultsList, "Generating final recommendations from your ratings.");

  try {
    const model = await generateKeyResults(currentGraph, clarifications);
    currentGraph = model.graph;
    renderModel(modelToViewModel(model), elements);
    renderGenerationStatus(elements.providerStatus, model.keyResultGeneration);
  } catch {
    renderPendingKeyResults(elements.keyResultsList, "The final KR generation request failed. Try again.");
    setProviderStatus(elements.providerStatus, "Generation failed", "error");
  } finally {
    setBusy(false);
  }
});

renderGraphOnly(elements.objectiveInput.value);

async function renderGraphOnly(objective) {
  currentGraph = undefined;
  setBusy(true, "Generating causal metrics graph...");
  renderClarificationUnavailable(elements.clarificationForm, "Generate a graph before rating metrics.");
  renderPendingKeyResults(elements.keyResultsList, "Awaiting clarification");

  try {
    currentGraph = await generateGraph(objective);
    renderGenerationStatus(elements.providerStatus, currentGraph.generation);
  } catch {
    renderClarificationUnavailable(elements.clarificationForm, "Graph generation failed. Try again before rating metrics.");
    renderPendingKeyResults(elements.keyResultsList, "The graph generation request failed. Try again.");
    setProviderStatus(elements.providerStatus, "Generation failed", "error");
    return;
  } finally {
    setBusy(false);
  }

  renderModel(toViewModel(currentGraph, []), elements);
  renderClarification(currentGraph, elements.clarificationForm);
  renderPendingKeyResults(
    elements.keyResultsList,
    "Rate the top metrics, then generate the final recommended set.",
  );
}

function setBusy(isBusy, message = "") {
  elements.form.querySelector("button").disabled = isBusy;
  elements.clarificationForm.querySelector("button")?.toggleAttribute("disabled", isBusy);
  if (message) {
    setProviderStatus(elements.providerStatus, message, "pending");
  }
}
