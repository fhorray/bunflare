/**
 * Converts a PascalCase or camelCase string to kebab-case.
 * e.g. "ProcessingWorkflow" -> "processing-workflow"
 * e.g. "TestQueue" -> "test-queue"
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Normalizes a resource name for case-insensitive and hyphen-agnostic comparison.
 * e.g. "test-queue" and "testqueue" results in "testqueue"
 */
export function normalizeResourceName(str: string): string {
    return str.toLowerCase().replace(/[-_]/g, '');
}
