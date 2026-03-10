import type { PersonStatus } from "$lib/types";
import { getCachedPeople } from "./data";
import { syncPersonNotionPage } from "./notion";

type Job = { personId: string; status: PersonStatus };
const queue: Job[] = [];
let running = false;

export function enqueueNotionSync(personId: string, status: PersonStatus) {
  const existing = queue.findIndex((j) => j.personId === personId);
  if (existing !== -1) queue[existing] = { personId, status };
  else queue.push({ personId, status });
  if (!running) void processQueue();
}

async function processQueue() {
  running = true;
  while (queue.length > 0) {
    const job = queue.shift();
    if (!job) break;
    try {
      const people = await getCachedPeople();
      const person = people.find((p) => p.id === job.personId);
      if (person) await syncPersonNotionPage(person, job.status);
    } catch (e) {
      console.error("Notion sync failed:", e);
    }
  }
  running = false;
}
