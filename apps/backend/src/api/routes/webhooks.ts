import { Hono } from "hono";
import { invalidateCache } from "../cache";
import { uploadToDrive } from "../services/google-drive";
import { prisma } from "../prisma";
import { digiSigner } from "../services/signing";

const webhooks = new Hono();

webhooks.post("/digisigner", async (c) => {
  const body = await c.req.json();
  if (body.event_type !== "SIGNATURE_REQUEST_COMPLETED") return c.body(null, 200);

  const signatureRequestId: string = body.signature_request?.signature_request_id;
  const documentId: string = body.signature_request?.documents?.[0]?.document_id;

  if (!signatureRequestId || !documentId) return c.body(null, 200);

  const signingRequest = await prisma.signingRequest.findFirst({
    where: { requestId: signatureRequestId },
    include: { person: true },
  });
  if (!signingRequest) return c.body(null, 200);

  const fullName =
    `${signingRequest.person.firstName} ${signingRequest.person.lastName}`.trim() || signingRequest.person.name;
  const filename = `${signingRequest.category.toUpperCase()} - ${fullName} - signed.pdf`;

  const pdfBuffer = await digiSigner.download(documentId);
  const driveFileId = await uploadToDrive(filename, "application/pdf", pdfBuffer);

  await prisma.personDocument.create({
    data: {
      personId: signingRequest.personId,
      name: filename,
      url: driveFileId,
      category: signingRequest.category,
    },
  });

  invalidateCache("people");
  return c.body(null, 200);
});

export default webhooks;
