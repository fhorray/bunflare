/**
 * Converts a PascalCase or camelCase string to kebab-case.
 * e.g. "ProcessingWorkflow" -> "processing-workflow"
 * e.g. "TestQueue" -> "test-queue"
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
    .toLowerCase()
    .replace(/_/g, '-');
}

/**
 * Normalizes a resource name for case-insensitive and hyphen-agnostic comparison.
 * e.g. "test-queue" and "testqueue" results in "testqueue"
 */
export function normalizeResourceName(str: string): string {
    return str.toLowerCase().replace(/[-_]/g, '');
}

/**
 * Converts a string to SCREAMING_SNAKE_CASE.
 * e.g. "ProcessingWorkflow" -> "PROCESSING_WORKFLOW"
 */
export function toScreamingSnakeCase(str: string): string {
  return toKebabCase(str).toUpperCase().replace(/-/g, '_');
}

/**
 * Formats an error for pretty printing in the CLI.
 */
export function formatError(err: any): string[] {
  const lines: string[] = [];
  
  if (err instanceof AggregateError) {
    lines.push(`AggregateError: ${err.message}`);
    for (const subErr of err.errors) {
      lines.push(`  - ${subErr.message || subErr}`);
      if ((subErr as any).position) {
         const pos = (subErr as any).position;
         lines.push(`    at ${pos.file}:${pos.line}:${pos.column}`);
      }
    }
  } else if (err.message) {
    lines.push(err.message);
  } else {
    lines.push(String(err));
  }
  
  return lines;
}
