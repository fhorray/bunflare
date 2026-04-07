import { describe, expect, it, mock, beforeEach, afterEach } from "bun:test";
import { parseArgs, main } from "../src/cli/index";

describe("CLI Exhaustive Unit Tests", () => {
    it("should correctly identify 'init' command when flags come first", () => {
        const result = parseArgs(["--rootDir", "./proj", "init", "-y"]);
        expect(result.command).toBe("init");
        expect(result.rootDir).toBe("./proj");
        expect(result.args).toContain("-y");
    });

    it("should correctly identify 'build' command with default quiet=true", () => {
        const result = parseArgs(["build", "-p"]);
        expect(result.command).toBe("build");
        expect(result.quiet).toBe(true);
        expect(result.debug).toBe(false);
    });

    it("should disable quiet mode when --debug is passed", () => {
        const result = parseArgs(["build", "-p", "--debug"]);
        expect(result.command).toBe("build");
        expect(result.quiet).toBe(false);
        expect(result.debug).toBe(true);
    });

    it("should disable quiet mode for 'dev' when -d is passed", () => {
        const result = parseArgs(["dev", "-d"]);
        expect(result.command).toBe("dev");
        expect(result.quiet).toBe(false);
        expect(result.debug).toBe(true);
    });

    it("should fail when --rootDir is missing a value", () => {
        // Mock process.exit
        const originalExit = process.exit;
        const exitMock = mock((code?: number | string | null | undefined): never => {
             throw new Error(`Process exited with code ${code}`);
        });
        process.exit = exitMock as unknown as (code?: string | number | null | undefined) => never;

        try {
            parseArgs(["init", "--rootDir"]);
        } catch (e: any) {
            expect(e.message).toBe("Process exited with code 1");
        } finally {
            process.exit = originalExit;
        }
    });

    it("should show help for unknown commands", async () => {
        const consoleLogMock = mock();
        const originalConsoleLog = console.log;
        console.log = consoleLogMock;

        try {
            await main(["unknown-cmd"]);
            expect(consoleLogMock).toHaveBeenCalled();
            const output = consoleLogMock.mock.calls[0]?.[0];
            expect(output).toContain("Bunflare");
            expect(output).toContain("Usage:");
        } finally {
            console.log = originalConsoleLog;
        }
    });
});
