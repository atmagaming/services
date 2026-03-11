import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const port = process.argv[2] ?? "3000";

try {
  // Check if server is running
  await execAsync(`curl -s http://localhost:${port} > /dev/null 2>&1`, {
    timeout: 2000,
  });
  console.log(`✓ Dev server is running on port ${port}`);

  // Show logs if they exist
  if (existsSync("logs/requests.log")) {
    console.log("\n📋 Recent logs:");
    const tail = await execAsync("tail -10 logs/requests.log");
    console.log(tail.stdout);
  }

  // Watch the log file
  console.log("\n👀 Watching logs (press Ctrl+C to stop)...\n");
  await execAsync("tail -f logs/requests.log");
} catch (_e) {
  console.log(`✗ Dev server is not running on port ${port}`);
  console.log("\n🚀 Starting dev server...\n");

  // Start the dev server
  exec(`bun run dev --port ${port}`);
}
