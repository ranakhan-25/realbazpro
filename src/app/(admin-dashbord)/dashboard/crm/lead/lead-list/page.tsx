"use client";

import React, { useState, useRef, useEffect } from "react";
import LeadHeader from "./components/LeadHeader";
import LeadTable from "./components/LeadTable";
import CallActivityView from "./components/CallActivityView";
import NewEditModal from "./modals/NewEditModal";
import CallAssignModal from "./modals/CallAssignModal";
import BulkImportModal from "./modals/BulkImportModal";
import SmsModals from "./modals/SmsModals";
import TransferModal from "./modals/TransferModal";
import AlertDeleteModals from "./modals/AlertDeleteModals";

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

  // ট্রান্সফার কনফার্ম করার ফাংশন (যাতে Transfer History পেজে ডেটা যায়)
  const handleConfirmTransfer = () => {
    const assignedTo = transferUser || "Admin";

    const leadsToTransfer = leads.filter((item) => selectedLeads.includes(item.id));

    const newTransferRecords = leadsToTransfer.map((lead, index) => ({
      id: `${Date.now()}-${index}`,
      leadCode: lead.leadId,
      name: lead.name,
      mobile: lead.phone,
      from: lead.srOfficer || "Admin",
      to: assignedTo,
      date: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
      lastActivity: lead.lastActivity || "",
    }));

    if (typeof window !== "undefined") {
      const existingHistory = localStorage.getItem("transfer_history_data");
      let parsedHistory = [];
      try {
        parsedHistory = existingHistory ? JSON.parse(existingHistory) : [];
      } catch (e) {
        parsedHistory = [];
      }

      const updatedHistory = [...newTransferRecords, ...parsedHistory];
      localStorage.setItem("transfer_history_data", JSON.stringify(updatedHistory));
    }

    alert(`Successfully transferred ${selectedLeads.length} leads to ${assignedTo}!`);
    setIsTransferOpen(false);
    setSelectedLeads([]);
    setTransferUser("");
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
      <CallActivityView
        activeLead={activeLead}
        setActiveLead={setActiveLead}
        setIsCallActivityPageOpen={setIsCallActivityPageOpen}
        handleSaveCallPageChanges={handleSaveCallPageChanges}
        isJunk={isJunk}
        setIsJunk={setIsJunk}
        fileInputRef={fileInputRef}
        attachmentInputRef={attachmentInputRef}
        handleImageUpload={handleImageUpload}
        handleAttachmentUpload={handleAttachmentUpload}
        setIsSmsOpen={setIsSmsOpen}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleMarkAsSold={handleMarkAsSold}
        currentActivity={currentActivity}
        setCurrentActivity={setCurrentActivity}
        followupStatus={followupStatus}
        setFollowupStatus={setFollowupStatus}
        followupComment={followupComment}
        setFollowupComment={setFollowupComment}
        nextActivityType={nextActivityType}
        setNextActivityType={setNextActivityType}
        nextFollowupDate={nextFollowupDate}
        setNextFollowupDate={setNextFollowupDate}
        nextFollowupNote={nextFollowupNote}
        setNextFollowupNote={setNextFollowupNote}
        reqPrice={reqPrice}
        setReqPrice={setReqPrice}
        reqSize={reqSize}
        setReqSize={setReqSize}
        reqArea={reqArea}
        setReqArea={setReqArea}
        reqType={reqType}
        setReqType={setReqType}
        reqDesc={reqDesc}
        setReqDesc={setReqDesc}
        propProject={propProject}
        setPropProject={setPropProject}
        noteInput={noteInput}
        setNoteInput={setNoteInput}
      />
    );
  }

  return (
    <div className="w-full space-y-6 px-4 md:px-8 py-6 text-foreground bg-slate-50/50 dark:bg-background min-h-screen">
      <LeadHeader
        selectedCount={selectedLeads.length}
        onOpenNewModal={handleOpenNewModal}
        onCallAssign={() => verifySelection(() => setIsCallAssignOpen(true))}
        onBulkImport={() => setIsBulkImportOpen(true)}
        onSendSms={() => verifySelection(() => setIsSmsOpen(true))}
        onConvertCustomer={() => verifySelection(() => alert(`${selectedLeads.length} leads converted to customer!`))}
        onTransfer={() => verifySelection(() => setIsTransferOpen(true))}
        onWishSms={() => verifySelection(() => setIsWishSmsOpen(true))}
        isFilterPanelOpen={isFilterPanelOpen}
        setIsFilterPanelOpen={setIsFilterPanelOpen}
      />

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

      <LeadTable
        currentTableData={currentTableData}
        selectedLeads={selectedLeads}
        handleSelectAll={handleSelectAll}
        handleSelectOne={handleSelectOne}
        handleOpenEditModal={handleOpenEditModal}
        handleOpenCallActivityPage={handleOpenCallActivityPage}
        handleOpenDeleteModal={handleOpenDeleteModal}
        entriesPerPage={entriesPerPage}
        setEntriesPerPage={setEntriesPerPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        indexOfFirstItem={indexOfFirstItem}
        indexOfLastItem={indexOfLastItem}
        handlePageChange={handlePageChange}
      />

      <NewEditModal
        isOpen={isNewOrEditModalOpen}
        onClose={() => setIsNewOrEditModalOpen(false)}
        onSubmit={handleFormSubmit}
        formData={formData}
        setFormData={setFormData}
        activeLead={activeLead}
        isLeadDetailsOpen={isLeadDetailsOpen}
        setIsLeadDetailsOpen={setIsLeadDetailsOpen}
        isPersonalInfoOpen={isPersonalInfoOpen}
        setIsPersonalInfoOpen={setIsPersonalInfoOpen}
      />

      <CallAssignModal
        isOpen={isCallAssignOpen}
        onClose={() => setIsCallAssignOpen(false)}
        callAssignDate={callAssignDate}
        setCallAssignDate={setCallAssignDate}
        callAssignUserType={callAssignUserType}
        setCallAssignUserType={setCallAssignUserType}
        callAssignNote={callAssignNote}
        setCallAssignNote={setCallAssignNote}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      <SmsModals
        isSmsOpen={isSmsOpen}
        isWishSmsOpen={isWishSmsOpen}
        onCloseSms={() => {
          setIsSmsOpen(false);
          setIsWishSmsOpen(false);
        }}
        smsTemplate={smsTemplate}
        setSmsTemplate={setSmsTemplate}
        smsText={smsText}
        setSmsText={setSmsText}
        onSubmitSms={() => {
          setIsSmsOpen(false);
          setIsWishSmsOpen(false);
          setIsSmsConfirmOpen(true);
        }}
        isSmsConfirmOpen={isSmsConfirmOpen}
        onCloseConfirm={() => setIsSmsConfirmOpen(false)}
        onConfirmOk={() => {
          alert("SMS sent successfully!");
          setIsSmsConfirmOpen(false);
        }}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        selectedCount={selectedLeads.length}
        transferUser={transferUser}
        setTransferUser={setTransferUser}
        transferType={transferType}
        setTransferType={setTransferType}
        transferFollowup={transferFollowup}
        setTransferFollowup={setTransferFollowup}
        transferManualSet={transferManualSet}
        setTransferManualSet={setTransferManualSet}
        onConfirmTransfer={handleConfirmTransfer}
      />

      <AlertDeleteModals
        isAlertOpen={isAlertOpen}
        onCloseAlert={() => setIsAlertOpen(false)}
        isDeleteModalOpen={isDeleteModalOpen}
        onCloseDelete={() => setIsDeleteModalOpen(false)}
        activeLead={activeLead}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}