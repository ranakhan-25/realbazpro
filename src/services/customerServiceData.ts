/**
 * Mock data store & domain models for RealBiz Pro Customer Service & Post-Sales
 * Tailored for Bangladesh Real Estate operations (Sell.Do / PropSmartz architecture)
 */

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  nid: string;
  tin?: string;
  address: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeNid: string;
  totalBookings: number;
  totalPaidAmount: number;
  totalDueAmount: number;
  status: "active" | "vip" | "disputed" | "closed";
  joinedDate: string;
}

export interface PropertyBooking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  project: string;
  unitType: "Apartment" | "Commercial Flat" | "Plot" | "Parking";
  unitNumber: string;
  floor: string;
  sizeSqFt: number;
  totalPrice: number;
  bookingMoney: number;
  paidAmount: number;
  dueAmount: number;
  nextInstallmentDate: string;
  handoverStatus:
    "Under Construction" | "Ready for Snagging" | "Handed Over" | "DLP Active";
  bookingDate: string;
}

export interface ChangeRequest {
  id: string;
  requestType:
    "Ownership Transfer" | "Resale" | "Cancellation & Refund" | "Unit Swap";
  customerId: string;
  customerName: string;
  unit: string;
  project: string;
  reason: string;
  transferFee: number;
  newBuyerName?: string;
  newBuyerNid?: string;
  status:
    | "Draft"
    | "Legal Verification"
    | "HOD Approval"
    | "Accounts Clearance"
    | "Completed"
    | "Rejected";
  appliedDate: string;
}

export interface PaymentScheduleItem {
  id: string;
  bookingId: string;
  customerName: string;
  unit: string;
  milestoneTitle: string;
  dueDate: string;
  amount: number;
  status: "Paid" | "Upcoming" | "Overdue";
  demandLetterIssued: boolean;
  demandLetterDate?: string;
}

export interface CollectionReceipt {
  id: string;
  moneyReceiptNo: string;
  customerName: string;
  unit: string;
  project: string;
  amount: number;
  paymentMethod: "Bank Deposit" | "Cheque" | "bKash" | "Nagad" | "Pay Order";
  bankName?: string;
  chequeOrTxnId: string;
  receiptDate: string;
  makerStatus: "Verified by Post-Sales";
  checkerStatus: "Posted to Accounts Ledger" | "Pending Accounts Clearance";
}

export interface AgeingDueItem {
  id: string;
  customerName: string;
  phone: string;
  unit: string;
  project: string;
  totalDue: number;
  bucket30Days: number;
  bucket60Days: number;
  bucket90PlusDays: number;
  lateFeeApplied: number;
  waiverRequested: boolean;
  lastReminderSent: string;
  riskLevel: "Low" | "Medium" | "High" | "Legal Notice Stage";
}

export interface RefundRequestItem {
  id: string;
  customerName: string;
  unit: string;
  project: string;
  totalPaid: number;
  deductionPercentage: number;
  deductionAmount: number;
  netRefundAmount: number;
  reason: string;
  approvalStage:
    | "Customer Service"
    | "Management Approval"
    | "Accounts Cheque Preparation"
    | "Disbursed";
  requestedDate: string;
}

export interface RegistrationRecord {
  id: string;
  customerName: string;
  unit: string;
  project: string;
  subRegistrarOffice: string;
  deedDraftStatus: "Vetting Complete" | "Draft Ready" | "Pending Stamp Paper";
  registrationDateScheduled?: string;
  totalGovtFees: number;
  feeReceiptCollected: boolean;
  registeredDeedNo?: string;
  status:
    | "Documents Gathering"
    | "Appointment Booked"
    | "Deed Registered"
    | "Original Deed Delivered";
}

export interface MutationRecord {
  id: string;
  customerName: string;
  unit: string;
  project: string;
  mutationAppNo: string;
  acLandOffice: string;
  currentStage:
    | "Application Submitted"
    | "Kanungo/Surveyor Inquiry"
    | "Hearing Scheduled"
    | "DCR Paid"
    | "Khatian Approved";
  hearingDate?: string;
  dcrNumber?: string;
  dcrFeeAmount: number;
  dcrPaid: boolean;
  khatianNumber?: string;
  lastUpdated: string;
}

export interface HandoverItem {
  id: string;
  customerName: string;
  unit: string;
  project: string;
  targetHandoverDate: string;
  readinessPercentage: number;
  jointInspectionDone: boolean;
  snagsIdentified: number;
  snagsResolved: number;
  keyRegisterNo?: string;
  possessionCertIssued: boolean;
  handoverStatus:
    | "Scheduled"
    | "Snag Rectification"
    | "Ready for Key Delivery"
    | "Possession Taken";
}

export interface ServiceTicket {
  id: string;
  ticketNo: string;
  subject: string;
  customerName: string;
  phone: string;
  unit: string;
  project: string;
  category:
    | "Civil Work"
    | "Sanitary & Plumbing"
    | "Electrical"
    | "Finishing & Tiles"
    | "Accounts & Billing"
    | "Handover Delay";
  priority: "Low" | "Medium" | "High" | "Urgent";
  status:
    | "Open"
    | "In Progress"
    | "Pending Customer"
    | "Escalated"
    | "Resolved"
    | "Closed"
    | "Reopened";
  assignedAgent: string;
  slaRemainingHours: number;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyDlpClaim {
  id: string;
  claimNo: string;
  customerName: string;
  unit: string;
  project: string;
  possessionDate: string;
  dlpExpiryDate: string;
  defectCategory:
    | "Wall Cracks"
    | "Water Seepage"
    | "Drainage Backflow"
    | "Electrical Sub-Line"
    | "Window Sealant";
  severity: "Major" | "Minor" | "Critical Structural";
  assignedEngineer: string;
  status:
    | "Claim Logged"
    | "Site Inspected"
    | "Rectification in Progress"
    | "Resolved & Signed Off";
}

// -------------------------------------------------------------
// SEED DATA STORE
// -------------------------------------------------------------

export const MOCK_CUSTOMERS: CustomerProfile[] = [
  {
    id: "CUST-001",
    name: "Mohammad Rafiqul Islam",
    phone: "+880 1711-234567",
    email: "rafiq.islam@gmail.com",
    nid: "19842691234567890",
    tin: "5421980312",
    address: "House 42, Road 11, Banani, Dhaka-1213",
    nomineeName: "Farzana Yasmin",
    nomineeRelation: "Spouse",
    nomineeNid: "19882699876543210",
    totalBookings: 2,
    totalPaidAmount: 18500000,
    totalDueAmount: 3500000,
    status: "vip",
    joinedDate: "2023-04-12",
  },
  {
    id: "CUST-002",
    name: "Dr. Nazmul Huda",
    phone: "+880 1819-876543",
    email: "dr.nazmul@squarehospital.com",
    nid: "19782694561237890",
    tin: "8912457812",
    address: "Flat 5A, Concord Heights, Dhanmondi 27, Dhaka",
    nomineeName: "Tasnim Huda",
    nomineeRelation: "Daughter",
    nomineeNid: "20042691122334455",
    totalBookings: 1,
    totalPaidAmount: 9200000,
    totalDueAmount: 0,
    status: "active",
    joinedDate: "2024-01-18",
  },
  {
    id: "CUST-003",
    name: "Barrister Shahed Chowdhury",
    phone: "+880 1914-556677",
    email: "shahed@chowdhurychambers.com",
    nid: "19822697894561230",
    address: "Block G, Bashundhara R/A, Dhaka",
    nomineeName: "Shamima Chowdhury",
    nomineeRelation: "Mother",
    nomineeNid: "19602690011223344",
    totalBookings: 1,
    totalPaidAmount: 6400000,
    totalDueAmount: 2600000,
    status: "active",
    joinedDate: "2024-06-05",
  },
  {
    id: "CUST-004",
    name: "Engr. Tanvir Ahmed",
    phone: "+880 1722-998877",
    email: "tanvir.buet@yahoo.com",
    nid: "19902693344556677",
    address: "Sector 4, Uttara, Dhaka",
    nomineeName: "Sabrina Ahmed",
    nomineeRelation: "Spouse",
    nomineeNid: "19942698877665544",
    totalBookings: 1,
    totalPaidAmount: 4500000,
    totalDueAmount: 7500000,
    status: "disputed",
    joinedDate: "2023-11-20",
  },
];

export const MOCK_BOOKINGS: PropertyBooking[] = [
  {
    id: "BK-1082",
    customerId: "CUST-001",
    customerName: "Mohammad Rafiqul Islam",
    customerPhone: "+880 1711-234567",
    project: "Hena Heights, Gulshan-2",
    unitType: "Apartment",
    unitNumber: "A-7 (7th Floor)",
    floor: "7th",
    sizeSqFt: 2450,
    totalPrice: 22000000,
    bookingMoney: 2000000,
    paidAmount: 18500000,
    dueAmount: 3500000,
    nextInstallmentDate: "2026-11-25",
    handoverStatus: "DLP Active",
    bookingDate: "2023-04-12",
  },
  {
    id: "BK-1140",
    customerId: "CUST-002",
    customerName: "Dr. Nazmul Huda",
    customerPhone: "+880 1819-876543",
    project: "Eastern Lakeview, Dhanmondi",
    unitType: "Apartment",
    unitNumber: "B-4 (4th Floor)",
    floor: "4th",
    sizeSqFt: 1850,
    totalPrice: 9200000,
    bookingMoney: 1000000,
    paidAmount: 9200000,
    dueAmount: 0,
    nextInstallmentDate: "Full Paid",
    handoverStatus: "Handed Over",
    bookingDate: "2024-01-18",
  },
  {
    id: "BK-1205",
    customerId: "CUST-003",
    customerName: "Barrister Shahed Chowdhury",
    customerPhone: "+880 1914-556677",
    project: "Sheba Green Valley, Bashundhara",
    unitType: "Apartment",
    unitNumber: "C-9 (9th Floor)",
    floor: "9th",
    sizeSqFt: 2100,
    totalPrice: 9000000,
    bookingMoney: 1000000,
    paidAmount: 6400000,
    dueAmount: 2600000,
    nextInstallmentDate: "2026-12-01",
    handoverStatus: "Ready for Snagging",
    bookingDate: "2024-06-05",
  },
];

export const MOCK_TICKETS: ServiceTicket[] = [
  {
    id: "TKT-301",
    ticketNo: "TKT-2026-0301",
    subject: "Water seepage on master bedroom ceiling during heavy rainfall",
    customerName: "Mohammad Rafiqul Islam",
    phone: "+880 1711-234567",
    unit: "A-7 (Hena Heights)",
    project: "Hena Heights, Gulshan-2",
    category: "Civil Work",
    priority: "Urgent",
    status: "Open",
    assignedAgent: "Md. Tariqul Hasan (Site Engr)",
    slaRemainingHours: 4,
    isOverdue: false,
    createdAt: "2026-11-04 07:15 AM",
    updatedAt: "2026-11-04 08:00 AM",
  },
  {
    id: "TKT-302",
    ticketNo: "TKT-2026-0302",
    subject:
      "Pre-possession snagging list rectification pending in dining tiles",
    customerName: "Barrister Shahed Chowdhury",
    phone: "+880 1914-556677",
    unit: "C-9 (Sheba Green)",
    project: "Sheba Green Valley",
    category: "Finishing & Tiles",
    priority: "High",
    status: "In Progress",
    assignedAgent: "Kazi Farhad (QA Supervisor)",
    slaRemainingHours: 12,
    isOverdue: false,
    createdAt: "2026-11-03 02:40 PM",
    updatedAt: "2026-11-04 06:30 AM",
  },
  {
    id: "TKT-303",
    ticketNo: "TKT-2026-0303",
    subject: "Delayed updated statement of accounts after online bank payment",
    customerName: "Dr. Nazmul Huda",
    phone: "+880 1819-876543",
    unit: "B-4 (Eastern Lakeview)",
    project: "Eastern Lakeview",
    category: "Accounts & Billing",
    priority: "Medium",
    status: "Resolved",
    assignedAgent: "Nusrat Jahan (Post-Sales Officer)",
    slaRemainingHours: 0,
    isOverdue: false,
    createdAt: "2026-11-02 11:20 AM",
    updatedAt: "2026-11-03 04:10 PM",
  },
  {
    id: "TKT-304",
    ticketNo: "TKT-2026-0304",
    subject: "Sub-station earthing fluctuation causing UPS tripping",
    customerName: "Engr. Tanvir Ahmed",
    phone: "+880 1722-998877",
    unit: "D-2 (Uttara Green)",
    project: "Uttara Green Park",
    category: "Electrical",
    priority: "Urgent",
    status: "Escalated",
    assignedAgent: "Engr. Mahmudul Karim (MEP Head)",
    slaRemainingHours: -6,
    isOverdue: true,
    createdAt: "2026-11-01 09:00 AM",
    updatedAt: "2026-11-04 07:45 AM",
  },
];
