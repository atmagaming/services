import { env } from "env";
import { createSigningClient } from "../../../services/signing";

const client = createSigningClient(env.DIGISIGNER_API_KEY);
export const { cancelSign } = client;

export async function sendForSign(
  filePath: string,
  signers: { name: string; email: string }[],
  options: { subject?: string; message?: string } = {},
) {
  const fileBuffer = Buffer.from(await Bun.file(filePath).arrayBuffer());
  const fileName = filePath.split("/").at(-1) ?? "document.pdf";
  return client.sendForSign(fileBuffer, fileName, signers, options);
}
