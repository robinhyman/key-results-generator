import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

export const defaultEndpoint = "https://api.openai.com/v1/responses";
export const defaultKeyPath = join(root, "keys", "key.txt");
export const defaultKeyResultCount = 4;
export const defaultModel = "gpt-5-mini";
export const defaultProviderTimeoutMs = 30_000;
export const defaultTraceMaxBytes = 1_000_000;
export const defaultTracePath = join(root, "logs", "ai-traces.jsonl");
export const maxKeyResultCount = 5;
