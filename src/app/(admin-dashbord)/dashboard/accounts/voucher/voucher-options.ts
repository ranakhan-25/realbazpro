"use client";

import { useEffect, useState } from "react";
import { accountsFetch } from "@/app/(admin-dashbord)/dashboard/accounts/accounts-fetch";

export interface VoucherOption {
  id: string;
  label: string;
  code?: string;
}

export interface VoucherOptions {
  accounts: VoucherOption[];
  chartGroups: VoucherOption[];
  projects: VoucherOption[];
  projectTypes: VoucherOption[];
  sites: VoucherOption[];
  tasks: VoucherOption[];
  workNames: VoucherOption[];
  invoices: VoucherOption[];
  items: VoucherOption[];
  cheques: VoucherOption[];
  contacts: VoucherOption[];
}

const emptyOptions: VoucherOptions = {
  accounts: [], chartGroups: [], projects: [], projectTypes: [], sites: [], tasks: [],
  workNames: [], invoices: [], items: [], cheques: [], contacts: [],
};

function recordsFrom(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  for (const key of ["data", "items", "records", "results", "rows"]) {
    const records = recordsFrom(object[key]);
    if (records.length) return records;
  }
  return [];
}

function toOptions(value: unknown, labelKeys: string[], idKeys = ["uuid", "id", "value", "code"]): VoucherOption[] {
  const seen = new Set<string>();
  return recordsFrom(value).flatMap((record) => {
    const id = idKeys.map((key) => record[key]).find((entry) => entry !== null && entry !== undefined && String(entry).trim());
    const label = labelKeys.map((key) => record[key]).find((entry) => entry !== null && entry !== undefined && String(entry).trim());
    if (id === undefined || label === undefined) return [];
    const idText = String(id);
    if (seen.has(idText)) return [];
    seen.add(idText);
    const code = record.code ?? record.accountCode ?? record.voucherNo;
    return [{ id: idText, label: String(label), ...(code ? { code: String(code) } : {}) }];
  });
}

async function loadOptions(path: string, labelKeys: string[], idKeys?: string[]) {
  const response = await accountsFetch(`/api/backend/${path}`, { cache: "no-store", headers: { accept: "application/json" } });
  if (!response.ok) return [];
  const json = await response.json().catch(() => ({}));
  if (json?.success === false) return [];
  return toOptions(json, labelKeys, idKeys);
}

export function useVoucherOptions(): VoucherOptions {
  const [options, setOptions] = useState<VoucherOptions>(emptyOptions);

  useEffect(() => {
    let active = true;
    const paths: Array<[keyof VoucherOptions, string, string[], string[]?]> = [
      ["accounts", "chart-of-accounts", ["name", "accountName", "title"], ["uuid", "id"]],
      ["chartGroups", "chart-of-groups", ["name", "groupName", "title"]],
      ["projects", "project", ["projectName", "name", "title"]],
      ["projectTypes", "project-type", ["projectTypeName", "name", "typeName"]],
      ["sites", "project-sites", ["siteName", "name", "title"]],
      ["tasks", "project-tasks", ["taskName", "name", "title"]],
      ["workNames", "project-billing/service-work-names", ["name", "workName", "title"]],
      ["invoices", "project-billing/bill-invoices", ["invoiceNo", "voucherNo", "code", "name", "title"]],
      ["items", "item", ["itemName", "name", "title"]],
      ["cheques", "cheques", ["instrumentNumber", "chequeNo", "chequeNumber", "number"]],
    ];

    void Promise.all(paths.map(async ([key, path, labels, ids]) => {
      try {
        const value = await loadOptions(path, labels, ids);
        if (active) setOptions((current) => ({ ...current, [key]: value }));
      } catch {
        // Keep each dropdown usable when an unrelated optional endpoint is unavailable.
      }
    }));

    void Promise.all([
      loadOptions("customer-account", ["customerName", "name"]),
      loadOptions("supplier-accounts", ["supplierName", "name"]),
      loadOptions("labour-work-bank", ["name", "workerName", "labourName"]),
    ]).then((contacts) => {
      if (active) {
        const unique = new Map(contacts.flat().map((option) => [option.id, option]));
        setOptions((current) => ({ ...current, contacts: [...unique.values()] }));
      }
    });

    return () => { active = false; };
  }, []);

  return options;
}
