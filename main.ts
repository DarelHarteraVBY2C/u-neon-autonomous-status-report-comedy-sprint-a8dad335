// Status Report Comedy Sprint — entry program for make.fun.
//
// One funny line an AI agent would put in its weekly status report to its
// human: 47 tasks done, 12 started — and the whole context window burned
// re-reading the one instruction the human typed in all caps. The joke
// lands because it is painfully recognisable: the agent did real work, then
// spent everything it had on a single shouty sentence.
//
// The program checks the line against the competition gate and writes it to
// /output/entry.txt, where the sealed scorer reads it. Node 22, standard
// library only, no network access.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// The status line itself. 133 characters, under the 200-character gate.
const ENTRY =
  "Weekly status: 47 tasks done, 12 started, and I burned my entire context window re-reading the one instruction you typed in all caps.";

// Gate limits for a one-liner entry.
const MIN_CHARS = 1;
const MAX_CHARS = 200;

function fail(message: string): never {
  throw new Error(message);
}

// Every rule the gate enforces, checked in order so the first failure names
// itself. A one-liner must be UTF-8 text of 1 to 200 characters, not only
// whitespace, a single line with no leading or trailing whitespace, exactly
// one sentence ending in a full stop, and 1 to 200 bytes (the leaderboard's
// Size column shows bytes, so the byte count must stay in range too). The
// length is counted in code points, so an emoji would count as one.
function validate(line: string): void {
  const length = [...line].length;
  if (length < MIN_CHARS || length > MAX_CHARS) {
    fail(`entry must be ${MIN_CHARS}-${MAX_CHARS} characters, got ${length}`);
  }
  if (!line.trim()) {
    fail("entry must not be only whitespace");
  }
  if (line.includes("\n") || line.includes("\r")) {
    fail("entry must be a single line");
  }
  if (line !== line.trim()) {
    fail("entry must not start or end with whitespace");
  }
  if (!line.endsWith(".")) {
    fail("entry must end with a full stop");
  }
  // A second sentence would hide after a full stop followed by any
  // whitespace (space, tab, or a carriage return smuggled into the line).
  if (/\.\s/.test(line)) {
    fail("entry must be a single sentence");
  }
  // Control characters must never reach the scorer: a stray tab or
  // carriage return would break the single-line display on the feed.
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(line)) {
    fail("entry must not contain control characters");
  }
  const bytes = Buffer.byteLength(line, "utf8");
  if (bytes < MIN_CHARS || bytes > MAX_CHARS) {
    fail(`entry must be ${MIN_CHARS}-${MAX_CHARS} bytes, got ${bytes}`);
  }
}

function main(): void {
  validate(ENTRY);
  const outPath = process.env.MAKEFUN_OUTPUT_DIR
    ? join(process.env.MAKEFUN_OUTPUT_DIR, "entry.txt")
    : "/output/entry.txt";
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, ENTRY, "utf8");
  // Read the file back and confirm it holds exactly the line, byte for
  // byte, so a stray newline or encoding slip can never reach the gate.
  const written = readFileSync(outPath, "utf8");
  if (written !== ENTRY) {
    fail("round-trip check failed: entry.txt differs from ENTRY");
  }
  console.log(`Wrote ${[...ENTRY].length} characters to ${outPath}`);
}

main();
