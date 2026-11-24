import { defineConfig } from "oxlint";
export function lunaConfig(options?: {
  componentDirectories?: string[];
}): Parameters<typeof defineConfig>[0];
