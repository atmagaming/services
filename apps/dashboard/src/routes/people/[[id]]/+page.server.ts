import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => ({ personId: params.id });
