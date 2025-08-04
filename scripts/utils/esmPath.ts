// scripts/utils/esmPath.ts
import path from "node:path";
import { fileURLToPath } from "node:url";

export function getDirname(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl));
}

export function getFilename(importMetaUrl: string): string {
  return fileURLToPath(importMetaUrl);
}
