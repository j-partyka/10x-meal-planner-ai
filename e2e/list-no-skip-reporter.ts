import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from "@playwright/test/reporter";

/**
 * List-style reporter that does not show skipped tests in the summary.
 * Only passed and failed tests are printed; the final summary omits skipped count.
 */
class ListNoSkipReporter implements Reporter {
  private index = 0;
  private passed = 0;
  private failed = 0;

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === "skipped") return;
    this.index += 1;
    if (result.status === "passed") this.passed += 1;
    else this.failed += 1;
    const symbol = result.status === "passed" ? "✓" : "✘";
    const path = test.location.file.replace(process.cwd(), "").replace(/^\//, "");
    const loc = `${path}:${test.location.line}:${test.location.column}`;
    const title = test.titlePath().join(" › ");
    console.log(`  ${symbol}   ${this.index} …${loc} › ${title}`);
  }

  onEnd(_result: FullResult): void {
    const parts = [`${this.passed} passed`];
    if (this.failed > 0) parts.push(`${this.failed} failed`);
    console.log(`\n ${parts.join(" ")}`);
  }

  printsToStdio(): boolean {
    return true;
  }
}

export default ListNoSkipReporter;
