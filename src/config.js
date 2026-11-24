import { fileURLToPath } from "node:url";
export function lunaConfig({ componentDirectories = ["src/components"] } = {}) {
  return {
    plugins: ["typescript", "oxc", "jsx-a11y"],
    categories: { correctness: "error" },
    jsPlugins: [fileURLToPath(new URL("./plugin.js", import.meta.url))],
    rules: { "luna/no-raw-controls": ["error", { componentDirectories }] },
    ignorePatterns: ["**/node_modules/**", "**/dist/**", "**/.turbo/**"],
  };
}
