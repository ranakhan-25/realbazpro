"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Clock, MapPin, User, Mail, Phone, CreditCard,
  Building2, CheckCircle2, FileText, Download, Printer, Edit,
  MoreVertical, Star, MessageSquare, Hash, DollarSign, Copy, Check,
  ChevronRight, Receipt, Wallet, Users, Tag, LandPlot, Layers, X,
} from "lucide-react";

// ============ STATIC DEMO DATA ============
const initialBooking = {
  id: "BK-2024-7845",
  status: "Confirmed",
  createdAt: "2024-01-15",
  property: {
    name: "Gulshan Premium Plot 12",
    category: "Residential Land",
    description:
      "5 katha corner plot in Gulshan-2, ready for construction. Clear title, RAJUK approved, all utilities connected. Excellent investment opportunity in prime diplomatic zone.",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
    rating: 4.9,
    reviews: 234,
    size: "5 katha (3,600 sq ft)",
    facing: "South-East",
    plotNo: "G-12/A",
    registrationStatus: "Ready for Registration",
  },
  schedule: {
    date: "2024-02-20",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    duration: "2 hours",
  },
  location: {
    area: "Gulshan-2, Dhaka",
    address: "Road 12, Plot 12/A, Gulshan-2, Dhaka 1212",
    city: "Dhaka",
    country: "Bangladesh",
    coordinates: "23.7925° N, 90.4078° E",
    nearby: "2 km from Gulshan Circle-2",
  },
  customer: {
    name: "Ayesha Rahman",
    email: "ayesha.rahman@example.com",
    phone: "+880 1712-345678",
    avatar: "https://i.pravatar.cc/150?img=5",
    memberSince: "March 2022",
    totalBookings: 4,
    totalSpent: 32500000,
    loyaltyTier: "Platinum",
    nid: "1990123456789",
  },
  payment: {
    method: "Bank Transfer — City Bank",
    subtotal: 12000000,
    tax: 600000,
    discount: 100000,
    total: 12500000,
    paid: 12500000,
    status: "Paid",
    transactionId: "TXN-CB-9F8E7D6C",
    paidAt: "2024-01-15",
    paymentPlan: "Full Payment",
  },
  items: [
    { name: "Plot Price (5 katha)", qty: 1, price: 11000000 },
    { name: "RAJUK Mutation Fee", qty: 1, price: 400000 },
    { name: "Registration & Stamp Duty", qty: 1, price: 600000 },
    { name: "Legal Verification", qty: 1, price: 0 },
  ],
  notes:
    "Client is a repeat investor. Wants quick mutation process. Prefers morning site visit. Bring original deed documents for verification.",
  assignee: {
    name: "Rashed Karim",
    role: "Senior Property Consultant",
    avatar: "https://i.pravatar.cc/150?img=12",
    email: "rashed.karim@estate.com",
  },
  attachments: [
    { name: "plot-deed.pdf", size: "1.2 MB" },
    { name: "rajuk-approval.pdf", size: "890 KB" },
    { name: "mutation-certificate.pdf", size: "445 KB" },
    { name: "site-map.png", size: "320 KB" },
  ],
};

// ============ COMPONENTS ============

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

function InfoRow({
  icon: Icon, label, value, copyable = false,
}: {
  icon: any; label: string; value: string; copyable?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {value}
          </p>
          {copyable && <CopyButton text={value} />}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode; }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
          <Icon size={18} />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function formatMoney(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(1)} L`;
  return `৳${n.toLocaleString()}`;
}

// ============ MAIN PAGE ============

export default function BookingDetailsPage() {
  const [booking, setBooking] = useState(initialBooking);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    status: booking.status,
    visitDate: booking.schedule.date,
    startTime: booking.schedule.startTime,
    customerName: booking.customer.name,
    customerPhone: booking.customer.phone,
    notes: booking.notes,
  });

  const handleOpenEdit = () => {
    setEditFormData({
      status: booking.status,
      visitDate: booking.schedule.date,
      startTime: booking.schedule.startTime,
      customerName: booking.customer.name,
      customerPhone: booking.customer.phone,
      notes: booking.notes,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setBooking((prev) => ({
      ...prev,
      status: editFormData.status,
      schedule: {
        ...prev.schedule,
        date: editFormData.visitDate,
        startTime: editFormData.startTime,
      },
      customer: {
        ...prev.customer,
        name: editFormData.customerName,
        phone: editFormData.customerPhone,
      },
      notes: editFormData.notes,
    }));
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/sales-management/bookings" className="hover:text-indigo-600 transition-colors">Bookings</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">{booking.id}</span>
      </nav>

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/sales-management/bookings" className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Booking Details</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <CheckCircle2 size={12} />
                {booking.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <Hash size={14} />
              {booking.id}
              <CopyButton text={booking.id} />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
            <Printer size={16} /> Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
            <Download size={16} /> Export
          </button>
          <button 
            onClick={handleOpenEdit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20">
            <Edit size={16} /> Edit
          </button>
          <button className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <DollarSign size={16} />
            <span className="text-xs font-medium">Total Amount</span>
          </div>
          <p className="text-2xl font-bold">{formatMoney(booking.payment.total)}</p>
          <p className="text-xs mt-1 opacity-80 flex items-center gap-1">
            <CheckCircle2 size={12} /> Fully paid
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <Calendar size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Visit Date</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {new Date(booking.schedule.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {booking.schedule.startTime} • {booking.schedule.duration}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <User size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Buyer</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{booking.customer.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {booking.customer.totalBookings} deals • {booking.customer.loyaltyTier}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <CreditCard size={16} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Payment Status</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{booking.payment.status}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatMoney(booking.payment.paid)} received
          </p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Property Details" icon={Building2}>
            <div className="flex flex-col sm:flex-row gap-4">
              <img src={booking.property.image} alt={booking.property.name} className="w-full sm:w-32 h-32 object-cover rounded-xl" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white">{booking.property.name}</h5>
                    <span className="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium">
                      <Tag size={10} /> {booking.property.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg shrink-0">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">{booking.property.rating}</span>
                    <span className="text-gray-500 dark:text-gray-400">({booking.property.reviews})</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{booking.property.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Size</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{booking.property.size}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Facing</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{booking.property.facing}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Plot No</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{booking.property.plotNo}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Status</p>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Ready</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionCard title="Site Visit" icon={Calendar}>
              <div className="space-y-1">
                <InfoRow icon={Calendar} label="Date" value={new Date(booking.schedule.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} />
                <InfoRow icon={Clock} label="Time" value={`${booking.schedule.startTime} - ${booking.schedule.endTime}`} />
                <InfoRow icon={Clock} label="Duration" value={booking.schedule.duration} />
              </div>
            </SectionCard>
            <SectionCard title="Location" icon={MapPin}>
              <div className="space-y-1">
                <InfoRow icon={LandPlot} label="Area" value={booking.location.area} />
                <InfoRow icon={MapPin} label="Address" value={booking.location.address} />
                <InfoRow icon={MapPin} label="City" value={`${booking.location.city}, ${booking.location.country}`} />
                <InfoRow icon={MapPin} label="Landmark" value={booking.location.nearby} />
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Payment Breakdown" icon={Receipt}>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Item</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Qty</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{item.qty}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatMoney(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white font-medium">{formatMoney(booking.payment.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tax (5%)</span>
                <span className="text-gray-900 dark:text-white font-medium">{formatMoney(booking.payment.tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Discount</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">-{formatMoney(booking.payment.discount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-white">Total</span>
                <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatMoney(booking.payment.total)}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Notes" icon={MessageSquare}>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400">{booking.notes}</p>
            </div>
          </SectionCard>
        </div>

        {/* RIGHT - 1/3 */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-indigo-500 to-purple-600" />
            <div className="px-6 pb-6 -mt-10">
              <img src={booking.customer.avatar} alt={booking.customer.name} className="w-20 h-20 rounded-2xl border-4 border-white dark:border-gray-900 object-cover" />
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{booking.customer.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Since {booking.customer.memberSince}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-bold uppercase">{booking.customer.loyaltyTier}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Deals</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{booking.customer.totalBookings}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(booking.customer.totalSpent)}</p>
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <InfoRow icon={Mail} label="Email" value={booking.customer.email} copyable />
                <InfoRow icon={Phone} label="Phone" value={booking.customer.phone} copyable />
                <InfoRow icon={FileText} label="NID" value={booking.customer.nid} copyable />
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors mt-4">
                <MessageSquare size={14} /> Send Message
              </button>
            </div>
          </div>

          <SectionCard title="Payment" icon={Wallet}>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{booking.payment.status}</span>
                </div>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(booking.payment.paid)}</span>
              </div>
              <InfoRow icon={CreditCard} label="Method" value={booking.payment.method} />
              <InfoRow icon={Layers} label="Plan" value={booking.payment.paymentPlan} />
              <InfoRow icon={Hash} label="Transaction" value={booking.payment.transactionId} copyable />
              <InfoRow icon={Calendar} label="Paid On" value={booking.payment.paidAt} />
            </div>
          </SectionCard>

          <SectionCard title="Assigned Agent" icon={Users}>
            <div className="flex items-center gap-3">
              <img src={booking.assignee.avatar} alt={booking.assignee.name} className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{booking.assignee.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{booking.assignee.role}</p>
              </div>
            </div>
            <div className="mt-3">
              <InfoRow icon={Mail} label="Email" value={booking.assignee.email} copyable />
            </div>
          </SectionCard>

          <SectionCard title="Documents" icon={FileText}>
            <div className="space-y-2">
              {booking.attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{file.size}</p>
                  </div>
                  <Download size={16} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Booking</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Booking Status</label>
                <select 
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Visit Date</label>
                  <input 
                    type="date"
                    value={editFormData.visitDate}
                    onChange={(e) => setEditFormData({ ...editFormData, visitDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Start Time</label>
                  <input 
                    type="text"
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    placeholder="e.g. 10:00 AM"
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Customer Name</label>
                <input 
                  type="text"
                  value={editFormData.customerName}
                  onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Customer Phone</label>
                <input 
                  type="text"
                  value={editFormData.customerPhone}
                  onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Notes</label>
                <textarea 
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}