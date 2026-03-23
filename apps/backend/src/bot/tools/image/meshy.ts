import { env } from "env";
import { MeshyClient } from "../../../services/meshy";

export const meshyClient = new MeshyClient(env.MESHY_API_KEY);
