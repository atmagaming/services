import { appendFile, mkdir } from "fs/promises";
import { join } from "path";

const logsDir = join(process.cwd(), "logs");

async function ensureLogsDir() {
  try {
    await mkdir(logsDir, { recursive: true });
  } catch (e) {
    console.error("Failed to create logs directory:", e);
  }
}

export async function logRequest(method: string, url: string, status: number, duration: number) {
  await ensureLogsDir();

  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${method} ${url} - ${status} (${duration.toFixed(2)}ms)\n`;

  const logFile = join(logsDir, "requests.log");

  try {
    await appendFile(logFile, logEntry);
  } catch (e) {
    console.error("Failed to write to log file:", e);
  }
}

export async function logError(error: string, context?: string) {
  await ensureLogsDir();

  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ERROR${context ? ` (${context})` : ""}: ${error}\n`;

  const logFile = join(logsDir, "errors.log");

  try {
    await appendFile(logFile, logEntry);
  } catch (e) {
    console.error("Failed to write to error log file:", e);
  }
}
