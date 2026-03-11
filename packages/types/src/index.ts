export type PersonStatus = "working" | "inactive" | "vacation" | "sick_leave";
export const VALID_STATUSES: PersonStatus[] = ["working", "inactive", "vacation", "sick_leave"];

export type TransactionMethod = "Paid" | "Accrued" | "Invested";

export interface Transaction {
  id: string;
  note: string;
  amount: number;
  usdEquivalent: number;
  currency: string;
  method: TransactionMethod;
  category: string;
  logicalDate: string;
  factualDate: string | null;
  personId: string | null;
  payeeName: string;
}

export interface PersonStatusChange {
  id: string;
  date: string;
  status: PersonStatus;
}

export type DocumentCategory = "nda" | "contract" | "other";

export interface PersonDocument {
  id: string;
  name: string;
  url: string;
  category: DocumentCategory;
}

export interface PersonRole {
  notionId: string;
  name: string;
}

export type IdType = "passport" | "national_id" | "drivers_license" | "residence_permit";

export interface Identification {
  type: IdType | "";
  number: string;
  issueDate: string;
  issuingAuthority: string;
}

export class Rates {
  constructor(
    public paid: number,
    public accrued: number,
  ) {}
  get total() {
    return this.paid + this.accrued;
  }
}

export interface Person {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  image: string;
  identification: Identification;
  weeklySchedule: string;
  schedule: number[];
  hoursPerWeek: number;
  hourlyRate: Rates;
  monthlyPaid: number;
  monthlyAccrued: number;
  monthlyTotal: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  email: string;
  notionPersonPageId: string;
  telegram: string;
  discord: string;
  linkedin: string;
  description: string;
  statusChanges: PersonStatusChange[];
  documents: PersonDocument[];
  roles: PersonRole[];
}

export interface MonthlyExpense {
  month: string;
  paid: number;
  accrued: number;
  invested: number;
  investments: number;
}

export interface ProjectionMonth {
  month: string;
  paid: number;
  accrued: number;
  total: number;
}

export interface RevenueShare {
  month: string;
  shares: Record<string, number>;
  isProjected: boolean;
}

export interface InvestmentPoint {
  month: string;
  values: Record<string, number>;
  isProjected: boolean;
}

export interface ChartSeries {
  name: string;
  color: string;
  data: (number | null)[];
  projData: (number | null)[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  personId: string | null;
  isSuperAdmin: boolean;
  canViewTransactions: boolean;
  canViewRevenueShares: boolean;
  canViewPersonalData: boolean;
  canEditPeople: boolean;
}
