import { Metadata } from "next";
import CrmLeadDirectory from "@/components/crm/crm-lead-directory";

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
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ChevronDown
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
  remark?: string;
  query?: string;
}

const mockLeadsData: LeadRecord[] = [
  {
    id: "lead-1",
    leadId: "L261015-0135",
    name: "jannati2222232323",
    phone: "1754252246",
    badge: "JUNK",
    srOfficer: "Admin",
    cr: "Select CR",
    createdAt: "15-10-2026 04:10:PM",
    lastActivity: "Call Connected\nNote: Interested in 3 BHK",
    nextActivity: "25-10-2026 11:00 AM\nFollow up call",
    organization: "sdfs",
    designation: "sfsd",
    address: "shatkhira",
    leadSource: "Linkedin"
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("crm_leads_data", JSON.stringify(leads));
    }
  }, [leads]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterProject, setFilterProject] = useState("");

  const [isNewOrEditModalOpen, setIsNewOrEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(true);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);

  const [isCallAssignOpen, setIsCallAssignOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isWishSmsOpen, setIsWishSmsOpen] = useState(false);
  const [isSmsConfirmOpen, setIsSmsConfirmOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const [callAssignDate, setCallAssignDate] = useState("");
  const [callAssignUserType, setCallAssignUserType] = useState("Officer/SR");
  const [callAssignNote, setCallAssignNote] = useState("");

  const [transferUser, setTransferUser] = useState("");
  const [transferType, setTransferType] = useState("Officer/SR");
  const [transferFollowup, setTransferFollowup] = useState(false);
  const [transferManualSet, setTransferManualSet] = useState(false);

  const [smsTemplate, setSmsTemplate] = useState("");
  const [smsText, setSmsText] = useState("");

  const [activeLead, setActiveLead] = useState<LeadRecord | null>(null);

  const [isCallActivityPageOpen, setIsCallActivityPageOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("Upcoming/Pending");
  const [currentActivity, setCurrentActivity] = useState("Followup");
  const [nextActivityType, setNextActivityType] = useState("Followup");
  const [followupStatus, setFollowupStatus] = useState("");
  const [followupComment, setFollowupComment] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [nextFollowupNote, setNextFollowupNote] = useState("");
  const [isJunk, setIsJunk] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [reqPrice, setReqPrice] = useState("");
  const [reqSize, setReqSize] = useState("");
  const [reqArea, setReqArea] = useState("");
  const [reqType, setReqType] = useState("");
  const [reqDesc, setReqDesc] = useState("");

  const [propProject, setPropProject] = useState("");
  const [noteInput, setNoteInput] = useState("");

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  const tabs = [
    { name: "Upcoming/Pending", count: null },
    { name: "Requirements", count: 0 },
    { name: "Deal Negotiation", count: 0 },
    { name: "Property", count: 0 },
    { name: "Follow-up", count: 1 },
    { name: "Visits", count: 0 },
    { name: "Note", count: 0 },
  ];

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

  const handleOpenCallActivityPage = (item: LeadRecord) => {
    setActiveLead(item);
    setFollowupStatus("");
    setFollowupComment("");
    setNextFollowupDate("");
    setNextFollowupNote("");
    setIsJunk(item.badge === "JUNK" || item.badge === "Junk");
    setIsCallActivityPageOpen(true);
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

  const handleSaveCallPageChanges = () => {
    if (!activeLead) return;

    setLeads((prevLeads) =>
      prevLeads.map((item) => {
        if (item.id === activeLead.id) {
          const updatedStage = isJunk ? "JUNK" : activeLead.badge;
          
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
            ...activeLead,
            badge: updatedStage,
            lastActivity: lastAct,
            nextActivity: nextAct,
          };
        }
        return item;
      })
    );

    setIsCallActivityPageOpen(false);
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

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Attachment "${file.name}" uploaded successfully!`);
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

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

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  if (isCallActivityPageOpen && activeLead) {
    return (
      <div className="w-full min-h-screen bg-[#f4f6f9] dark:bg-slate-950 px-3 md:px-6 py-4 text-slate-800 dark:text-slate-100 font-sans space-y-4">
        
        {/* Top Header Navigation Bar */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCallActivityPageOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <div className="flex items-center gap-1.5 ml-1">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeLead.name}
              </h1>
              <CheckCircle2 size={18} className="text-blue-600 fill-blue-600/10" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCallActivityPageOpen(false)}
              className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-xs text-slate-600 dark:text-slate-300 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveCallPageChanges}
              className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              Save changes
            </button>
          </div>
        </div>

        {/* Main 2-Column Dashboard Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT COLUMN: Lead Profile & Details Form */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Top Profile Box */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs text-center space-y-3">
              <div>
                <span className="px-3 py-1 rounded-md bg-[#2b255e] text-white font-black text-[10px] uppercase tracking-wider">
                  {isJunk ? "JUNK" : activeLead.badge}
                </span>
              </div>

              {/* Avatar Upload */}
              <div className="relative group w-20 h-20 mx-auto">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-[#ff9900] text-white font-black text-2xl flex items-center justify-center shadow-xs cursor-pointer overflow-hidden"
                >
                  {activeLead.avatarUrl ? (
                    <img src={activeLead.avatarUrl} alt={activeLead.name} className="w-full h-full object-cover" />
                  ) : (
                    activeLead.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1.5 text-[10px] font-bold text-slate-400 hover:text-blue-600 transition block mx-auto"
                >
                  Click to upload image
                </button>
              </div>

              {/* Functional Quick Action Buttons */}
              <div className="grid grid-cols-4 gap-1 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold">
                {/* WhatsApp Button */}
                <a
                  href={`https://wa.me/880${activeLead.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1.5 text-blue-600 hover:scale-105 transition"
                >
                  <div className="w-9 h-9 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                    <MessageCircle size={18} />
                  </div>
                  <span>WhatsApp</span>
                </a>

                {/* Call Button */}
                <a
                  href={`tel:+880${activeLead.phone}`}
                  className="flex flex-col items-center gap-1.5 text-blue-600 hover:scale-105 transition"
                >
                  <div className="w-9 h-9 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                    <Phone size={18} />
                  </div>
                  <span>Call</span>
                </a>

                {/* Message Button */}
                <button
                  type="button"
                  onClick={() => setIsSmsOpen(true)}
                  className="flex flex-col items-center gap-1.5 text-blue-600 hover:scale-105 transition"
                >
                  <div className="w-9 h-9 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                  <span>Message</span>
                </button>

                {/* Attachment Button */}
                <input
                  type="file"
                  ref={attachmentInputRef}
                  onChange={handleAttachmentUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  className="flex flex-col items-center gap-1.5 text-blue-600 hover:scale-105 transition"
                >
                  <div className="w-9 h-9 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                    <Paperclip size={18} />
                  </div>
                  <span>Attachment</span>
                </button>
              </div>

              <div className="pt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5">
                <div>ID: <span className="text-slate-800 dark:text-slate-200 font-bold">{activeLead.leadId}</span></div>
                <div>Added By: <span className="text-slate-800 dark:text-slate-200 font-bold">{activeLead.srOfficer}</span></div>
              </div>
            </div>

            {/* Left Column Detailed Form Fields */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 text-xs font-semibold">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={activeLead.leadCategory || "Ready Flat"}
                    onChange={(e) => setActiveLead({ ...activeLead, leadCategory: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="Ready Flat">Ready Flat</option>
                    <option value="Ongoing">Ongoing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={activeLead.name}
                    onChange={(e) => setActiveLead({ ...activeLead, name: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={`+880${activeLead.phone}`}
                    onChange={(e) => setActiveLead({ ...activeLead, phone: e.target.value.replace("+880", "") })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-700 dark:text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={activeLead.email || ""}
                    placeholder="Email"
                    onChange={(e) => setActiveLead({ ...activeLead, email: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Organization</label>
                  <input
                    type="text"
                    value={activeLead.organization || ""}
                    onChange={(e) => setActiveLead({ ...activeLead, organization: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    value={activeLead.designation || ""}
                    onChange={(e) => setActiveLead({ ...activeLead, designation: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Profession</label>
                  <select
                    value={activeLead.profession || "Engineer"}
                    onChange={(e) => setActiveLead({ ...activeLead, profession: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="Engineer">Engineer</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Business">Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Source</label>
                  <input
                    type="text"
                    value={activeLead.leadSource || ""}
                    onChange={(e) => setActiveLead({ ...activeLead, leadSource: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={activeLead.address || ""}
                  onChange={(e) => setActiveLead({ ...activeLead, address: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">CR</label>
                  <select
                    value={activeLead.cr || "Select CR"}
                    onChange={(e) => setActiveLead({ ...activeLead, cr: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="Select CR">Select CR</option>
                    <option value="Tazmul Reza">Tazmul Reza</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">SR</label>
                  <input
                    type="text"
                    value={activeLead.srOfficer}
                    readOnly
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold text-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Project</label>
                <select
                  value={activeLead.interestedProject || "Mustain Villa"}
                  onChange={(e) => setActiveLead({ ...activeLead, interestedProject: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="Mustain Villa">Mustain Villa</option>
                  <option value="Royal City">Royal City</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Remark</label>
                <textarea
                  rows={2}
                  value={activeLead.remark || ""}
                  onChange={(e) => setActiveLead({ ...activeLead, remark: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 outline-none resize-none"
                />
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Tab Navigation & Dynamic Form Panels */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Top Navigation Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === tab.name
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.name}
                  {tab.count !== null && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === tab.name ? "bg-white text-blue-600" : "bg-rose-500 text-white"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* TAB 1: Upcoming/Pending */}
            {activeTab === "Upcoming/Pending" && (
              <div className="space-y-4">
                
                {/* STAGE Box */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 text-xs font-bold">
                  <div className="text-slate-400 uppercase tracking-wider text-[10px]">STAGE</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={activeLead.badge}
                        onChange={(e) => setActiveLead({ ...activeLead, badge: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-blue-600 outline-none"
                      >
                        <option value="New Assignment">New Assignment</option>
                        <option value="Priority">Priority</option>
                        <option value="Prospect">Prospect</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50/50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isJunk}
                        onChange={(e) => setIsJunk(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      Move to junk
                    </label>

                    <button
                      type="button"
                      onClick={handleMarkAsSold}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition active:scale-95"
                    >
                      ✓ Mark as Sold
                    </button>
                  </div>
                </div>

                {/* CURRENT ACTIVITY Box */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex items-center gap-6 text-xs font-bold">
                  <span className="text-blue-600 uppercase tracking-wider text-[11px]">CURRENT ACTIVITY:</span>
                  
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="currentActivity"
                      value="Followup"
                      checked={currentActivity === "Followup"}
                      onChange={() => setCurrentActivity("Followup")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Followup
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400">
                    <input
                      type="radio"
                      name="currentActivity"
                      value="Task/Visit"
                      checked={currentActivity === "Task/Visit"}
                      onChange={() => setCurrentActivity("Task/Visit")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Task/Visit
                  </label>
                </div>

                {/* ADD FOLLOWUP Box */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2 text-xs font-bold">
                  <div className="text-blue-600 uppercase tracking-wider text-[11px]">ADD FOLLOWUP</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Status *</label>
                      <select
                        value={followupStatus}
                        onChange={(e) => setFollowupStatus(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-blue-300 dark:border-blue-800/80 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-semibold outline-none"
                      >
                        <option value="">Select Communication</option>
                        <option value="Call Connected">Call Connected</option>
                        <option value="Follow Up">Follow Up</option>
                        <option value="No Answer">No Answer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Comment *</label>
                      <textarea
                        rows={2}
                        value={followupComment}
                        onChange={(e) => setFollowupComment(e.target.value)}
                        placeholder="Enter comment..."
                        className="w-full p-2.5 rounded-lg border border-blue-300 dark:border-blue-800/80 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-semibold outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Accordion Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition">
                  <span className="font-extrabold text-xs text-slate-700 dark:text-slate-200">Property & Pricing</span>
                  <ChevronDown size={16} className="text-slate-400" />
                </div>

                {/* NEXT ACTIVITY Box */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-6">
                    <span className="text-blue-600 uppercase tracking-wider text-[11px]">NEXT ACTIVITY:</span>
                    
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="nextActivityType"
                        value="Followup"
                        checked={nextActivityType === "Followup"}
                        onChange={() => setNextActivityType("Followup")}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Followup
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400">
                      <input
                        type="radio"
                        name="nextActivityType"
                        value="Task/Visit"
                        checked={nextActivityType === "Task/Visit"}
                        onChange={() => setNextActivityType("Task/Visit")}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Task/Visit
                    </label>
                  </div>

                  <button type="button" className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
                    Stop Followup/Visit
                  </button>
                </div>

                {/* NEXT FOLLOWUP Box */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2 text-xs font-bold">
                  <div className="text-blue-600 uppercase tracking-wider text-[11px]">NEXT FOLLOWUP</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Date</label>
                      <input
                        type="datetime-local"
                        value={nextFollowupDate}
                        onChange={(e) => setNextFollowupDate(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Assigned SR</label>
                      <input
                        type="text"
                        value={activeLead.srOfficer}
                        readOnly
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-bold text-slate-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Note</label>
                      <input
                        type="text"
                        value={nextFollowupNote}
                        onChange={(e) => setNextFollowupNote(e.target.value)}
                        placeholder="Note"
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Save Action Bar */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCallActivityPageOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCallPageChanges}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
                  >
                    Save changes
                  </button>
                </div>

              </div>
            )}

            {/* TAB 2: Requirements */}
            {activeTab === "Requirements" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl space-y-3 text-xs font-bold">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="flex border rounded-lg overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 border-r text-slate-500 font-bold">Price</span>
                      <input
                        type="text"
                        placeholder="Select A Range"
                        value={reqPrice}
                        onChange={(e) => setReqPrice(e.target.value)}
                        className="w-full p-2 outline-none bg-transparent"
                      />
                    </div>

                    <div className="flex border rounded-lg overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 border-r text-slate-500 font-bold">Size</span>
                      <input
                        type="text"
                        placeholder="Size"
                        value={reqSize}
                        onChange={(e) => setReqSize(e.target.value)}
                        className="w-full p-2 outline-none bg-transparent"
                      />
                    </div>

                    <div className="flex border rounded-lg overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 border-r text-slate-500 font-bold">Area</span>
                      <input
                        type="text"
                        placeholder="Select User"
                        value={reqArea}
                        onChange={(e) => setReqArea(e.target.value)}
                        className="w-full p-2 outline-none bg-transparent"
                      />
                    </div>

                    <div className="flex border rounded-lg overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 border-r text-slate-500 font-bold">Type</span>
                      <input
                        type="text"
                        placeholder="Select Type"
                        value={reqType}
                        onChange={(e) => setReqType(e.target.value)}
                        className="w-full p-2 outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex border rounded-lg overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 border-r text-slate-500 font-bold">Description</span>
                    <textarea
                      rows={2}
                      value={reqDesc}
                      onChange={(e) => setReqDesc(e.target.value)}
                      className="w-full p-2 outline-none bg-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-blue-600 text-white font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-3">PRICE</th>
                        <th className="p-3">DESCRIPTION</th>
                        <th className="p-3">SIZE</th>
                        <th className="p-3">AREA</th>
                        <th className="p-3">TYPE</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-bold">
                          No Requirements Logged Yet.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Deal Negotiation */}
            {activeTab === "Deal Negotiation" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-blue-600 text-white font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">PROJECT</th>
                        <th className="p-3">FLAT/LAND/SHARE</th>
                        <th className="p-3">ACTIVITY TYPE</th>
                        <th className="p-3">CLIENT OFFER PRICE</th>
                        <th className="p-3">COUNTER PRICE</th>
                        <th className="p-3">LISTED PRICE</th>
                        <th className="p-3">FINAL PRICE</th>
                        <th className="p-3">STATUS</th>
                        <th className="p-3">ROUND</th>
                        <th className="p-3">CREATED BY</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      <tr>
                        <td colSpan={11} className="p-6 text-center text-slate-400 font-bold">
                          No Deal Negotiation Records Found.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: Property */}
            {activeTab === "Property" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between gap-3 text-xs font-bold">
                  <div className="flex items-center gap-2 flex-1 max-w-xl bg-white dark:bg-slate-900 border rounded-lg overflow-hidden px-3 py-1">
                    <span className="text-slate-400 font-bold">Project</span>
                    <select
                      value={propProject}
                      onChange={(e) => setPropProject(e.target.value)}
                      className="w-full p-1.5 outline-none bg-transparent font-bold"
                    >
                      <option value="">Select Project</option>
                      <option value="Mustain Villa">Mustain Villa</option>
                      <option value="Royal City">Royal City</option>
                    </select>
                  </div>

                  <button className="px-5 py-2 rounded-lg bg-blue-600 text-white font-black text-xs shadow-xs hover:bg-blue-700 transition">
                    See Flat/Land
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-blue-600 text-white font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">PROJECT</th>
                        <th className="p-3">FLAT NO</th>
                        <th className="p-3">SIZE</th>
                        <th className="p-3">BEDROOMS</th>
                        <th className="p-3">BATHROOMS</th>
                        <th className="p-3">FACING</th>
                        <th className="p-3">SALE STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-bold">
                          No Property Listed Yet.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: Follow-up */}
            {activeTab === "Follow-up" && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-blue-600 text-white font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-3">DATE</th>
                      <th className="p-3">FOLLOW-UP DATE</th>
                      <th className="p-3">NOTE</th>
                      <th className="p-3">COMMENT</th>
                      <th className="p-3">ASSIGN USER</th>
                      <th className="p-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    <tr>
                      <td className="p-3 font-mono font-bold">15-10-2026 4:23 PM</td>
                      <td className="p-3 font-mono font-bold">15-10-2026 4:23 PM</td>
                      <td className="p-3 text-slate-400">—</td>
                      <td className="p-3 font-bold">hfjddddd</td>
                      <td className="p-3 font-bold">{activeLead.srOfficer}</td>
                      <td className="p-3 font-bold text-blue-600">Follow Up</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 6: Visits */}
            {activeTab === "Visits" && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-blue-600 text-white font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-3">DATE</th>
                      <th className="p-3">NOTE</th>
                      <th className="p-3">COMMENT</th>
                      <th className="p-3">ASSIGN USER</th>
                      <th className="p-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 font-bold">
                        No Visit Logs Recorded.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 7: Note */}
            {activeTab === "Note" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center gap-3 text-xs font-bold">
                  <span className="bg-white dark:bg-slate-900 px-3 py-2 border rounded-lg font-bold text-slate-500">Note</span>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Enter new note..."
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-semibold"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-blue-600 text-white font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-3 w-16">SL</th>
                        <th className="p-3 w-48">DATE</th>
                        <th className="p-3">NOTE</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-slate-400 font-bold">
                          No Notes Available.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    );
  }

  // MAIN LEAD DIRECTORY VIEW
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

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={handleOpenNewModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> +New Lead
          </button>

          <button
            type="button"
            onClick={() => verifySelection(() => setIsCallAssignOpen(true))}
            className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <PhoneCall size={15} /> Call Assign
          </button>

          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Upload size={15} /> Bulk Import
          </button>

          <button
            type="button"
            onClick={() => verifySelection(() => setIsSmsOpen(true))}
            className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <MessageSquare size={15} /> Send SMS
          </button>

          <button
            type="button"
            onClick={() => verifySelection(() => alert(`${selectedLeads.length} leads converted to customer!`))}
            className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <UserPlus size={15} /> Convert To Customer
          </button>

          <button
            type="button"
            onClick={() => verifySelection(() => setIsTransferOpen(true))}
            className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <ArrowRightLeft size={15} /> Transfer
          </button>

          <button
            type="button"
            onClick={() => verifySelection(() => setIsWishSmsOpen(true))}
            className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Gift size={15} /> Wish SMS
          </button>

          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95 cursor-pointer ${
              isFilterPanelOpen ? "bg-indigo-600 text-white" : "bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white"
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
              <option value="Ongoing">Ongoing</option>
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

      {/* TABLE */}
      <div className="rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-white font-black uppercase text-[11px] tracking-wider bg-indigo-600">
                <th className="p-4 w-12 text-center">SL</th>
                <th className="p-4 w-12 text-center">
                  <button type="button" onClick={handleSelectAll}>
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
                      <button type="button" onClick={() => handleSelectOne(item.id)}>
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
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded bg-cyan-400 text-white hover:bg-cyan-500 transition shadow-xs active:scale-95 cursor-pointer"
                          title="Edit Lead"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenCallActivityPage(item)}
                          className="p-1.5 rounded bg-indigo-500 text-white hover:bg-indigo-600 transition shadow-xs active:scale-95 cursor-pointer"
                          title="Call Activity & Lead Log Page"
                        >
                          <Phone size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(item)}
                          className="p-1.5 rounded bg-rose-500 text-white hover:bg-rose-600 transition shadow-xs active:scale-95 cursor-pointer"
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

      {/* ALL MODALS */}
      {isNewOrEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {activeLead ? "Edit Lead Account" : "Lead Accounts"}
              </h2>
              <button
                type="button"
                onClick={() => setIsNewOrEditModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-5 text-xs font-semibold">
              <div className="p-2.5 bg-blue-100/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-extrabold rounded-lg text-xs">
                Basic Info
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Date</label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Lead Code</label>
                    <input
                      type="text"
                      readOnly
                      value={formData.leadCode}
                      className="w-full p-2 border rounded-lg bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Phone/Mobile <span className="text-rose-500">*</span></label>
                    <div className="flex border rounded-lg overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 border-r text-[11px] font-bold">
                        <span>🇧🇩 (+880)</span>
                        <ChevronDown size={12} />
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Secondary Number</label>
                    <input
                      type="text"
                      placeholder="Secondary Number"
                      value={formData.secondaryNumber}
                      onChange={(e) => setFormData({ ...formData, secondaryNumber: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Assign User/SR</label>
                    <input
                      type="text"
                      value={formData.assignUser}
                      onChange={(e) => setFormData({ ...formData, assignUser: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">If CR</label>
                    <input
                      type="text"
                      value={formData.ifCr}
                      onChange={(e) => setFormData({ ...formData, ifCr: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Lead Stages</label>
                    <input
                      type="text"
                      value={formData.leadStages}
                      onChange={(e) => setFormData({ ...formData, leadStages: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Lead Details Accordion */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsLeadDetailsOpen(!isLeadDetailsOpen)}
                  className="w-full p-3 bg-blue-100/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">Lead Details</span>
                  <div className="p-1 rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-blue-600">
                    <ChevronDown size={14} className={`transition duration-200 ${isLeadDetailsOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isLeadDetailsOpen && (
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in">
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Lead Source</label>
                      <select
                        value={formData.leadSource}
                        onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        <option value="">Select Source</option>
                        <option value="Linkedin">Linkedin</option>
                        <option value="Facebook">Facebook</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Interested Project</label>
                      <select
                        value={formData.interestedProject}
                        onChange={(e) => setFormData({ ...formData, interestedProject: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        <option value="">Select Interested Project</option>
                        <option value="Mustain Villa">Mustain Villa</option>
                        <option value="Royal City">Royal City</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Lead Category</label>
                      <select
                        value={formData.leadCategory}
                        onChange={(e) => setFormData({ ...formData, leadCategory: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        <option value="">Select Category</option>
                        <option value="Ready Flat">Ready Flat</option>
                        <option value="Ongoing">Ongoing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Campaign</label>
                      <select
                        value={formData.campaign}
                        onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        <option value="">Select Lead Source</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Info Accordion */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsPersonalInfoOpen(!isPersonalInfoOpen)}
                  className="w-full p-3 bg-blue-100/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">Personal Info</span>
                  <div className="p-1 rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-blue-600">
                    <ChevronDown size={14} className={`transition duration-200 ${isPersonalInfoOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isPersonalInfoOpen && (
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in">
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Organization</label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Designation</label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Profession</label>
                      <select
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        <option value="">Select Profession</option>
                        <option value="Engineer">Engineer</option>
                        <option value="Doctor">Doctor</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-slate-500 mb-1 font-bold">Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewOrEditModalOpen(false)}
                  className="px-6 py-2 rounded-xl bg-slate-400 text-white font-bold hover:bg-slate-500 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-md transition cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CALL ASSIGN MODAL */}
      {isCallAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Call Assign
              </h3>
              <button type="button" onClick={() => setIsCallAssignOpen(false)} className="text-slate-400 text-lg">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1">Date</label>
                <input
                  type="text"
                  placeholder="mm/dd/yyyy --:-- --"
                  value={callAssignDate}
                  onChange={(e) => setCallAssignDate(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Assign User Type</label>
                <input
                  type="text"
                  value={callAssignUserType}
                  onChange={(e) => setCallAssignUserType(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Note</label>
                <textarea
                  rows={2}
                  placeholder="Write Descriptions"
                  value={callAssignNote}
                  onChange={(e) => setCallAssignNote(e.target.value)}
                  className="w-full p-2 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCallAssignOpen(false)}
                className="px-6 py-2 rounded-xl bg-slate-400 text-white font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Assigned successfully!`);
                  setIsCallAssignOpen(false);
                }}
                className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Bulk Import
              </h3>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Sample Excel file download started.");
                }}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
              >
                ↓ Sample File Download
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1">File</label>
                <input
                  type="file"
                  className="w-full p-1.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Lead Stage</label>
                <select className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <option value="New Assignment">New Assignment</option>
                  <option value="Priority">Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Lead Category</label>
                <select className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <option value="">Select Category</option>
                  <option value="Ready Flat">Ready Flat</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Lead Source</label>
                <select className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <option value="">Select Source</option>
                  <option value="Linkedin">Linkedin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Campaign</label>
                <select className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <option value="">Select Lead Source</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Interested Project</label>
                <select className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <option value="">Select value</option>
                  <option value="Mustain Villa">Mustain Villa</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">User/SR</label>
                <input
                  type="text"
                  defaultValue="Admin"
                  className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">If CR</label>
                <input
                  type="text"
                  defaultValue="Admin"
                  className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[11px]">
              <AlertCircle size={14} />
              <span>Note: If Lead Source or Campaign is not found in the Excel file, the values selected in this form will be used.</span>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkImportOpen(false)}
                className="px-6 py-2 rounded-xl bg-slate-400 text-white font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Bulk Import successful!");
                  setIsBulkImportOpen(false);
                }}
                className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND SMS / WISH SMS MODAL */}
      {(isSmsOpen || isWishSmsOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {isWishSmsOpen ? "Wish SMS Template" : "SMS Template"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsSmsOpen(false);
                  setIsWishSmsOpen(false);
                }}
                className="px-2 py-0.5 text-xs text-slate-600 bg-slate-100 rounded border border-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1">SMS Template</label>
                <select
                  value={smsTemplate}
                  onChange={(e) => setSmsTemplate(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                >
                  <option value="">Select Template</option>
                  <option value="Greeting">Greeting Template</option>
                  <option value="Followup">Followup Template</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">SMS</label>
                <textarea
                  rows={4}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="Write SMS"
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none font-semibold outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsSmsOpen(false);
                  setIsWishSmsOpen(false);
                }}
                className="px-6 py-2 rounded-xl bg-slate-400 text-white font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSmsOpen(false);
                  setIsWishSmsOpen(false);
                  setIsSmsConfirmOpen(true);
                }}
                className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS CONFIRMATION POPUP */}
      {isSmsConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-2xl text-center animate-in fade-in">
            <div className="w-24 h-24 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border-4 border-amber-400/40">
              <AlertCircle size={52} />
            </div>

            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              Are you sure Send SMS?
            </h3>

            <div className="flex justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsSmsConfirmOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("SMS sent successfully!");
                  setIsSmsConfirmOpen(false);
                }}
                className="px-8 py-2.5 rounded-xl bg-rose-500 text-white font-black shadow-md hover:bg-rose-600 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER LEAD MODAL */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Transfer Lead
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Selected Lead:</span>
                <span className="px-4 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 font-bold text-rose-600 text-sm">
                  {selectedLeads.length}
                </span>
                <button type="button" onClick={() => setIsTransferOpen(false)} className="text-slate-400 text-lg ml-2">
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1">Assign User</label>
                <select
                  value={transferUser}
                  onChange={(e) => setTransferUser(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                >
                  <option value="">Select User</option>
                  <option value="Admin">Admin</option>
                  <option value="Mohin">Mohin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Assign Type</label>
                <div className="flex items-center gap-4 pt-1">
                  <input
                    type="text"
                    value={transferType}
                    onChange={(e) => setTransferType(e.target.value)}
                    className="w-full p-2 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                  <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={transferFollowup}
                      onChange={(e) => setTransferFollowup(e.target.checked)}
                      className="rounded"
                    />
                    Followup
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={transferManualSet}
                      onChange={(e) => setTransferManualSet(e.target.checked)}
                      className="rounded"
                    />
                    Manual Set
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-12 bg-indigo-500 text-white font-black text-xs p-2.5 text-center uppercase tracking-wider">
                <div className="col-span-6">USER NAME</div>
                <div className="col-span-3">QUANTITY</div>
                <div className="col-span-3 flex justify-center items-center">
                  <span>ACTION</span>
                  <button type="button" className="ml-2 bg-blue-500 text-white rounded p-0.5"><Plus size={14} /></button>
                </div>
              </div>
            </div>

            <div className="text-center font-bold text-xs text-slate-500 space-y-1">
              <div>Assign Total Transfer</div>
              <div className="w-48 mx-auto p-2 border rounded-xl font-mono text-blue-600 font-extrabold text-lg bg-slate-50 dark:bg-slate-950">
                {selectedLeads.length}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="px-6 py-2 rounded-xl bg-slate-400 text-white font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Transferred ${selectedLeads.length} leads successfully!`);
                  setIsTransferOpen(false);
                }}
                className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-black shadow-md"
              >
                Transfer
              </button>
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
