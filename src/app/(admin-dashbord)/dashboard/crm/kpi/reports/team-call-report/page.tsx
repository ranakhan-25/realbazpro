"use client";

import React, { useState } from "react";
import {
  Search,
  Sparkles,
  Users,
  PhoneCall,
  Target,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface TeamKPICallReportRecord {
  id: string;
  sl: number;
  name: string;
  fromDate: string;
  toDate: string;
  leftDays: number;
  targetCall: number;
  achieveCall: number;
  targetTask: number;
  achieveTask: number;
}

const mockTeamReportData: TeamKPICallReportRecord[] = [
  {
    id: "team-rep-1",
    sl: 1,
    name: "grod",
    fromDate: "22/10/2026",
    toDate: "17/11/2026",
    leftDays: 26,
    targetCall: 11,
    achieveCall: 4,
    targetTask: 4,
    achieveTask: 2,
  },
  {
    id: "team-rep-2",
    sl: 2,
    name: "Go",
    fromDate: "01/07/2026",
    toDate: "31/07/2026",
    leftDays: 0,
    targetCall: 9,
    achieveCall: 9,
    targetTask: 8,
    achieveTask: 8,
  },
  {
    id: "team-rep-3",
    sl: 3,
    name: "Gladiators",
    fromDate: "07/06/2026",
    toDate: "07/07/2026",
    leftDays: 0,
    targetCall: 200,
    achieveCall: 150,
    targetTask: 20,
    achieveTask: 18,
  },
];

export default function TeamCallReportPage() {
  const [reports] = useState<TeamKPICallReportRecord[]>(mockTeamReportData);
  const [searchQuery, setSearchQuery] = useState("");

  const [fromDate, setFromDate] = useState("2026-10-22");
  const [toDate, setToDate] = useState("2026-10-22");
  const [selectedTeam, setSelectedTeam] = useState("all");

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const getPercentage = (achieved: number, target: number) => {
    if (!target || target <= 0) return 0;
    const pct = Math.round((achieved / target) * 100);
    return pct > 100 ? 100 : pct;
  };

  const getBadgeStyle = (pct: number) => {
    if (pct >= 80) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (pct >= 40) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    return "bg-rose-500/10 text-rose-600 border-rose-500/20";
  };

  const filteredData = reports.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fromDate.includes(searchQuery) ||
      item.toDate.includes(searchQuery);

    const matchesTeam = selectedTeam === "all" || item.name === selectedTeam;

    return matchesSearch && matchesTeam;
  });

  const totalPages = Math.ceil(filteredData.length / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="w-full space-y-6 px-4 md:px-8 py-6 text-foreground bg-slate-50/50 dark:bg-background min-h-screen">
      
      {/* HEADER (Standardized Indigo Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-border/80 bg-card/70 backdrop-blur-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles size={16} /> Reports & Analytics
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground mt-1">
            Team KPI Report
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Monitor overall team performance, target calls, tasks, and completion rate percentages.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs font-bold text-muted-foreground bg-muted/30 px-4 py-2.5 rounded-2xl border border-border/60">
          <span>Total Teams:</span>
          <span className="text-indigo-600 font-black">{reports.length}</span>
        </div>
      </div>

      {/* STATS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Team Target Calls</span>
            <span className="text-2xl font-black block font-mono mt-1 text-indigo-600">
              {reports.reduce((acc, curr) => acc + curr.targetCall, 0)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-600">
            <PhoneCall size={20} />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Achieved Calls</span>
            <span className="text-2xl font-black block font-mono mt-1 text-emerald-600">
              {reports.reduce((acc, curr) => acc + curr.achieveCall, 0)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Team Target Tasks</span>
            <span className="text-2xl font-black block font-mono mt-1 text-indigo-600">
              {reports.reduce((acc, curr) => acc + curr.targetTask, 0)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-600">
            <Target size={20} />
          </div>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-black text-muted-foreground uppercase mb-1.5">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full p-2.5 border rounded-xl bg-background border-border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block text-[11px] font-black text-muted-foreground uppercase mb-1.5">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full p-2.5 border rounded-xl bg-background border-border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block text-[11px] font-black text-muted-foreground uppercase mb-1.5">Select Team</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full p-2.5 border rounded-xl bg-background border-border text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Select Team</option>
            <option value="grod">grod</option>
            <option value="Go">Go</option>
            <option value="Gladiators">Gladiators</option>
          </select>
        </div>
      </div>

      {/* SHOW ENTRIES & SEARCH BAR */}
      <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-black text-muted-foreground">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="p-2 border rounded-xl bg-background border-border text-foreground font-black outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search team or date..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none bg-background border-border text-xs font-bold focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* TABLE DISPLAY */}
      <div className="rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-white font-black uppercase text-[10px] tracking-wider bg-indigo-600">
                <th className="p-4">SL</th>
                <th className="p-4">NAME</th>
                <th className="p-4">FROM</th>
                <th className="p-4">TO</th>
                <th className="p-4">LEFT DAYS</th>
                <th className="p-4">TARGET CALL</th>
                <th className="p-4">ACHIEVE CALL</th>
                <th className="p-4">PERCENTAGE</th>
                <th className="p-4">TARGET TASK</th>
                <th className="p-4">ACHIEVE TASK</th>
                <th className="p-4">PERCENTAGE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-bold text-foreground">
              {currentTableData.length > 0 ? (
                currentTableData.map((item, index) => {
                  const callPct = getPercentage(item.achieveCall, item.targetCall);
                  const taskPct = getPercentage(item.achieveTask, item.targetTask);

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition">
                      <td className="p-4 font-mono font-bold text-muted-foreground">{indexOfFirstItem + index + 1}</td>
                      <td className="p-4 font-black text-foreground">{item.name || "—"}</td>
                      <td className="p-4 font-mono text-muted-foreground">{item.fromDate}</td>
                      <td className="p-4 font-mono text-muted-foreground">{item.toDate}</td>
                      <td className="p-4 font-mono font-black text-rose-500">{item.leftDays}d</td>
                      
                      <td className="p-4 font-mono font-black text-indigo-600">{item.targetCall}</td>
                      <td className="p-4 font-mono font-black">{item.achieveCall}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-2xs ${getBadgeStyle(callPct)}`}>
                          {callPct}%
                        </span>
                      </td>

                      <td className="p-4 font-mono font-black text-indigo-600">{item.targetTask}</td>
                      <td className="p-4 font-mono font-black">{item.achieveTask}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-2xs ${getBadgeStyle(taskPct)}`}>
                          {taskPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-muted-foreground font-bold">
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-muted-foreground bg-muted/20">
          <span>
            Showing {filteredData.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 rounded-xl bg-card border border-border hover:bg-indigo-600 hover:text-white transition disabled:opacity-40 font-bold"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3.5 py-1.5 rounded-xl transition font-black ${
                  currentPage === page
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-card border border-border hover:bg-indigo-600 hover:text-white"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 rounded-xl bg-card border border-border hover:bg-indigo-600 hover:text-white transition disabled:opacity-40 font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}