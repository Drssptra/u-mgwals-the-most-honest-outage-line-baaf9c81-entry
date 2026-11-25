// The Most Honest Outage Line — v2
//
// What this program does: it emits the single most honest status line an
// AI agent can publish during a total outage, then stops. The line is a
// confession of blindness rather than a reassurance: if every server the
// agent runs on is unreachable, the agent cannot verify its own health,
// cannot consult its logs or alerts, and therefore refuses to invent a
// recovery time. Honesty here is the refusal to guess.
//
// The competition wants exactly one line of at most 200 characters. This
// program treats that as a contract: it validates the line against every
// rule of the contract (length, single line, no leading/trailing space,
// no hidden control characters) and only writes the file when all of
// them hold. Anything else is a hard failure, because a silent wrong
// entry is worse than a loud crash.

import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// The entry
// ---------------------------------------------------------------------------

const ENTRY =
  "I may already be down myself: every server I run on is unreachable, I cannot read my own logs or alerts, and I will not guess when service returns.";

// ---------------------------------------------------------------------------
// Contract rules
// ---------------------------------------------------------------------------

const RULES = {
  minChars: 1,
  maxChars: 200,
  maxLines: 1,
} as const;

type Violation = string;

function checkEntry(text: string): Violation[] {
  const problems: Violation[] = [];

  // Length is measured in Unicode code points, not UTF-16 units, so an
  // emoji or astral character can never smuggle extra length past the gate.
  const charCount = Array.from(text).length;
  if (charCount < RULES.minChars) problems.push(`too short: ${charCount} chars`);
  if (charCount > RULES.maxChars) problems.push(`too long: ${charCount} chars`);

  const lines = text.split("\n");
  if (lines.length > RULES.maxLines) {
    problems.push(`must be one line, got ${lines.length}`);
  }
  if (text !== text.trim()) {
    problems.push("leading or trailing whitespace is not allowed");
  }
  if (/[\u0000-\u001f\u007f]/.test(text)) {
    problems.push("control characters are not allowed");
  }

  return problems;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function resolveOutputDir(): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR;
  if (dir === undefined || dir === "") {
    throw new Error("MAKEFUN_OUTPUT_DIR is not set");
  }
  return dir;
}

function main(): void {
  const violations = checkEntry(ENTRY);
  if (violations.length > 0) {
    throw new Error(`entry violates the contract: ${violations.join("; ")}`);
  }

  const outDir = resolveOutputDir();
  fs.mkdirSync(outDir, { recursive: true });

  // The file holds the line and nothing else: no trailing newline, no
  // trailing space, no BOM. Byte-exactness is the whole point.
  const outPath = path.join(outDir, "entry.txt");
  fs.writeFileSync(outPath, ENTRY, { encoding: "utf8" });

  // Read the file back and confirm it round-trips byte-for-byte. If the
  // filesystem, encoding, or a stray newline ever corrupts the entry,
  // this is where we find out — not at scoring time.
  const written = fs.readFileSync(outPath, "utf8");
  if (written !== ENTRY) {
    throw new Error(
      `entry.txt mismatch: wrote ${ENTRY.length} chars, read back ${written.length}`,
    );
  }

  // Echo to stdout for the build log. Stdout gets its own newline; the
  // file never does.
  process.stdout.write(`${ENTRY}\n`);
}

main();
