import { DigiSigner } from "@elumixor/digisigner";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  DIGISIGNER_API_KEY,
  GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID,
  GOOGLE_DRIVE_NDA_TEMPLATE_ID,
  SIGNING_ADMIN_EMAIL,
  SIGNING_ADMIN_NAME,
} from "$env/static/private";
import type { Person } from "$lib/types";
import { copyDocToAgreements, exportDocAsPdf, replaceTextInDoc } from "./google-drive";
import "$lib/date-extensions";

export const digiSigner = new DigiSigner(DIGISIGNER_API_KEY);

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
): Promise<{ requestId: string; adminUrl: string; personUrl: string }> {
  const templateId = category === "nda" ? GOOGLE_DRIVE_NDA_TEMPLATE_ID : GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID;

  const fullName = `${person.firstName} ${person.lastName}`.trim() || person.name;
  const docName = `${category.toUpperCase()} - ${fullName} - ${new Date().toISOString().slice(0, 10)}`;

  // Copy template → fill in data → export PDF
  const copiedDocId = await copyDocToAgreements(templateId, docName);

  const idTypeLabel: Record<string, string> = {
    passport: "Passport",
    national_id: "National ID",
    drivers_license: "Driver's License",
    residence_permit: "Residence Permit",
  };
  const idType = idTypeLabel[person.identification.type] ?? person.identification.type;
  const issueDate = person.identification.issueDate ? Date.fromIso(person.identification.issueDate).toLong() : "";
  const identification = `${idType.toLowerCase()} ${person.identification.number} issued on ${issueDate} by authority ${person.identification.issuingAuthority}`;

  const replacements: Record<string, string> = {
    "[NAME]": fullName,
    "[EMAIL]": person.email,
    "[IDENTIFICATION]": identification,
    "[DATE]": new Date().toLong(),
  };

  if (category === "contract") {
    replacements["[ROLE]"] = person.roles.map((r) => r.name).first ?? "";
    replacements["[HOURS_PER_SPRINT]"] = String(person.hoursPerWeek);
    replacements["[START_DATE]"] = person.startDate ? Date.fromIso(person.startDate).toLong() : "";
    replacements["[PAID_RATE]"] = person.hourlyRate.paid.toFixed(2);
    replacements["[INVESTMENT_RATE]"] = person.hourlyRate.accrued.toFixed(2);
  }

  await replaceTextInDoc(copiedDocId, replacements);

  const pdfBuffer = await exportDocAsPdf(copiedDocId);

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const numPages = pdf.numPages;
  const lastPage = numPages - 1;

  // Find signature boxes for both signers
  const [adminBox, personBox] = await Promise.all([
    getSignatureBox(pdfBuffer, SIGNING_ADMIN_NAME, SIGNING_ADMIN_EMAIL),
    getSignatureBox(pdfBuffer, fullName, person.email),
  ]);

  const toRect = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) =>
    [Math.round(x), Math.round(y), Math.round(x + width), Math.round(y + height)] as [number, number, number, number];

  // Upload to DigiSigner and send
  const documentId = await digiSigner.upload(pdfBuffer, `${docName}.pdf`);

  const { signature_request_id } = await digiSigner.sendSignatureRequest(documentId, {
    subject: `Please sign: ${docName}`,
    message: "Please review and sign this document.",
    signers: [
      {
        email: SIGNING_ADMIN_EMAIL,
        fields: [{ page: lastPage, rectangle: toRect(adminBox), type: "SIGNATURE" }],
      },
      {
        email: person.email,
        fields: [{ page: lastPage, rectangle: toRect(personBox), type: "SIGNATURE" }],
      },
    ],
  });

  const status = await digiSigner.getStatus(signature_request_id);
  const signers = status.documents[0]?.signers;
  if (!signers || signers.length < 2) throw new Error("Failed to get signing URLs from DigiSigner");

  const adminSigner = signers.find((s) => s.email === SIGNING_ADMIN_EMAIL);
  const personSigner = signers.find((s) => s.email === person.email);

  if (!adminSigner?.sign_document_url) throw new Error("Failed to get admin signing URL");
  if (!personSigner?.sign_document_url) throw new Error("Failed to get person signing URL");

  return {
    requestId: signature_request_id,
    adminUrl: adminSigner.sign_document_url,
    personUrl: personSigner.sign_document_url,
  };
}
