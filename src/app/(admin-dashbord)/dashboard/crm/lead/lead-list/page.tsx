"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  PhoneCall,
  Upload,
  MessageSquare,
  UserPlus,
  ArrowRightLeft,
  Gift,
  Filter,
  Edit,
  Trash2,
  Phone,
  CheckSquare,
  Square,
  Sparkles,
  Building,
  MapPin,
  X,
  MessageCircle,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Download,
  AlertCircle,
  Camera,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface LeadRecord {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  secondaryNumber?: string;
  address?: string;
  organization?: string;
  designation?: string;
  email?: string;
  badge: string;
  srOfficer: string;
  cr: string;
  avatarUrl?: string;
  leadSource?: string;
  interestedProject?: string;
  leadCategory?: string;
  campaign?: string;
  birthDate?: string;
  anniversaryDate?: string;
  profession?: string;
  createdAt?: string;
  lastActivity?: string;
  nextActivity?: string;
}

const mockLeadsData: LeadRecord[] = [
  {
    id: "lead-1",
    leadId: "L261015-0135",
    name: "Riaz",
    phone: "1643235522",
    badge: "New Assignment",
    srOfficer: "Admin",
    cr: "Select CR",
    createdAt: "15-10-2026 04:10:PM",
    lastActivity: "Call Connected\nNote: Interested in 3 BHK",
    nextActivity: "25-10-2026 11:00 AM\nFollow up call",
  },
  {
    id: "lead-2",
    leadId: "L261015-0134",
    name: "Engr.Syed Sagor Ali",
    phone: "1709825133",
    address: "Road No.01, Avenue 03, House-160, Mirpur-12, DOHS, Dhaka",
    organization: "PJS CONSULT ANT FIRM",
    designation: "Engineer",
    badge: "Priority",
    srOfficer: "Admin",
    cr: "Select CR",
    createdAt: "15-10-2026 02:20:PM",
    lastActivity: "Follow Up\nSent project brochure",
    nextActivity: "24-10-2026 03:00 PM\nSite Visit",
  },
  {
    id: "lead-3",
    leadId: "L261012-0132",
    name: "Kazi Mohammad Aseem",
    phone: "1963610277",
    organization: "Madina Group",
    designation: "Executive Director",
    badge: "Prospect",
    srOfficer: "Mohin",
    cr: "Tazmul Reza",
    createdAt: "12-10-2026 11:15:AM",
    lastActivity: "No Answer\nTried calling 2 times",
    nextActivity: "23-10-2026 05:00 PM\nCall again",
  },
];

export default function LeadListPage() {
  // LocalStorage data persistent state
  const [leads, setLeads] = useState<LeadRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_leads_data");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore error
        }
      }
    }
    return mockLeadsData;
  });

  // Save to LocalStorage whenever leads list changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("crm_leads_data", JSON.stringify(leads));
    }
  }, [leads]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Filter States
  const [filterCategory, setFilterCategory] = useState("");
  const [filterProject, setFilterProject] = useState("");

  // Modals Toggle States
  const [isNewOrEditModalOpen, setIsNewOrEditModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Top Action Buttons Modals
  const [isCallAssignOpen, setIsCallAssignOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Active Lead State
  const [activeLead, setActiveLead] = useState<LeadRecord | null>(null);

  // Call Activity Modal States
  const [activeTab, setActiveTab] = useState<"pending" | "requirements" | "followup" | "visits">("pending");
  const [followupStatus, setFollowupStatus] = useState("");
  const [followupComment, setFollowupComment] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [nextFollowupNote, setNextFollowupNote] = useState("");
  const [isJunk, setIsJunk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination State
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    date: "2026-10-22",
    leadCode: "L261022-0136",
    name: "",
    phone: "",
    secondaryNumber: "",
    assignUser: "Admin",
    ifCr: "",
    leadStages: "New Assignment",
    leadSource: "",
    interestedProject: "",
    leadCategory: "",
    campaign: "",
    organization: "",
    designation: "",
    birthDate: "",
    anniversaryDate: "",
    profession: "",
    address: "",
    email: "",
  });

  const verifySelection = (actionCallback: () => void) => {
    if (selectedLeads.length === 0) {
      setIsAlertOpen(true);
    } else {
      actionCallback();
    }
  };

  const handleOpenNewModal = () => {
    setActiveLead(null);
    setFormData({
      date: "2026-10-22",
      leadCode: `L261022-0${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      phone: "",
      secondaryNumber: "",
      assignUser: "Admin",
      ifCr: "",
      leadStages: "New Assignment",
      leadSource: "",
      interestedProject: "",
      leadCategory: "",
      campaign: "",
      organization: "",
      designation: "",
      birthDate: "",
      anniversaryDate: "",
      profession: "",
      address: "",
      email: "",
    });
    setIsNewOrEditModalOpen(true);
  };

  const handleOpenEditModal = (item: LeadRecord) => {
    setActiveLead(item);
    setFormData({
      date: "2026-10-22",
      leadCode: item.leadId,
      name: item.name,
      phone: item.phone,
      secondaryNumber: item.secondaryNumber || "",
      assignUser: item.srOfficer || "Admin",
      ifCr: item.cr || "",
      leadStages: item.badge || "New Assignment",
      leadSource: item.leadSource || "",
      interestedProject: item.interestedProject || "",
      leadCategory: item.leadCategory || "",
      campaign: item.campaign || "",
      organization: item.organization || "",
      designation: item.designation || "",
      birthDate: item.birthDate || "",
      anniversaryDate: item.anniversaryDate || "",
      profession: item.profession || "",
      address: item.address || "",
      email: item.email || "",
    });
    setIsNewOrEditModalOpen(true);
  };

  const handleOpenCallModal = (item: LeadRecord) => {
    setActiveLead(item);
    setFollowupStatus("");
    setFollowupComment("");
    setNextFollowupDate("");
    setNextFollowupNote("");
    setIsJunk(item.badge === "Junk");
    setIsCallModalOpen(true);
  };

  const handleOpenDeleteModal = (item: LeadRecord) => {
    setActiveLead(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (activeLead) {
      setLeads(leads.filter((item) => item.id !== activeLead.id));
      setIsDeleteModalOpen(false);
      setActiveLead(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeLead) {
      setLeads(
        leads.map((item) =>
          item.id === activeLead.id
            ? {
                ...item,
                name: formData.name,
                phone: formData.phone,
                secondaryNumber: formData.secondaryNumber,
                srOfficer: formData.assignUser,
                cr: formData.ifCr || "Select CR",
                badge: formData.leadStages,
                leadSource: formData.leadSource,
                interestedProject: formData.interestedProject,
                leadCategory: formData.leadCategory,
                campaign: formData.campaign,
                organization: formData.organization,
                designation: formData.designation,
                birthDate: formData.birthDate,
                anniversaryDate: formData.anniversaryDate,
                profession: formData.profession,
                address: formData.address,
                email: formData.email,
              }
            : item
        )
      );
    } else {
      const newLead: LeadRecord = {
        id: `lead-${Date.now()}`,
        leadId: formData.leadCode,
        name: formData.name,
        phone: formData.phone,
        secondaryNumber: formData.secondaryNumber,
        srOfficer: formData.assignUser || "Admin",
        cr: formData.ifCr || "Select CR",
        badge: formData.leadStages || "New Assignment",
        leadSource: formData.leadSource || "",
        interestedProject: formData.interestedProject || "",
        leadCategory: formData.leadCategory || "",
        campaign: formData.campaign || "",
        organization: formData.organization || "",
        designation: formData.designation || "",
        birthDate: formData.birthDate || "",
        anniversaryDate: formData.anniversaryDate || "",
        profession: formData.profession || "",
        address: formData.address || "",
        email: formData.email || "",
        createdAt: "22-10-2026 03:00:PM",
      };
      setLeads([newLead, ...leads]);
    }
    setIsNewOrEditModalOpen(false);
  };

  // Call Activity Modal Save Functionality
  const handleSaveCallModalChanges = () => {
    if (!activeLead) return;

    setLeads((prevLeads) =>
      prevLeads.map((item) => {
        if (item.id === activeLead.id) {
          const updatedStage = isJunk ? "Junk" : activeLead.badge;
          
          let lastAct = item.lastActivity;
          if (followupStatus || followupComment) {
            lastAct = `Status: ${followupStatus || "Follow Up"}\nComment: ${followupComment || "N/A"}`;
          }

          let nextAct = item.nextActivity;
          if (nextFollowupDate) {
            nextAct = `Date: ${nextFollowupDate}\nNote: ${nextFollowupNote || "N/A"}`;
          }

          return {
            ...item,
            badge: updatedStage,
            lastActivity: lastAct,
            nextActivity: nextAct,
          };
        }
        return item;
      })
    );

    setIsCallModalOpen(false);
  };

  const handleMarkAsSold = () => {
    if (!activeLead) return;
    setLeads((prev) =>
      prev.map((item) => (item.id === activeLead.id ? { ...item, badge: "Sold" } : item))
    );
    setActiveLead((prev) => (prev ? { ...prev, badge: "Sold" } : null));
    alert(`${activeLead.name} marked as Sold successfully!`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeLead) {
      const imageUrl = URL.createObjectURL(file);
      setActiveLead({ ...activeLead, avatarUrl: imageUrl });
      setLeads((prev) =>
        prev.map((item) => (item.id === activeLead.id ? { ...item, avatarUrl: imageUrl } : item))
      );
    }
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === currentTableData.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(currentTableData.map((item) => item.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter((item) => item !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  // Safe Dynamic Filtering Logic
  const filteredData = leads.filter((item) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.phone.includes(search) ||
      item.leadId.toLowerCase().includes(search);

    const matchesCategory =
      !filterCategory ||
      (item.leadCategory &&
        item.leadCategory.trim().toLowerCase() === filterCategory.trim().toLowerCase());

    const matchesProject =
      !filterProject ||
      (item.interestedProject &&
        item.interestedProject.trim().toLowerCase() === filterProject.trim().toLowerCase());

    return matchesSearch && matchesCategory && matchesProject;
  });

  // Pagination Calculation
  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="w-full space-y-6 px-4 md:px-8 py-6 text-foreground bg-slate-50/50 dark:bg-background min-h-screen">
      
      {/* HEADER & QUICK TOOLBAR */}
      <div className="flex flex-col gap-5 rounded-3xl border border-border/80 bg-card/70 backdrop-blur-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Sparkles size={16} /> CRM Lead Management
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground mt-0.5">
              Lead Directory
            </h1>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold text-muted-foreground bg-muted/40 px-4 py-2 rounded-2xl border border-border/60 w-fit">
            <span>Selected Leads:</span>
            <span className="text-indigo-600 font-black">{selectedLeads.length}</span>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/60">
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition flex items-center gap-2 shadow-sm active:scale-95"
          >
            <Plus size={16} /> +New Lead
          </button>

          <button
            onClick={() => setIsCallAssignOpen(true)}
            className="px-4 py-2.5 bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 active:scale-95"
          >
            <PhoneCall size={15} /> Call Assign
          </button>

          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="px-4 py-2.5 bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 active:scale-95 border border-black/80"
          >
            <Upload size={15} /> Bulk Import
          </button>

          <button
            onClick={() => verifySelection(() => setIsSmsOpen(true))}
            className="px-4 py-2.5 bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 active:scale-95"
          >
            <MessageSquare size={15} /> Send SMS
          </button>

          <button
            onClick={() => verifySelection(() => alert(`${selectedLeads.length} leads converted to customer!`))}
            className="px-4 py-2.5 bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 active:scale-95"
          >
            <UserPlus size={15} /> Convert To Customer
          </button>

          <button
            onClick={() => setIsTransferOpen(true)}
            className="px-4 py-2.5 bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 active:scale-95"
          >
            <ArrowRightLeft size={15} /> Transfer
          </button>

          <button
            onClick={() => verifySelection(() => setIsSmsOpen(true))}
            className="px-4 py-2.5 bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 active:scale-95 border border-indigo-600/30"
          >
            <Gift size={15} /> Wish SMS
          </button>

          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 active:scale-95 ${
              isFilterPanelOpen ? "bg-indigo-600 text-white" : "bg-muted hover:bg-indigo-600 hover:text-white"
            }`}
          >
            <Filter size={15} /> Filter
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      {isFilterPanelOpen && (
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold animate-in fade-in">
          <div>
            <label className="block text-muted-foreground mb-1">Select Date</label>
            <input type="text" defaultValue="January 1, 1971 - October 22, 2026" className="w-full p-2 border rounded-lg bg-background border-border" />
          </div>

          <div>
            <label className="block text-muted-foreground mb-1">Lead Category</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border rounded-lg bg-background border-border"
            >
              <option value="">Select Category</option>
              <option value="Ready Flat">Ready Flat</option>
              <option value="On going">On going</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Junk">Junk</option>
            </select>
          </div>

          <div>
            <label className="block text-muted-foreground mb-1">Teams</label>
            <select className="w-full p-2 border rounded-lg bg-background border-border">
              <option value="">Select Team</option>
              <option value="grod">grod</option>
            </select>
          </div>

          <div>
            <label className="block text-muted-foreground mb-1">Interested Project</label>
            <select
              value={filterProject}
              onChange={(e) => {
                setFilterProject(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border rounded-lg bg-background border-border"
            >
              <option value="">Select Project</option>
              <option value="Mustain Villa">Mustain Villa</option>
              <option value="Royal City">Royal City</option>
              <option value="36 Haque Tower">36 Haque Tower</option>
            </select>
          </div>
        </div>
      )}

      {/* SHOW ENTRIES & SEARCH */}
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

        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search by Name, Mobile, or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none bg-background border-border text-xs font-bold focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* TABLE DISPLAY */}
      <div className="rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-white font-black uppercase text-[11px] tracking-wider bg-indigo-600">
                <th className="p-4 w-12 text-center">SL</th>
                <th className="p-4 w-12 text-center">
                  <button onClick={handleSelectAll}>
                    {selectedLeads.length === currentTableData.length && currentTableData.length > 0 ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} className="text-white/70" />
                    )}
                  </button>
                </th>
                <th className="p-4 min-w-[300px]">NAME & DETAILS</th>
                <th className="p-4 font-black">MOBILE</th>
                <th className="p-4 font-black">SR / OFFICER</th>
                <th className="p-4 font-black">CR</th>
                <th className="p-4 min-w-[180px]">LAST ACTIVITY</th>
                <th className="p-4 min-w-[150px]">NEXT ACTIVITY</th>
                <th className="p-4 text-center font-black">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-semibold text-foreground text-xs">
              {currentTableData.length > 0 ? (
                currentTableData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition">
                    <td className="p-4 font-mono font-bold text-center text-muted-foreground">
                      {indexOfFirstItem + index + 1}
                    </td>
                    
                    <td className="p-4 text-center">
                      <button onClick={() => handleSelectOne(item.id)}>
                        {selectedLeads.includes(item.id) ? (
                          <CheckSquare size={16} className="text-indigo-600" />
                        ) : (
                          <Square size={16} className="text-muted-foreground/60" />
                        )}
                      </button>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-black text-indigo-600 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                          ID: {item.leadId}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-600">
                          {item.badge}
                        </span>
                      </div>

                      <div className="font-black text-sm text-foreground">{item.name}</div>

                      {item.address && (
                        <div className="flex items-start gap-1 text-[11px] text-muted-foreground font-medium">
                          <MapPin size={12} className="mt-0.5 shrink-0 text-indigo-500" />
                          <span>{item.address}</span>
                        </div>
                      )}

                      {item.organization && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                          <Building size={12} className="shrink-0 text-indigo-500" />
                          <span>{item.organization}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-mono font-black text-sm text-foreground">+880{item.phone}</td>
                    <td className="p-4 font-bold text-muted-foreground">{item.srOfficer}</td>
                    <td className="p-4 font-bold text-muted-foreground">{item.cr}</td>
                    <td className="p-4 text-xs font-medium text-muted-foreground whitespace-pre-line">{item.lastActivity || "—"}</td>
                    <td className="p-4 text-xs font-medium text-muted-foreground whitespace-pre-line">{item.nextActivity || "—"}</td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded bg-cyan-400 text-white hover:bg-cyan-500 transition shadow-xs active:scale-95"
                          title="Edit Lead"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => handleOpenCallModal(item)}
                          className="p-1.5 rounded bg-indigo-500 text-white hover:bg-indigo-600 transition shadow-xs active:scale-95"
                          title="Call Activity & Lead Log"
                        >
                          <Phone size={14} />
                        </button>

                        <button
                          onClick={() => handleOpenDeleteModal(item)}
                          className="p-1.5 rounded bg-rose-500 text-white hover:bg-rose-600 transition shadow-xs active:scale-95"
                          title="Delete Lead"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground font-bold">
                    No leads found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-border/80 bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-muted-foreground">
          <div>
            Showing <span className="text-foreground font-extrabold">{totalEntries > 0 ? indexOfFirstItem + 1 : 0}</span> to{" "}
            <span className="text-foreground font-extrabold">{Math.min(indexOfLastItem, totalEntries)}</span> of{" "}
            <span className="text-foreground font-extrabold">{totalEntries}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 rounded-xl font-black text-xs transition ${
                  currentPage === page
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-background border border-border hover:bg-muted text-foreground"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-xl border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* LEAD ACCOUNTS FORM MODAL (NEW LEAD & EDIT LEAD) */}
      {isNewOrEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-5xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between p-4 border-b border-border bg-slate-100 dark:bg-card">
              <h2 className="text-base font-bold text-foreground">
                {activeLead ? "Edit Lead Account" : "Lead Accounts"}
              </h2>
              <button
                onClick={() => setIsNewOrEditModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground border border-border rounded-md bg-background"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-6 text-xs font-semibold">
              
              {/* BASIC INFO */}
              <div className="space-y-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 font-bold rounded-lg text-sm">
                  Basic Info
                </div>

                <div className="p-4 bg-muted/20 border border-border/60 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-muted-foreground mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Lead Code</label>
                    <input
                      type="text"
                      readOnly
                      value={formData.leadCode}
                      className="w-full p-2 border rounded-lg bg-muted border-border font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Phone/Mobile <span className="text-rose-500">*</span></label>
                    <div className="flex border rounded-lg overflow-hidden bg-background border-border">
                      <div className="flex items-center gap-1 bg-muted px-2 border-r text-[11px] font-bold">
                        <span>🇧🇩 (+880)</span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Secondary Number</label>
                    <input
                      type="text"
                      placeholder="Secondary Number"
                      value={formData.secondaryNumber}
                      onChange={(e) => setFormData({ ...formData, secondaryNumber: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Assign User/SR</label>
                    <select
                      value={formData.assignUser}
                      onChange={(e) => setFormData({ ...formData, assignUser: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Mohin">Mohin</option>
                      <option value="Rafiq">Rafiq</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">If CR</label>
                    <select
                      value={formData.ifCr}
                      onChange={(e) => setFormData({ ...formData, ifCr: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border"
                    >
                      <option value="">Select User</option>
                      <option value="Tazmul Reza">Tazmul Reza</option>
                      <option value="Rowza">Rowza</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Lead Stages</label>
                    <select
                      value={formData.leadStages}
                      onChange={(e) => setFormData({ ...formData, leadStages: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border"
                    >
                      <option value="New Assignment">New Assignment</option>
                      <option value="Priority">Priority</option>
                      <option value="Prospect">Prospect</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LEAD DETAILS */}
              <div className="space-y-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 font-bold rounded-lg text-sm flex items-center justify-between">
                  <span>Lead Details</span>
                </div>

                <div className="p-4 bg-muted/20 border border-border/60 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-muted-foreground mb-1">Lead Source</label>
                    <select
                      value={formData.leadSource}
                      onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border"
                    >
                      <option value="">Select Source</option>
                      <option value="Google">Google</option>
                      <option value="Linkedin">Linkedin</option>
                      <option value="Youtube">Youtube</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Reference">Reference</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Interested Project</label>
                    <select
                      value={formData.interestedProject}
                      onChange={(e) => setFormData({ ...formData, interestedProject: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border"
                    >
                      <option value="">Select Interested Project</option>
                      <option value="Mustain Villa">Mustain Villa</option>
                      <option value="Royal City">Royal City</option>
                      <option value="36 Haque Tower">36 Haque Tower</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Lead Category</label>
                    <select
                      value={formData.leadCategory}
                      onChange={(e) => setFormData({ ...formData, leadCategory: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border"
                    >
                      <option value="">Select Category</option>
                      <option value="Ready Flat">Ready Flat</option>
                      <option value="On going">On going</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Junk">Junk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Campaign</label>
                    <select
                      value={formData.campaign}
                      onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border"
                    >
                      <option value="">Select Lead Source</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PERSONAL INFO */}
              <div className="space-y-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 font-bold rounded-lg text-sm">
                  Personal Info
                </div>

                <div className="p-4 bg-muted/20 border border-border/60 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-muted-foreground mb-1">Organization</label>
                    <input
                      type="text"
                      placeholder="Organization"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="Designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Address</label>
                    <input
                      type="text"
                      placeholder="Address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER BUTTONS */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewOrEditModalOpen(false)}
                  className="px-6 py-2 rounded-lg bg-slate-300 dark:bg-muted font-bold text-slate-700 dark:text-foreground"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  Submit
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CALL & LEAD ACTIVITY MODAL */}
      {isCallModalOpen && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-6xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50 dark:bg-card">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground">{activeLead.name}</h2>
                <CheckCircle2 size={18} className="text-blue-500 fill-blue-500/20" />
              </div>
              <button 
                onClick={() => setIsCallModalOpen(false)} 
                className="p-1 rounded-md border border-border hover:bg-muted transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs font-bold">
              
              {/* LEFT PROFILE PANEL */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 border rounded-2xl bg-muted/20 border-border text-center space-y-3">
                  <span className="px-3 py-1 rounded-md bg-black text-white font-mono text-[10px] font-black uppercase">
                    {activeLead.badge}
                  </span>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-20 h-20 mx-auto rounded-full bg-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-md cursor-pointer group overflow-hidden"
                    title="Click to upload image"
                  >
                    {activeLead.avatarUrl ? (
                      <img src={activeLead.avatarUrl} alt={activeLead.name} className="w-full h-full object-cover" />
                    ) : (
                      activeLead.name.substring(0, 2).toUpperCase()
                    )}
                    <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Camera size={18} />
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-muted-foreground hover:text-indigo-600 transition"
                  >
                    Click to upload image
                  </button>

                  {/* QUICK COMMUNICATION BUTTONS */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/60 text-[10px]">
                    <a 
                      href={`https://wa.me/880${activeLead.phone}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex flex-col items-center gap-1 text-emerald-600 hover:scale-105 transition"
                    >
                      <div className="p-2 rounded-full border border-emerald-500/30 bg-emerald-500/10">
                        <MessageCircle size={16} />
                      </div>
                      WhatsApp
                    </a>

                    <a 
                      href={`tel:+880${activeLead.phone}`} 
                      className="flex flex-col items-center gap-1 text-indigo-600 hover:scale-105 transition"
                    >
                      <div className="p-2 rounded-full border border-indigo-500/30 bg-indigo-500/10">
                        <Phone size={16} />
                      </div>
                      Call
                    </a>

                    <button 
                      type="button"
                      onClick={() => {
                        setIsCallModalOpen(false);
                        setIsSmsOpen(true);
                      }} 
                      className="flex flex-col items-center gap-1 text-purple-600 hover:scale-105 transition"
                    >
                      <div className="p-2 rounded-full border border-purple-500/30 bg-purple-500/10">
                        <MessageSquare size={16} />
                      </div>
                      Message
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) alert(`File Attached: ${file.name}`);
                        };
                        input.click();
                      }}
                      className="flex flex-col items-center gap-1 text-rose-600 hover:scale-105 transition"
                    >
                      <div className="p-2 rounded-full border border-rose-500/30 bg-rose-500/10">
                        <Paperclip size={16} />
                      </div>
                      Attachment
                    </button>
                  </div>

                  <div className="pt-2 font-mono text-muted-foreground text-[11px]">
                    <div>ID: {activeLead.leadId}</div>
                    <div>Added By: {activeLead.srOfficer}</div>
                  </div>
                </div>

                <div className="border rounded-2xl bg-card border-border divide-y divide-border text-[11px]">
                  <div className="grid grid-cols-2 p-2.5"><span className="text-muted-foreground">Category</span><span>{activeLead.leadCategory || "Select Category"}</span></div>
                  <div className="grid grid-cols-2 p-2.5"><span className="text-muted-foreground">Phone</span><span className="font-mono">+880{activeLead.phone}</span></div>
                  <div className="grid grid-cols-2 p-2.5"><span className="text-muted-foreground">Organization</span><span>{activeLead.organization || "—"}</span></div>
                  <div className="grid grid-cols-2 p-2.5"><span className="text-muted-foreground">Designation</span><span>{activeLead.designation || "—"}</span></div>
                  <div className="grid grid-cols-2 p-2.5"><span className="text-muted-foreground">SR</span><span>{activeLead.srOfficer}</span></div>
                  <div className="grid grid-cols-2 p-2.5"><span className="text-muted-foreground">CR</span><span>{activeLead.cr}</span></div>
                  <div className="grid grid-cols-2 p-2.5"><span className="text-muted-foreground">Created At</span><span className="font-mono">{activeLead.createdAt || "15-10-2026"}</span></div>
                </div>
              </div>

              {/* RIGHT FOLLOWUP & ACTIVITY PANEL */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* TAB NAVIGATION */}
                <div className="flex flex-wrap gap-2 border-b border-border pb-3">
                  <button 
                    onClick={() => setActiveTab("pending")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                      activeTab === "pending" 
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Upcoming/Pending
                  </button>
                  <button 
                    onClick={() => setActiveTab("requirements")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === "requirements" 
                        ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Requirements <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.2 text-[9px]">0</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("followup")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === "followup" 
                        ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Follow-up <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.2 text-[9px]">1</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("visits")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === "visits" 
                        ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Visits <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.2 text-[9px]">0</span>
                  </button>
                </div>

                {/* DYNAMIC TAB CONTENTS */}
                {activeTab === "pending" && (
                  <div className="p-3 bg-muted/20 border rounded-xl text-muted-foreground text-center font-normal">
                    No pending activities scheduled right now.
                  </div>
                )}
                {activeTab === "requirements" && (
                  <div className="p-3 bg-muted/20 border rounded-xl text-muted-foreground text-center font-normal">
                    No specific project requirements logged.
                  </div>
                )}
                {activeTab === "followup" && (
                  <div className="p-3 bg-muted/20 border rounded-xl text-muted-foreground font-normal space-y-1">
                    <div className="font-bold text-foreground">Previous Follow-up Log:</div>
                    <div>{activeLead.lastActivity || "Initial Assignment Logged"}</div>
                  </div>
                )}
                {activeTab === "visits" && (
                  <div className="p-3 bg-muted/20 border rounded-xl text-muted-foreground text-center font-normal">
                    No physical visits recorded yet.
                  </div>
                )}

                {/* STAGE & QUICK STATUS CHANGE */}
                <div className="p-4 border rounded-2xl bg-muted/20 border-border space-y-3">
                  <div className="font-bold text-muted-foreground">Stage</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select 
                      value={activeLead.badge} 
                      onChange={(e) => {
                        const newBadge = e.target.value;
                        setActiveLead({ ...activeLead, badge: newBadge });
                        setIsJunk(newBadge === "Junk");
                      }}
                      className="p-2 border rounded-xl bg-background border-border font-bold outline-none"
                    >
                      <option value="New Assignment">New Assignment</option>
                      <option value="Priority">Priority</option>
                      <option value="Prospect">Prospect</option>
                      <option value="Junk">Junk</option>
                      <option value="Sold">Sold</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-rose-600 bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isJunk} 
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsJunk(checked);
                          setActiveLead({ ...activeLead, badge: checked ? "Junk" : "New Assignment" });
                        }} 
                      />
                      Move to junk
                    </label>

                    <button 
                      type="button"
                      onClick={handleMarkAsSold}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-black transition shadow-sm"
                    >
                      ✓ Mark as Sold
                    </button>
                  </div>
                </div>

                {/* ADD FOLLOWUP FORM */}
                <div className="p-4 border rounded-2xl bg-muted/20 border-border space-y-3">
                  <div className="font-bold text-muted-foreground">Add Followup</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-muted-foreground mb-1">Status *</label>
                      <select 
                        value={followupStatus}
                        onChange={(e) => setFollowupStatus(e.target.value)}
                        className="w-full p-2 border rounded-xl bg-background border-border outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">Select Communication</option>
                        <option value="Call Connected">Call Connected</option>
                        <option value="Follow Up">Follow Up</option>
                        <option value="No Answer">No Answer</option>
                        <option value="Busy">Busy</option>
                        <option value="Switched Off">Switched Off</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-muted-foreground mb-1">Comment *</label>
                      <textarea
                        rows={2}
                        value={followupComment}
                        onChange={(e) => setFollowupComment(e.target.value)}
                        placeholder="Enter followup comment..."
                        className="w-full p-2 border rounded-xl bg-background border-border outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* NEXT FOLLOWUP FORM */}
                <div className="p-4 border rounded-2xl bg-muted/20 border-border space-y-3">
                  <div className="font-bold text-muted-foreground">Next Followup</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input 
                      type="datetime-local" 
                      value={nextFollowupDate}
                      onChange={(e) => setNextFollowupDate(e.target.value)}
                      className="p-2 border rounded-xl bg-background border-border font-mono outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    />
                    <input 
                      type="text" 
                      value={activeLead.srOfficer} 
                      readOnly 
                      className="p-2 border rounded-xl bg-muted border-border font-bold text-muted-foreground" 
                    />
                    <input 
                      type="text" 
                      value={nextFollowupNote}
                      onChange={(e) => setNextFollowupNote(e.target.value)}
                      placeholder="Note" 
                      className="p-2 border rounded-xl bg-background border-border outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex justify-end gap-3 p-4 border-t border-border bg-slate-50 dark:bg-card">
              <button 
                type="button"
                onClick={() => setIsCallModalOpen(false)} 
                className="px-6 py-2 rounded-xl bg-slate-300 dark:bg-muted text-slate-700 dark:text-foreground font-bold hover:opacity-90 transition"
              >
                Close
              </button>
              <button 
                type="button"
                onClick={handleSaveCallModalChanges} 
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold shadow-md transition"
              >
                Save changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CALL ASSIGN MODAL */}
      {isCallAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base">Call Assign</h3>
              <button onClick={() => setIsCallAssignOpen(false)}><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
              <div>
                <label className="block text-muted-foreground mb-1">Date</label>
                <input type="datetime-local" className="w-full p-2 border rounded-lg bg-background border-border font-mono" />
              </div>
              <div>
                <label className="block text-muted-foreground mb-1">Assign User Type</label>
                <select className="w-full p-2 border rounded-lg bg-background border-border">
                  <option value="Officer/SR">Officer/SR</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-muted-foreground mb-1">Note</label>
                <input type="text" placeholder="Write Descriptions" className="w-full p-2 border rounded-lg bg-background border-border" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setIsCallAssignOpen(false)} className="px-5 py-2 rounded-lg bg-muted font-bold text-xs">Close</button>
              <button onClick={() => setIsCallAssignOpen(false)} className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base">Bulk Import</h3>
              <button onClick={() => setIsBulkImportOpen(false)}><X size={18} /></button>
            </div>

            <div className="flex justify-end">
              <button className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                <Download size={14} /> Sample File Download
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              <div>
                <label className="block text-muted-foreground mb-1">File</label>
                <input type="file" className="w-full p-1.5 border rounded-lg bg-background border-border" />
              </div>
              <div>
                <label className="block text-muted-foreground mb-1">Lead Stage</label>
                <select className="w-full p-2 border rounded-lg bg-background border-border">
                  <option value="New Assignment">New Assignment</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-rose-500 font-bold">
              Note: If Lead Source or Campaign is not found in the Excel file, the values selected in this form will be used.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setIsBulkImportOpen(false)} className="px-5 py-2 rounded-lg bg-muted font-bold text-xs">Close</button>
              <button onClick={() => setIsBulkImportOpen(false)} className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* SMS TEMPLATE MODAL */}
      {isSmsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base">SMS Template</h3>
              <button onClick={() => setIsSmsOpen(false)}><X size={18} /></button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-muted-foreground mb-1">SMS Template</label>
                <select className="w-full p-2 border rounded-lg bg-background border-border">
                  <option value="">Select Template</option>
                  <option value="Welcome">Welcome Template</option>
                  <option value="Followup">Followup Template</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">SMS</label>
                <textarea rows={4} placeholder="Write SMS" className="w-full p-2 border rounded-lg bg-background border-border outline-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setIsSmsOpen(false)} className="px-5 py-2 rounded-lg bg-muted font-bold text-xs">Close</button>
              <button onClick={() => setIsSmsOpen(false)} className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER LEAD MODAL */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base">Transfer Lead</h3>
              <div className="text-xs font-bold">Selected Lead: <span className="text-indigo-600 font-mono text-sm">{selectedLeads.length}</span></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
              <div>
                <label className="block text-muted-foreground mb-1">Assign User</label>
                <select className="w-full p-2 border rounded-lg bg-background border-border">
                  <option value="">Select User</option>
                  <option value="Mohin">Mohin</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Assign Type</label>
                <input type="text" defaultValue="Officer/SR" className="w-full p-2 border rounded-lg bg-muted border-border" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setIsTransferOpen(false)} className="px-5 py-2 rounded-lg bg-muted font-bold text-xs">Close</button>
              <button onClick={() => setIsTransferOpen(false)} className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs">Transfer</button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT MODAL */}
      {isAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border-2 border-amber-500/30">
              <AlertCircle size={32} />
            </div>

            <h3 className="text-lg font-black text-foreground">
              Please select at least one checkbox
            </h3>

            <button
              onClick={() => setIsAlertOpen(false)}
              className="px-6 py-2 rounded-xl bg-cyan-400 text-white font-black text-xs shadow-md"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground">Confirm Delete Lead?</h3>
              <p className="text-xs text-muted-foreground font-medium">
                Are you sure you want to delete lead <span className="font-bold text-foreground">"{activeLead.name}"</span>?
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-muted font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-black text-xs shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}