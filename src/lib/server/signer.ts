import { DigiSigner } from "@elumixor/digisigner";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  DIGISIGNER_API_KEY,
  GOOGLE_DRIVE_NDA_TEMPLATE_ID,
  GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID,
} from "$env/static/private";
import { copyDocToAgreements, exportDocAsPdf, replaceTextInDoc } from "./google-drive";
import type { Person } from "$lib/types";

const digiSigner = new DigiSigner(DIGISIGNER_API_KEY);

async function findTextPosition(buffer: Buffer, text: string, pageIndex: number) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const page = await pdf.getPage(pageIndex + 1);
  const textContent = await page.getTextContent();

  for (const item of textContent.items) {
    if ("str" in item && item.str.trim() === text)
      return { x: item.transform[4], y: item.transform[5], width: item.width, height: item.height };
  }
}

async function getSignatureBox(buffer: Buffer, name: string, email: string) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const numPages = pdf.numPages;
  const lastPageIndex = numPages - 1;

  const page = await pdf.getPage(numPages);
  const { width } = page.getViewport({ scale: 1 });

  const [namePos, emailPos] = await Promise.all([
    findTextPosition(buffer, name, lastPageIndex),
    findTextPosition(buffer, email, lastPageIndex),
  ]);

  if (!namePos) throw new Error(`Could not find name "${name}" in document`);
  if (!emailPos) throw new Error(`Could not find email "${email}" in document`);

  const lineDiff = emailPos.y - namePos.y;
  return {
    x: namePos.x,
    y: namePos.y - lineDiff,
    width: width * 0.24,
    height: namePos.height * 3,
  };
}

export async function sendDocumentForSigning(
  person: Person,
  category: "nda" | "contract",
): Promise<string> {
  const templateId =
    category === "nda" ? GOOGLE_DRIVE_NDA_TEMPLATE_ID : GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID;

  const fullName = `${person.firstName} ${person.lastName}`.trim() || person.name;
  const docName = `${category.toUpperCase()} - ${fullName} - ${new Date().toISOString().slice(0, 10)}`;

  // Copy template → fill in data → export PDF
  const copiedDocId = await copyDocToAgreements(templateId, docName);

  await replaceTextInDoc(copiedDocId, {
    "{{firstName}}": person.firstName,
    "{{lastName}}": person.lastName,
    "{{fullName}}": fullName,
    "{{name}}": fullName,
    "{{email}}": person.email,
    "{{passportNumber}}": person.passportNumber,
    "{{passportIssueDate}}": person.passportIssueDate,
    "{{passportIssuingAuthority}}": person.passportIssuingAuthority,
    "{{date}}": new Date().toLocaleDateString("en-GB"),
  });

  const pdfBuffer = await exportDocAsPdf(copiedDocId);

  // Find signature box position
  const { x, y, width, height } = await getSignatureBox(pdfBuffer, fullName, person.email);
  const x2 = x + width;
  const y2 = y + height;

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const numPages = pdf.numPages;

  // Upload to DigiSigner and send
  const documentId = await digiSigner.upload(pdfBuffer, `${docName}.pdf`);

  const { signature_request_id } = await digiSigner.sendSignatureRequest(documentId, {
    subject: `Please sign: ${docName}`,
    message: "Please review and sign this document.",
    signers: [
      {
        email: person.email,
        fields: [
          {
            page: numPages - 1,
            rectangle: [Math.round(x), Math.round(y), Math.round(x2), Math.round(y2)],
            type: "SIGNATURE",
          },
        ],
      },
    ],
  });

  const status = await digiSigner.getStatus(signature_request_id);
  const signUrl = status.documents[0]?.signers[0]?.sign_document_url;
  if (!signUrl) throw new Error("Failed to get signing URL from DigiSigner");

  return signUrl;
}
