import { test } from "vitest";
import assert from "node:assert/strict";
import { lintSource } from "../src/boundary.js";
const bad = (code, file = "src/pages/example.html") =>
  assert.ok(lintSource(code, file).length, code);
test("native component boundary rejects HTML, templates, JSX and DOM construction", () => {
  for (const tag of [
    "button",
    "input",
    "textarea",
    "select",
    "dialog",
    "table",
    "progress",
    "meter",
  ]) {
    bad(`<${tag}></${tag}>`);
    bad(`const x = <${tag}/>;`, "src/apps/page.jsx");
    bad(`document.createElement('${tag}')`, "src/apps/page.js");
    bad(`const x = '<${tag}></${tag}>';`, "src/apps/page.js");
  }
  bad("<template><SELECT><option>A</option></SELECT></template>");
  bad('<script>document.createElement("input")</script>');
  bad("const html = `<div>${name}<select></select></div>`;", "src/page.js");
  bad('const html = "<sel" + "ect></select>";', "src/page.js");
  bad('document["createElement"]("select")', "src/page.js");
  bad("document.createElement(tag)", "src/page.js");
  bad('<input type="file">', "src/not-components/form.html");
});
test("boundary allows layout, component references and component internals only", () => {
  assert.deepEqual(
    lintSource(
      "<main><h1>Title</h1><ui-select><option>A</option></ui-select></main>",
      "src/pages/demo.html",
    ),
    [],
  );
  assert.deepEqual(lintSource('<input type="file">', "src/components/upload.html"), []);
  assert.deepEqual(lintSource("const x = <Select/>;", "src/app.jsx"), []);
  assert.deepEqual(lintSource('document.createElement("section")', "src/app.js"), []);
  bad("<input>", "src/components-backup/upload.html");
});

test("TypeScript support, accurate locations and configurable monorepo boundary", () => {
  const source = 'const label: string = "test";\nconst x = <select />;';
  assert.equal(lintSource(source, "apps/web/src/view.tsx")[0].line, 2);
  assert.deepEqual(
    lintSource(source, "packages/ui/src/select.tsx", { componentDirectories: ["packages/ui/src"] }),
    [],
  );
  bad(source, "packages/ui-extra/src/select.tsx");
});
