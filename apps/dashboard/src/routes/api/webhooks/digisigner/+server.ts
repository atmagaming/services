import { invalidateCache } from "$lib/server/data";
import { uploadToDrive } from "$lib/server/google-drive";
import { prisma } from "$lib/server/prisma";
import { digiSigner } from "$lib/server/signer";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  if (body.event_type !== "SIGNATURE_REQUEST_COMPLETED") return new Response(null, { status: 200 });

  const signatureRequestId: string = body.signature_request?.signature_request_id;
  const documentId: string = body.signature_request?.documents?.[0]?.document_id;

  if (!signatureRequestId || !documentId) return new Response(null, { status: 200 });

  const signingRequest = await prisma.signingRequest.findFirst({
    where: { requestId: signatureRequestId },
    include: { person: true },
  });
  if (!signingRequest) return new Response(null, { status: 200 });

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

  return new Response(null, { status: 200 });
};
