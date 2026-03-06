import {
  GOOGLE_DRIVE_CLIENT_ID,
  GOOGLE_DRIVE_CLIENT_SECRET,
  GOOGLE_DRIVE_REFRESH_TOKEN,
  GOOGLE_DRIVE_DOCUMENTS_FOLDER,
} from "$env/static/private";

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_DRIVE_CLIENT_ID,
      client_secret: GOOGLE_DRIVE_CLIENT_SECRET,
      refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("Failed to refresh Google access token: " + (await res.text()));

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function uploadToDrive(filename: string, mimeType: string, buffer: Buffer): Promise<string> {
  const accessToken = await getAccessToken();

  const metadata = JSON.stringify({ name: filename, parents: [GOOGLE_DRIVE_DOCUMENTS_FOLDER] });
  const form = new FormData();
  form.append("metadata", new Blob([metadata], { type: "application/json" }));
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }));

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) throw new Error("Failed to upload to Google Drive: " + (await res.text()));

  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function getDriveFileStream(fileId: string): Promise<{ stream: ReadableStream; mimeType: string }> {
  const accessToken = await getAccessToken();

  const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) throw new Error("Drive file not found: " + (await metaRes.text()));

  const { mimeType } = (await metaRes.json()) as { mimeType: string };

  const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!fileRes.ok) throw new Error("Failed to fetch Drive file: " + (await fileRes.text()));
  if (!fileRes.body) throw new Error("Drive file response has no body");

  return { stream: fileRes.body, mimeType };
}
