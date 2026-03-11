import { GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID, GOOGLE_DRIVE_NDA_TEMPLATE_ID } from "$env/static/private";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
  const canViewPersonalData = locals.user?.canViewPersonalData ?? false;
  const canEditPeople = locals.user?.canEditPeople ?? false;

  const res = await fetch("/api/people");
  if (!res.ok) throw new Error("Failed to load people");

  const { people } = await res.json();

  const ndaTemplateUrl = `https://docs.google.com/document/d/${GOOGLE_DRIVE_NDA_TEMPLATE_ID}`;
  const contractTemplateUrl = `https://docs.google.com/document/d/${GOOGLE_DRIVE_CONTRACT_TEMPLATE_ID}`;

  return { people, canViewPersonalData, canEditPeople, ndaTemplateUrl, contractTemplateUrl };
};
