import { lunaConfig } from "./src/config.js";
export default { ...lunaConfig({ componentDirectories: ["src"] }), ignorePatterns: ["tests/**"] };
