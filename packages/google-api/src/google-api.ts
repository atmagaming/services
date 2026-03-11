import { google as googleapis } from "googleapis";
import { CalendarApi } from "./calendar-api";
import { DocsApi } from "./docs-api";
import { DriveApi } from "./drive-api";

export class GoogleApi {
  readonly auth;
  readonly drive;
  readonly docs;
  readonly calendar;

  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    this.auth = new googleapis.auth.OAuth2(clientId, clientSecret);
    this.auth.setCredentials({ refresh_token: refreshToken });

    this.drive = new DriveApi(this.auth);
    this.docs = new DocsApi(this.auth);
    this.calendar = new CalendarApi(this.auth);
  }
}
