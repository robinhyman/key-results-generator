export function cleanDirection(value) {
  return ["increase", "reduce", "improve"].includes(value) ? value : "improve";
}

export function cleanId(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 360);
}

export function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.round(number)));
}

export function normalizeObjective(rawObjective) {
  const objective = String(rawObjective ?? "").replace(/\s+/g, " ").trim();
  return objective ? objective.charAt(0).toUpperCase() + objective.slice(1) : "Improve a meaningful outcome";
}

export function titleFromId(id) {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
