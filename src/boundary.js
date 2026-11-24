import { parseSync } from "oxc-parser";
import { parseFragment } from "parse5";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
export const restricted = new Set([
  "button",
  "input",
  "textarea",
  "select",
  "dialog",
  "table",
  "progress",
  "meter",
]);
const normalized = (file) => file.replaceAll("\\", "/").replace(/^\.\//, "");
// This is the sole native-control implementation boundary. Not a substring match.
const isComponent = (file, directories) =>
  directories.some((dir) => normalized(file).startsWith(normalized(dir).replace(/\/$/, "") + "/"));
export function lintSource(source, filename, options = {}) {
  if (isComponent(filename, options.componentDirectories ?? ["src/components"])) return [];
  const errors = [];
  const report = (line, column, message) =>
    errors.push({ file: filename, line, column, rule: "components/no-raw-controls", message });
  function html(text, baseLine = 1, baseColumn = 1) {
    const tree = parseFragment(text, { sourceCodeLocationInfo: true });
    function visit(node) {
      if (restricted.has(node.tagName)) {
        const loc = node.sourceCodeLocation;
        report(
          baseLine + (loc?.startLine ?? 1) - 1,
          (loc?.startLine ?? 1) === 1 ? baseColumn + (loc?.startCol ?? 1) - 1 : loc.startCol,
          `Use ui-${node.tagName} or a shared component; native <${node.tagName}> is only allowed in src/components/.`,
        );
      }
      for (const child of node.childNodes ?? []) visit(child);
      if (node.content) visit(node.content);
      if (
        node.tagName === "script" &&
        !node.attrs.some((a) => a.name === "src") &&
        !node.attrs.some(
          (a) => a.name === "type" && !["module", "text/javascript"].includes(a.value),
        )
      ) {
        const textNode = node.childNodes?.[0];
        if (textNode)
          javascript(textNode.value, baseLine + (textNode.sourceCodeLocation?.startLine ?? 1) - 1);
      }
      const srcdoc = node.attrs?.find((a) => a.name === "srcdoc");
      if (srcdoc) html(srcdoc.value, baseLine + (node.sourceCodeLocation?.startLine ?? 1) - 1);
    }
    visit(tree);
  }
  function javascript(text, baseLine = 1) {
    let ast;
    try {
      const parsed = parseSync(filename.endsWith(".html") ? "inline.tsx" : filename, text, {
        lang: /\.[cm]?tsx?$/.test(filename) ? "tsx" : "jsx",
      });
      if (parsed.errors.length) throw new Error(parsed.errors[0].message);
      ast = parsed.program;
      const locate = (offset) => {
        const lines = text.slice(0, offset).split("\n");
        return { line: lines.length, column: lines.at(-1).length };
      };
      const positions = (node) => {
        if (!node || typeof node !== "object") return;
        if (typeof node.start === "number")
          node.loc = { start: locate(node.start), end: locate(node.end) };
        for (const [key, value] of Object.entries(node))
          if (key !== "loc") {
            if (Array.isArray(value)) value.forEach(positions);
            else if (value && typeof value === "object") positions(value);
          }
      };
      positions(ast);
    } catch (e) {
      report(
        baseLine + (e.lineNumber ?? 1) - 1,
        e.column ?? 1,
        `Cannot parse source: ${e.message}`,
      );
      return;
    }
    const staticText = (n) =>
      n?.type === "Literal" && typeof n.value === "string"
        ? n.value
        : n?.type === "TemplateLiteral" && !n.expressions.length
          ? n.quasis[0].value.cooked
          : n?.type === "BinaryExpression" &&
              n.operator === "+" &&
              staticText(n.left) !== null &&
              staticText(n.right) !== null
            ? staticText(n.left) + staticText(n.right)
            : null;
    function visit(n, parent) {
      if (!n || typeof n !== "object") return;
      const line = baseLine + (n.loc?.start.line ?? 1) - 1,
        column = (n.loc?.start.column ?? 0) + 1;
      if (n.type === "JSXOpeningElement" && restricted.has(n.name.name))
        report(line, column, `Use a shared component instead of <${n.name.name}>.`);
      if (n.type === "CallExpression") {
        const name =
          n.callee.type === "Identifier"
            ? n.callee.name
            : (n.callee.property?.name ?? n.callee.property?.value);
        if (["createElement", "createElementNS", "el", "node", "h", "jsx", "jsxs"].includes(name)) {
          const arg = n.arguments[name === "createElementNS" ? 1 : 0],
            tag = staticText(arg);
          if (restricted.has(tag))
            report(line, column, `Native ${tag} creation belongs in src/components/.`);
          else if (tag === null && ["createElement", "createElementNS"].includes(name))
            report(line, column, "Dynamic native element creation belongs in src/components/.");
        }
      }
      const value = staticText(n);
      if (
        value?.includes("<") &&
        !(parent?.type === "BinaryExpression" && staticText(parent) !== null)
      )
        html(value, line, column);
      if (n.type === "TemplateLiteral" && n.expressions.length)
        for (const q of n.quasis)
          if (q.value.cooked?.includes("<"))
            html(q.value.cooked, baseLine + q.loc.start.line - 1, q.loc.start.column + 1);
      for (const [key, v] of Object.entries(n)) {
        if (["loc", "range", "tokens", "comments"].includes(key)) continue;
        if (Array.isArray(v)) for (const child of v) visit(child, n);
        else if (v && typeof v === "object") visit(v, n);
      }
    }
    visit(ast);
  }
  if (filename.endsWith(".html")) html(source);
  else javascript(source);
  return errors;
}
export async function lintProject(root = process.cwd(), options = {}) {
  const errors = [];
  async function walk(dir) {
    for (const item of await readdir(path.join(root, dir), { withFileTypes: true })) {
      const file = path.posix.join(dir, item.name);
      // design/ is generated output for HTML/JS; its CSS/assets remain authored.
      if (item.isDirectory()) {
        if (
          ![
            "node_modules",
            "dist",
            ".turbo",
            ".runtime",
            ".git",
            ...(options.ignoreDirectories ?? []),
          ].includes(item.name)
        )
          await walk(file);
      } else if (/\.(?:html|[cm]?[jt]s|[jt]sx)$/.test(file))
        errors.push(...lintSource(await readFile(path.join(root, file), "utf8"), file, options));
    }
  }
  await walk("");
  return errors;
}
