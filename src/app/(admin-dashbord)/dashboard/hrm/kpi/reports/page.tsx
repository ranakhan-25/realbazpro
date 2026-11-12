"use client";

import { useState } from "react";
import EmployeeKPICallReportPage from "../employee-call-report/page";
import EmployeeTaskReportPage from "../employee-task-report/page";

type ReportTab = "calls" | "tasks";

export default function HrmKpiReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("calls");

  return (
    <main className="min-h-screen space-y-4 bg-canvas p-4 text-ink">
      <header>
        <h1 className="text-xl font-semibold">HRM KPI Reports</h1>
        <p className="text-sm text-ink-muted">Employee and team KPI performance reports.</p>
      </header>
      <nav aria-label="KPI report type" className="flex gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("calls")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === "calls" ? "bg-indigo-600 text-white" : "bg-surface text-ink-muted hover:bg-canvas"}`}
        >
          Employee Call Report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tasks")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === "tasks" ? "bg-indigo-600 text-white" : "bg-surface text-ink-muted hover:bg-canvas"}`}
        >
          Team KPI Report
        </button>
      </nav>
      {activeTab === "calls" ? <EmployeeKPICallReportPage /> : <EmployeeTaskReportPage />}
    </main>
  );
}
