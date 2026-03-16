import { DigiSigner } from "@elumixor/digisigner";
import { env } from "env";
import { google } from "services/google-api";
import { type DocumentCategory, type IdType, prisma } from "services/prisma";
import { formatDateLong } from "./date-formatter";
import { SignatureBoxExtractor } from "./signature-box-extractor";

const digiSigner = new DigiSigner(env.DIGISIGNER_API_KEY);

export async function sign(
  personId: string,
  category: DocumentCategory,
): Promise<{ requestId: string; adminUrl: string; personUrl: string }> {
  const {
    firstName,
    lastName,
    name,
    email,
    idType,
    idIssueDate,
    idIssuingAuthority,
    idNumber,
    schedule,
    roles,
    statusChanges,
    hourlyRatePaid,
    hourlyRateAccrued,
  } = await prisma.person.findFirstOrThrow({
    where: { id: personId },
    include: { roles: { select: { name: true } }, statusChanges: { select: { status: true, date: true } } },
  });

  const templateId = category === "nda" ? env.GOOGLE_DRIVE_NDA_TEMPLATE_ID : env.GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID;

  const fullName = `${firstName} ${lastName}`.trim() || name;
  const docName = `${category.toUpperCase()} - ${fullName} - ${new Date().toISOString().slice(0, 10)}`;

  const { id: copiedDocId } = await google.drive.copy(templateId, docName, env.GOOGLE_DRIVE_AGREEMENTS_FOLDER_ID);

  if (!idType || !idNumber || !idIssuingAuthority || !idIssueDate || !fullName || !email)
    throw new Error("Missing required identification information for signing");

  const idTypeLabel = {
    passport: "passport",
    national_id: "national id",
    drivers_license: "driver's license",
    residence_permit: "residence permit",
  } satisfies { [key in IdType]: string };

  const idTypeStr = idTypeLabel[idType];
  const issueDate = formatDateLong(idIssueDate);
  const identification = `${idTypeStr} ${idNumber} issued on ${issueDate} by authority ${idIssuingAuthority}`;

  const replacements: Record<string, string> = {
    "[NAME]": fullName,
    "[EMAIL]": email,
    "[IDENTIFICATION]": identification,
    "[DATE]": formatDateLong(new Date()),
  };

  if (category === "contract") {
    if (!schedule) throw new Error("Missing schedule for contract signing");
    if (roles.length === 0) throw new Error("Missing role for contract signing");

    const hoursPerWeek = schedule.split(",").reduce((total, part) => total + Number.parseInt(part, 10), 0);

    // Start date is the date of the first status change with status "active"
    const startDate = statusChanges.find((sc) => sc.status === "working")?.date;
    if (!startDate) throw new Error("Missing active status change for contract signing");

    replacements["[ROLE]"] = roles[0].name;
    replacements["[HOURS_PER_SPRINT]"] = String(hoursPerWeek);
    replacements["[START_DATE]"] = formatDateLong(startDate);
    replacements["[PAID_RATE]"] = hourlyRatePaid.toFixed(2);
    replacements["[INVESTMENT_RATE]"] = hourlyRateAccrued.toFixed(2);
  }

  await google.docs.replaceText(copiedDocId, replacements);
  const pdfBuffer = await google.docs.exportPdf(copiedDocId);

  const extractor = new SignatureBoxExtractor(pdfBuffer);
  const lastPage = (await extractor.numPages) - 1;

  const [adminBox, personBox] = await Promise.all([
    extractor.getSignBox(env.SIGNING_ADMIN_NAME, env.SIGNING_ADMIN_EMAIL),
    extractor.getSignBox(fullName, email),
  ]);

  const toRect = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) =>
    [Math.round(x), Math.round(y), Math.round(x + width), Math.round(y + height)] as [number, number, number, number];

  const documentId = await digiSigner.upload(pdfBuffer, `${docName}.pdf`);

  const { signature_request_id } = await digiSigner.sendSignatureRequest(documentId, {
    subject: `Please sign: ${docName}`,
    message: "Please review and sign this document.",
    signers: [
      {
        email: env.SIGNING_ADMIN_EMAIL,
        fields: [{ page: lastPage, rectangle: toRect(adminBox), type: "SIGNATURE" }],
      },
      { email, fields: [{ page: lastPage, rectangle: toRect(personBox), type: "SIGNATURE" }] },
    ],
  });

  const status = await digiSigner.getStatus(signature_request_id);
  const signers = status.documents[0]?.signers;
  if (!signers || signers.length < 2) throw new Error("Failed to get signing URLs from DigiSigner");

  const adminSigner = signers.find((s) => s.email === env.SIGNING_ADMIN_EMAIL);
  const personSigner = signers.find((s) => s.email === email);

  if (!adminSigner?.sign_document_url) throw new Error("Failed to get admin signing URL");
  if (!personSigner?.sign_document_url) throw new Error("Failed to get person signing URL");

  return {
    requestId: signature_request_id,
    adminUrl: adminSigner.sign_document_url,
    personUrl: personSigner.sign_document_url,
  };
}
