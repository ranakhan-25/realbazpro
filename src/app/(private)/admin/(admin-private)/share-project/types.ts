export type ShareProjectStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "published"
  | "unpublished";

export type ShareProjectRecord = {
  id?: string | number;
  uuid?: string;
  code?: string;
  name?: string;
  projectType?: string;
  location?: string;
  description?: string;
  totalBudget?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  createdAt?: string;
  owner?: unknown;
  creatorName?: string;
  creatorEmail?: string;
  creatorPhone?: string;
  companyName?: string;
  totalInvestmentAmount?: number | string;
  pricePerShare?: number | string;
  totalShares?: number;
  expectedAnnualReturn?: number | string;
  category?: { name?: string } | null;
  [key: string]: unknown;
};

export type ShareUserRecord = {
  id?: string | number;
  uuid?: string;
  code?: string;
  name?: string;
  mobileNo?: string;
  email?: string;
  nid?: string;
  address?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type ProjectCategoryRecord = {
  id?: string | number;
  uuid?: string;
  code?: string;
  name?: string;
  createdAt?: string;
  [key: string]: unknown;
};
