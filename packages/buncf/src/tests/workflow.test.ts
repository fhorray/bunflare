import { expect, test, describe } from "bun:test";
import { transformWorkflows } from "../transforms/serve-transform";

describe("transformWorkflows", () => {
  test("should transform basic workflow definition", () => {
    const source = `
import { workflow } from "buncf";

export const MyWorkflow = workflow({
  async run(event, step, env) {
    await step.do("step1", async () => {
      console.log("hello");
    });
  }
});
    `;

    const transformed = transformWorkflows(source);

    expect(transformed).toContain('import { WorkflowEntrypoint } from "cloudflare:workers"');
    expect(transformed).toContain("class MyWorkflow extends WorkflowEntrypoint");
    expect(transformed).toContain("async run(event, step)");
    expect(transformed).toContain("await $$impl.run(event, step, this.env)");
    expect(transformed).not.toContain("workflow(");
  });

  test("should preserve existing cloudflare:workers import", () => {
    const source = `
import { WorkflowEntrypoint } from "cloudflare:workers";
import { workflow } from "buncf";

export const MyWorkflow = workflow({
  async run(event, step, env) {
    return "done";
  }
});
    `;

    const transformed = transformWorkflows(source);
    
    // Should only have one import
    const matches = transformed.match(/import\s+\{ WorkflowEntrypoint \}\s+from\s+"cloudflare:workers"/g);
    expect(matches?.length).toBe(1);
  });
});
