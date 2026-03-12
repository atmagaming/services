import { getCachedPeople } from "../repositories/people";
import { syncPersonNotionPage } from "./notion";

type Job = { personId: string; status: string };

class NotionSyncQueue {
  private readonly queue: Job[] = [];
  private running = false;

  enqueue(personId: string, status: string) {
    const existing = this.queue.findIndex((j) => j.personId === personId);
    if (existing !== -1) this.queue[existing] = { personId, status };
    else this.queue.push({ personId, status });
    if (!this.running) void this.process();
  }

  private async process() {
    this.running = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;
      try {
        const people = await getCachedPeople();
        const person = people.find((p) => p.id === job.personId);
        if (person) await syncPersonNotionPage(person, job.status);
      } catch (e) {
        console.error("Notion sync failed:", e);
      }
    }
    this.running = false;
  }
}

export const notionSyncQueue = new NotionSyncQueue();

export const enqueueNotionSync = (personId: string, status: string) => notionSyncQueue.enqueue(personId, status);
