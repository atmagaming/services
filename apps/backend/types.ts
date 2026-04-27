export interface SessionUser {
  email: string;
  personId: string | null;
  isSuperAdmin: boolean;
  canViewTransactions: boolean;
  canViewRevenueShares: boolean;
  canViewPersonalData: boolean;
  canEditTransactions: boolean;
  canEditPeople: boolean;
}
