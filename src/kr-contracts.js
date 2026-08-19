import { indicatorTypeForVariable } from "./ranking.js";

export function validateKeyResultSet(keyResults) {
  if (!Array.isArray(keyResults) || keyResults.length < 3 || keyResults.length > 5) {
    throw new Error("Key result set must include three to five KRs.");
  }

  const ids = new Set();
  const variableIds = new Set();
  for (const keyResult of keyResults) {
    if (ids.has(keyResult.id)) {
      throw new Error(`Key result id must be unique: ${keyResult.id}`);
    }
    if (variableIds.has(keyResult.variableId)) {
      throw new Error(`Key result variable must be unique: ${keyResult.variableId}`);
    }
    ids.add(keyResult.id);
    variableIds.add(keyResult.variableId);
  }

  if (!hasValidIndicatorMix(keyResults)) {
    const laggingCount = keyResults.filter((keyResult) => keyResult.indicatorType === "lagging").length;
    const leadingCount = keyResults.filter((keyResult) => keyResult.indicatorType === "leading").length;
    throw new Error(`Key result indicator mix is invalid: ${laggingCount} lagging and ${leadingCount} leading.`);
  }
}

export function hasValidIndicatorMix(items) {
  const laggingCount = items.filter((item) => indicatorTypeForItem(item) === "lagging").length;
  const leadingCount = items.filter((item) => indicatorTypeForItem(item) === "leading").length;
  return laggingCount >= 1 && laggingCount <= 2 && leadingCount >= 2 && leadingCount <= 3;
}

function indicatorTypeForItem(item) {
  return item.indicatorType ?? indicatorTypeForVariable(item);
}
