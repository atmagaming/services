import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const port = process.argv[2] ?? "3000";

try {
  const { stdout } = await execAsync(`lsof -nP -iTCP:${port} -sTCP:LISTEN`);
  const pids = [
    ...new Set(
      stdout
        .split("\n")
        .slice(1)
        .map((line) => line.trim().split(/\s+/)[1])
        .filter(Boolean),
    ),
  ];

  if (pids.length > 0) {
    await execAsync(`kill -9 ${pids.join(" ")}`);
    console.log(`✓ Killed process(es) ${pids.join(", ")} on port ${port}`);
  } else {
    console.log(`✓ Port ${port} is already free`);
  }
} catch (_e) {
  // lsof returns exit code 1 if no process found
  console.log(`✓ Port ${port} is already free`);
}
