import type { calendar_v3 } from "googleapis";
import { google } from "googleapis";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

export class CalendarApi {
  private readonly client: calendar_v3.Calendar;
  private cachedTimezone: string | null = null;

  constructor(auth: OAuth2Client) {
    this.client = google.calendar({ version: "v3", auth });
  }

  async getTimezone(): Promise<string> {
    if (this.cachedTimezone) return this.cachedTimezone;
    const response = await this.client.calendars.get({ calendarId: "primary" });
    this.cachedTimezone = response.data.timeZone ?? "UTC";
    return this.cachedTimezone;
  }

  async listEvents(calendarId: string, timeMin: string, timeMax: string, maxResults = 50): Promise<calendar_v3.Schema$Event[]> {
    const response = await this.client.events.list({
      calendarId,
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });
    return response.data.items ?? [];
  }

  async getEvent(calendarId: string, eventId: string): Promise<calendar_v3.Schema$Event> {
    const response = await this.client.events.get({ calendarId, eventId });
    return response.data;
  }

  async createEvent(calendarId: string, event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    const response = await this.client.events.insert({ calendarId, requestBody: event });
    return response.data;
  }

  async updateEvent(calendarId: string, eventId: string, event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    const response = await this.client.events.patch({ calendarId, eventId, requestBody: event });
    return response.data;
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.client.events.delete({ calendarId, eventId });
  }

  async getFreeBusy(timeMin: string, timeMax: string, calendarIds: string[]): Promise<calendar_v3.Schema$FreeBusyResponse> {
    const response = await this.client.freebusy.query({
      requestBody: { timeMin, timeMax, items: calendarIds.map((id) => ({ id })) },
    });
    return response.data;
  }
}
