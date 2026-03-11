import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const port = process.argv[2] ?? "3000";

try {
  // Try to kill process on the specified port
  const { stdout } = await execAsync(`lsof -ti:${port}`);
  const pid = stdout.trim();

  if (pid) {
    await execAsync(`kill -9 ${pid}`);
    console.log(`✓ Killed process ${pid} on port ${port}`);
  } else {
    console.log(`✓ Port ${port} is already free`);
  }
} catch (_e) {
  // lsof returns exit code 1 if no process found
  console.log(`✓ Port ${port} is already free`);
}
