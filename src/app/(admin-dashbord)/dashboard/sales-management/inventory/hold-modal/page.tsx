"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import fileUploadService from "@/services/fileUploadService";
import {
  X,
  LandPlot,
  Building2,
  Search,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  Hash,
  Save,
  ChevronRight,
  Info,
  MapPin,
  Ruler,
  FileText,
  Home,
} from "lucide-react";

// ============ STATIC DATA ============
const fallbackProperties = [
  {
    id: "PRP-1001",
    name: "Gulshan Plot 12/A",
    code: "GUL-PLT-012",
    type: "Residential Land",
    area: "5 katha",
    price: 12000000,
    status: "Available",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
    location: "Gulshan-2, Dhaka",
  },
  {
    id: "PRP-1002",
    name: "Bashundhara Apartment 7B",
    code: "BSH-APT-007",
    type: "Apartment",
    area: "1,850 sq ft",
    price: 6500000,
    status: "Available",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=200&fit=crop",
    location: "Bashundhara R/A, Dhaka",
  },
  {
    id: "PRP-1003",
    name: "Dhanmondi Commercial Space",
    code: "DHN-COM-003",
    type: "Commercial",
    area: "2,400 sq ft",
    price: 9500000,
    status: "Available",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop",
    location: "Dhanmondi, Dhaka",
  },
  {
    id: "PRP-1004",
    name: "Uttara Villa 4C",
    code: "UTT-VIL-004",
    type: "Villa",
    area: "4,200 sq ft",
    price: 15000000,
    status: "Available",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=200&fit=crop",
    location: "Sector 4, Uttara",
  },
  {
    id: "PRP-1005",
    name: "Mirpur Plot 22",
    code: "MRP-PLT-022",
    type: "Residential Land",
    area: "3 katha",
    price: 7200000,
    status: "Available",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop",
    location: "Mirpur DOHS, Dhaka",
  },
];

const holdReasons = [
  "Buyer Reserved",
  "Pending Payment",
  "Site Visit Scheduled",
  "Legal Verification",
  "Token Money Received",
  "Under Negotiation",
  "Other",
];

const branches = [
  "Gulshan Head Office",
  "Dhanmondi Branch",
  "Uttara Branch",
  "Chattogram Branch",
];

// ============ COMPONENTS ============

function FieldLabel({
  label,
  required = false,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
    >
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inputBase =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all";

function formatMoney(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(1)} L`;
  return `৳${n.toLocaleString()}`;
}

// ============ MAIN PAGE ============

export default function HoldPropertyPage() {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [properties, setProperties] = useState(fallbackProperties);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    holdUntil: "",
    reason: "",
    branch: branches[0],
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    tokenAmount: 0,
    reference: "",
    notes: "",
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/flat-land", { params: { page: 1, limit: 100 } })
      .then((response) => {
        const payload = response.data?.data ?? response.data;
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.items)
              ? payload.items
              : [];
        const mapped = rows.map((row: Record<string, unknown>) => {
          const project =
            row.project && typeof row.project === "object"
              ? (row.project as Record<string, unknown>)
              : {};
          const rawImage =
            row.imageUrl ??
            row.image ??
            row.thumbnail ??
            (Array.isArray(row.images) ? row.images[0] : "");
          return {
            id: String(row.uuid ?? row.id ?? ""),
            name: String(row.flatLandNo ?? row.name ?? row.title ?? "Property"),
            code: String(row.code ?? row.flatLandNo ?? row.id ?? ""),
            type: String(
              row.propertyType ?? row.type ?? project.type ?? "Property",
            ),
            area: String(row.area ?? row.size ?? row.measurement ?? ""),
            price: Number(row.rate ?? row.price ?? row.totalPrice ?? 0) || 0,
            status: String(row.status ?? "Available"),
            image: fileUploadService.getContentUrl(String(rawImage ?? "")),
            location: String(
              row.address ?? row.location ?? project.location ?? "",
            ),
          };
        });
        if (!cancelled && mapped.length > 0) setProperties(mapped);
      })
      .catch((cause) => {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load properties.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = properties.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()),
  );

  const activeItem = properties.find((i) => i.id === selectedItem);

  const handleOpenModal = (id: string) => {
    setSelectedItem(id);
    setShowModal(true);
    setForm({
      holdUntil: "",
      reason: "",
      branch: branches[0],
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      tokenAmount: 0,
      reference: "",
      notes: "",
    });
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/hold-properties", {
        propertyId: activeItem.id,
        propertyName: activeItem.name,
        propertyPrice: activeItem.price,
        holdUntil: form.holdUntil,
        reason: form.reason,
        branch: form.branch,
        buyerName: form.buyerName,
        buyerEmail: form.buyerEmail,
        buyerPhone: form.buyerPhone,
        tokenAmount: form.tokenAmount,
        reference: form.reference,
        notes: form.notes,
      });
      setSubmitted(true);
      window.setTimeout(() => {
        setSubmitted(false);
        handleClose();
      }, 2000);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not place property on hold.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400 flex-wrap">
        <Link
          href="/dashboard"
          className="hover:text-indigo-600 transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <Link
          href="/dashboard/sales-management/inventory"
          className="hover:text-indigo-600 transition-colors"
        >
          Properties
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">
          Hold Property
        </span>
      </nav>

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Put Property on Hold
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Reserve a property for a buyer so it's not shown to others.
        </p>
      </div>

      {/* SUCCESS TOAST */}
      {submitted && (
        <div className="fixed top-6 right-6 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Property placed on hold!</span>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by property name, code, or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputBase + " pl-11"}
          />
        </div>
      </div>

      {/* PROPERTY LIST */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LandPlot size={18} className="text-indigo-600" />
            Available Properties ({filtered.length})
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Click "Hold" to reserve a property
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <Building2
                size={40}
                className="mx-auto text-gray-300 dark:text-gray-700 mb-2"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No properties found
              </p>
            </div>
          )}

          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span>{item.id}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="flex items-center gap-1">
                    <MapPin size={10} /> {item.location}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{item.area}</span>
                </p>
              </div>
              <div className="hidden sm:block text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatMoney(item.price)}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {item.type}
                </p>
              </div>
              <button
                onClick={() => handleOpenModal(item.id)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
              >
                <Clock size={14} />
                Hold
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {showModal && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Hold Property
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Set hold details
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* PROPERTY PREVIEW */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <img
                    src={activeItem.image}
                    alt={activeItem.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {activeItem.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activeItem.id} • {formatMoney(activeItem.price)}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium shrink-0">
                    {activeItem.status}
                  </span>
                </div>

                {/* HOLD UNTIL & REASON */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel
                      label="Hold Until"
                      required
                      htmlFor="hold-until"
                    />
                    <input
                      id="hold-until"
                      type="date"
                      value={form.holdUntil}
                      onChange={(e) =>
                        setForm({ ...form, holdUntil: e.target.value })
                      }
                      className={inputBase}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel label="Reason" required htmlFor="hold-reason" />
                    <select
                      id="hold-reason"
                      value={form.reason}
                      onChange={(e) =>
                        setForm({ ...form, reason: e.target.value })
                      }
                      className={inputBase}
                      required
                    >
                      <option value="">Select…</option>
                      {holdReasons.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel label="Branch / Office" htmlFor="hold-branch" />
                  <select
                    id="hold-branch"
                    value={form.branch}
                    onChange={(e) =>
                      setForm({ ...form, branch: e.target.value })
                    }
                    className={inputBase}
                  >
                    {branches.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* BUYER INFO */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <User size={12} />
                    Buyer Info (Optional)
                  </p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Buyer name"
                        value={form.buyerName}
                        onChange={(e) =>
                          setForm({ ...form, buyerName: e.target.value })
                        }
                        className={inputBase}
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={form.buyerPhone}
                        onChange={(e) =>
                          setForm({ ...form, buyerPhone: e.target.value })
                        }
                        className={inputBase}
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={form.buyerEmail}
                      onChange={(e) =>
                        setForm({ ...form, buyerEmail: e.target.value })
                      }
                      className={inputBase}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="Token Amount (৳)" htmlFor="hold-token" />
                    <input
                      id="hold-token"
                      type="number"
                      min={0}
                      placeholder="e.g. 500000"
                      value={form.tokenAmount || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tokenAmount: Number(e.target.value) || 0,
                        })
                      }
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Reference ID" htmlFor="hold-ref" />
                    <input
                      id="hold-ref"
                      type="text"
                      placeholder="e.g. BK-7845"
                      value={form.reference}
                      onChange={(e) =>
                        setForm({ ...form, reference: e.target.value })
                      }
                      className={inputBase}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel label="Notes" htmlFor="hold-notes" />
                  <textarea
                    id="hold-notes"
                    rows={3}
                    placeholder="Additional notes about this hold…"
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    className={inputBase + " resize-none"}
                  />
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <Info
                    size={16}
                    className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Held properties are reserved and won't appear as available
                    until the hold is released or expires.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
                >
                  <Save size={16} />
                  {saving ? "Saving…" : "Confirm Hold"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
