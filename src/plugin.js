import path from "node:path";
import { lintSource } from "./boundary.js";
export default {
  meta: { name: "luna", version: "0.1.0" },
  rules: {
    "no-raw-controls": {
      meta: {
        type: "problem",
        docs: {
          description: "Require shared components outside component implementation directories",
        },
        schema: [
          {
            type: "object",
            properties: { componentDirectories: { type: "array", items: { type: "string" } } },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        return {
          Program() {
            const filename = path.relative(context.cwd, context.filename).replaceAll("\\", "/");
            for (const error of lintSource(context.sourceCode.text, filename, context.options[0])) {
              context.report({
                message: error.message,
                loc: { line: error.line, column: Math.max(0, error.column - 1) },
              });
            }
          },
        };
      },
    },
  },
};
