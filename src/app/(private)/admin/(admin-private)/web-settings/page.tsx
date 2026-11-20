/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Palette,
  Globe,
  Wrench,
  Save,
  CheckCircle2,
  Building2,
  Layers,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { tenantCmsService, TenantSite } from "@/services/tenantCmsService";
import { getOrganizations, Organization } from "@/services/organizationService";
import { getStoredUserProfile } from "@/lib/admin-auth/adminAuthStorage";

const TABS = [
  { id: "general", label: "General & Identity", icon: Settings },
  { id: "branding", label: "Theme & Palette", icon: Palette },
  { id: "seo", label: "SEO & Social", icon: Globe },
  { id: "pages", label: "Content Sections", icon: Layers },
  { id: "maintenance", label: "Publishing Status", icon: Wrench },
];

const PRESET_PALETTES = [
  { name: "Hermes Cobalt", primary: "#0000F2", secondary: "#3B82F6", accent: "#00D2FF" },
  { name: "Emerald Growth", primary: "#10b981", secondary: "#059669", accent: "#34d399" },
  { name: "Apex Violet", primary: "#8b5cf6", secondary: "#6d28d9", accent: "#c084fc" },
  { name: "Corporate Slate", primary: "#2563eb", secondary: "#1d4ed8", accent: "#60a5fa" },
  { name: "Crimson Forge", primary: "#dc2626", secondary: "#b91c1c", accent: "#f87171" },
];

export default function WebSettingsPage() {
  const profile = typeof window !== "undefined" ? getStoredUserProfile() : null;
  const isSuperAdmin = Boolean(profile?.isSuperUser || (profile?.roles && profile.roles.includes("super_admin")));

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Super Admin tenant switcher
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>(undefined);

  // Tenant site state
  const [siteData, setSiteData] = useState<TenantSite | null>(null);

  // Form states
  const [siteTitle, setSiteTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  // Theme Config
  const [primaryColor, setPrimaryColor] = useState("#0000F2");
  const [secondaryColor, setSecondaryColor] = useState("#3B82F6");
  const [accentColor, setAccentColor] = useState("#00D2FF");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [darkMode, setDarkMode] = useState(false);
  const [borderRadius, setBorderRadius] = useState("8px");

  // SEO Config
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [ogImage, setOgImage] = useState("");

  // Status
  const [isPublished, setIsPublished] = useState(true);

  // Load organizations if super admin, or lock to orgId if org admin
  useEffect(() => {
    if (isSuperAdmin) {
      getOrganizations()
        .then((data: Organization[]) => {
          setOrgs(data);
          if (data.length > 0 && selectedOrgId === undefined) {
            setSelectedOrgId(data[0].id);
          }
        })
        .catch(() => {});
    } else if (profile?.orgId) {
      setSelectedOrgId(Number(profile.orgId));
    }
  }, [isSuperAdmin, profile?.orgId]);

  // Load Site Data
  const loadSite = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const site = await tenantCmsService.getSite(selectedOrgId);
      setSiteData(site);
      setSiteTitle(site.siteTitle || "");
      setTagline(site.tagline || "");
      setSubdomain(site.subdomain || "");
      setCustomDomain(site.customDomain || "");
      setLogoUrl(site.logoUrl || "");
      setFaviconUrl(site.faviconUrl || "");

      if (site.themeConfig) {
        setPrimaryColor(site.themeConfig.primaryColor || "#0000F2");
        setSecondaryColor(site.themeConfig.secondaryColor || "#3B82F6");
        setAccentColor(site.themeConfig.accentColor || "#00D2FF");
        setFontFamily(site.themeConfig.fontFamily || "Inter");
        setDarkMode(Boolean(site.themeConfig.darkMode));
        setBorderRadius(site.themeConfig.borderRadius || "8px");
      }

      if (site.seoConfig) {
        setMetaTitle(site.seoConfig.metaTitle || "");
        setMetaDescription(site.seoConfig.metaDescription || "");
        setKeywords(site.seoConfig.keywords || "");
        setOgImage(site.seoConfig.ogImage || "");
      }

      setIsPublished(Boolean(site.isPublished));
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load website configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSite();
  }, [selectedOrgId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setShowSuccess(false);
      setErrorMessage("");

      const payload = {
        siteTitle,
        tagline,
        subdomain,
        customDomain: customDomain || null,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        themeConfig: {
          primaryColor,
          secondaryColor,
          accentColor,
          fontFamily,
          darkMode,
          borderRadius,
        },
        seoConfig: {
          metaTitle,
          metaDescription,
          keywords,
          ogImage,
        },
        isPublished,
      };

      const updated = await tenantCmsService.updateSite(payload, selectedOrgId);
      setSiteData(updated);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to persist website updates");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner & Multi-Tenant Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Website & White-Label CMS</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">
              Tenant CMS
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise white-label branding, customized themes, domain routing, and SEO configuration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Super Admin Organization Picker */}
          {isSuperAdmin && orgs.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border">
              <Building2 className="w-4 h-4 text-muted-foreground ml-1" />
              <select
                aria-label="Select Target Tenant Organization"
                value={selectedOrgId || ""}
                onChange={(e) => setSelectedOrgId(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold focus:outline-none pr-2 cursor-pointer"
              >
                {orgs.map((org) => (
                  <option key={org.id} value={org.id} className="text-slate-900">
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {subdomain && (
            <a
              href={`/portal/${subdomain}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border hover:bg-muted transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Live Portal Preview
            </a>
          )}

          {!isSuperAdmin ? (
            <button
              onClick={handleSave}
              disabled={isSaving || loading}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition shadow-sm"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
              Read-Only Inspection Mode
            </span>
          )}
        </div>
      </div>

      {isSuperAdmin && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-medium">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <p>
            <strong>Tenant Sovereignty Policy:</strong> Organization website CMS content is managed solely by each organization’s administrator. Super Administrators have read-only inspection access.
          </p>
        </div>
      )}

      {showSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl transition animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium">Tenant website branding and CMS configurations saved successfully.</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b space-x-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-primary" />
          <p className="text-sm">Fetching tenant portal configuration...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. GENERAL TAB */}
          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border rounded-xl bg-card space-y-4">
                <h3 className="font-semibold text-base border-b pb-2">Organization Portal Identity</h3>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Portal Site Title</label>
                  <input
                    type="text"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    placeholder="e.g. Nexus Global Portal"
                    className="w-full mt-1.5 px-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Tagline / Mission</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Next-Gen Enterprise Solutions"
                    className="w-full mt-1.5 px-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Logo URL Asset</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://your-domain.com/logo.png"
                    className="w-full mt-1.5 px-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Favicon URL Asset</label>
                  <input
                    type="text"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    placeholder="https://your-domain.com/favicon.ico"
                    className="w-full mt-1.5 px-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-5 border rounded-xl bg-card space-y-4">
                <h3 className="font-semibold text-base border-b pb-2">Domains & Tenant Routing</h3>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Tenant Subdomain</label>
                  <div className="flex items-center mt-1.5 border rounded-lg overflow-hidden bg-background">
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="nexus"
                      className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none"
                    />
                    <span className="text-xs font-semibold px-3 py-2 bg-muted text-muted-foreground border-l">
                      .realbizpro.com
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your users can reach your public portal directly via this tenant subdomain.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Custom White-Label Domain (CNAME)</label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                    placeholder="e.g. portal.nexusglobal.com"
                    className="w-full mt-1.5 px-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Point your DNS CNAME record to <code className="font-mono text-primary font-bold">cname.realbizpro.com</code> for automatic SSL resolution.
                  </p>
                </div>

                <div className="pt-2 border-t mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Tenant Organization Owner</p>
                      <p className="text-xs text-muted-foreground">
                        {siteData?.organization?.name || "Target Tenant"} ({siteData?.organization?.code})
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded bg-muted font-mono font-bold">
                      ID: {siteData?.orgId}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. BRANDING TAB */}
          {activeTab === "branding" && (
            <div className="space-y-6">
              {/* Presets */}
              <div className="p-5 border rounded-xl bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Enterprise Theme Presets</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {PRESET_PALETTES.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setPrimaryColor(preset.primary);
                        setSecondaryColor(preset.secondary);
                        setAccentColor(preset.accent);
                      }}
                      className="p-3 border rounded-lg text-left hover:border-primary transition group bg-background"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.secondary }} />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.accent }} />
                      </div>
                      <p className="text-xs font-semibold group-hover:text-primary transition">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 border rounded-xl bg-card space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Primary Brand Accent</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded border p-0.5 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border rounded-lg bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for major call-to-actions, buttons, and active tabs.</p>
                </div>

                <div className="p-5 border rounded-xl bg-card space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Secondary Accent</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 rounded border p-0.5 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border rounded-lg bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for secondary buttons, borders, and gradient stops.</p>
                </div>

                <div className="p-5 border rounded-xl bg-card space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Electric Glow Accent</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded border p-0.5 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border rounded-lg bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for badges, highlights, and focus indicators.</p>
                </div>
              </div>

              {/* Typography & Surface */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 border rounded-xl bg-card space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Typography Family</label>
                  <select
                    aria-label="Typography Family"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background cursor-pointer"
                  >
                    <option value="Inter">Inter (Clean Enterprise)</option>
                    <option value="Roboto">Roboto (Google Modern)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (FinTech)</option>
                    <option value="Geist">Geist (Modern Monospace/Sans)</option>
                  </select>
                </div>

                <div className="p-5 border rounded-xl bg-card space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Card Corner Radius</label>
                  <select
                    aria-label="Card Corner Radius"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background cursor-pointer"
                  >
                    <option value="4px">Compact Sharp (4px)</option>
                    <option value="8px">Balanced Standard (8px)</option>
                    <option value="12px">Rounded Modern (12px)</option>
                    <option value="16px">Full Soft (16px)</option>
                  </select>
                </div>

                <div className="p-5 border rounded-xl bg-card flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Default Portal Theme</label>
                    <p className="text-xs text-muted-foreground mt-1">Render dark midnight mode by default for public portal.</p>
                  </div>
                  <div className="flex items-center gap-2 pt-3">
                    <input
                      type="checkbox"
                      id="darkModeToggle"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <label htmlFor="darkModeToggle" className="text-sm font-medium cursor-pointer">
                      Enable Midnight Dark Mode by Default
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. SEO TAB */}
          {activeTab === "seo" && (
            <div className="p-5 border rounded-xl bg-card space-y-4 max-w-3xl">
              <h3 className="font-semibold text-base border-b pb-2">Search Engine Optimization & Meta Cards</h3>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Meta Title Tag</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="e.g. Nexus Global - Unified Operations Portal"
                  className="w-full mt-1.5 px-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Meta Description</label>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Comprehensive description for search engines and social link previews..."
                  className="w-full mt-1.5 px-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Target Keywords</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="saas, conglomerate, supply chain, enterprise"
                  className="w-full mt-1.5 px-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Social Sharing Image (OG Card URL)</label>
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://your-domain.com/social-preview.png"
                  className="w-full mt-1.5 px-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 4. PAGES & BLOCKS PREVIEW TAB */}
          {activeTab === "pages" && (
            <div className="p-5 border rounded-xl bg-card space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-semibold text-base">Configured Content Blocks</h3>
                  <p className="text-xs text-muted-foreground">
                    Content blocks active on this tenant&apos;s public portal landing page.
                  </p>
                </div>
                {subdomain && (
                  <a
                    href={`/portal/${subdomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-primary text-primary-foreground rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Live Portal
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-mono font-bold">
                      HERO BANNER
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold">Active</span>
                  </div>
                  <h4 className="font-semibold text-sm">Enterprise Hero Banner</h4>
                  <p className="text-xs text-muted-foreground">
                    Headline: &quot;Enterprise Operations Unified for {siteData?.organization?.name || "Tenant"}&quot;
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-mono font-bold">
                      FEATURES GRID
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold">Active</span>
                  </div>
                  <h4 className="font-semibold text-sm">Core Capabilities Bento Grid</h4>
                  <p className="text-xs text-muted-foreground">
                    Displays 3 high-impact enterprise feature cards with custom icons and descriptions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. MAINTENANCE & PUBLISHING STATUS */}
          {activeTab === "maintenance" && (
            <div className="p-5 border rounded-xl bg-card space-y-4 max-w-2xl">
              <h3 className="font-semibold text-base border-b pb-2">Publishing & Availability Control</h3>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div>
                  <p className="font-semibold text-sm">Publish Tenant Portal</p>
                  <p className="text-xs text-muted-foreground">
                    When active, stakeholders and customers can access your white-label portal via subdomain and custom domain.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {!isPublished && (
                <div className="p-3 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200 rounded-lg text-xs font-medium">
                  Portal is currently unpublished. External visitors will see a standard maintenance notice.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
