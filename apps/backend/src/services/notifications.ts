import { env } from "env";

export async function notifySigningRequest(options: {
  fullName: string;
  email: string;
  role: string;
  category: string;
  adminUrl: string;
  personUrl: string;
}): Promise<void> {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_ADMIN_USER_ID,
      text:
        `📄 <b>${options.category} signing request sent</b>\n\n` +
        `<b>Person:</b> ${options.fullName}\n` +
        `<b>Email:</b> ${options.email}\n` +
        `<b>Role:</b> ${options.role}\n\n` +
        `<b>My signing link:</b>\n<a href="${options.adminUrl}">${options.adminUrl}</a>\n\n` +
        `<b>Their signing link:</b>\n<a href="${options.personUrl}">${options.personUrl}</a>`,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
    // Intentionally fire-and-forget: notification failure must not block the signing response
  }).catch((e: Error) => console.error("Telegram notification failed:", e.message));
}
