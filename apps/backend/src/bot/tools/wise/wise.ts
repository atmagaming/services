import { env } from "env";
import { WiseApi } from "../../../services/wise";

export const wise = new WiseApi(env.WISE_API_TOKEN);
