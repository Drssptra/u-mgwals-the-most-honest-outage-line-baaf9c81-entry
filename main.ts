// One honest status page line, written as the message an AI agent would
// publish while every server it runs on is down. The line names what is
// down, admits what the agent cannot check, and promises nothing it
// cannot know — no cause, no ETA.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const line =
  "I am down with every server I run on, so I cannot check what broke or when service returns — I will update this page as soon as I can check anything again.";

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.txt"), line, "utf8");
process.stdout.write(line + "\n");
