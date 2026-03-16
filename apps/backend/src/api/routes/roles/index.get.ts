import { defineEventHandler } from "h3";
import { prisma } from "services/prisma";

export default defineEventHandler(() => prisma.role.findMany());
