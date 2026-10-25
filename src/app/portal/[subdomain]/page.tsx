/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Building2,
  ChevronRight,
  ExternalLink,
  Layers,
  CheckCircle,
} from "lucide-react";
import { tenantCmsService, PublicTenantSiteData } from "@/services/tenantCmsService";

export default function TenantPortalPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const resolvedParams = use(params);
  const subdomain = resolvedParams.subdomain;

  const [data, setData] = useState<PublicTenantSiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tenantCmsService
      .getPublicSite(subdomain)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(err.message || "Failed to resolve tenant portal");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subdomain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Resolving tenant portal credentials &amp; branding...</p>
      </div>
    );
  }

  if (error || !data || !data.site) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-red-950/50 border border-red-800 text-red-400 mb-4">
          <Building2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Tenant Portal Unavailable</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          The requested organization portal <code className="font-mono text-blue-400 font-bold">{subdomain}</code> could not be found or has not been published yet.
        </p>
        <Link
          href="/admin/login"
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition"
        >
          Return to Admin Login
        </Link>
      </div>
    );
  }

  const { site, menus = [], pages = [] } = data;
  const theme = site?.themeConfig || {
    primaryColor: "#0000F2",
    secondaryColor: "#3B82F6",
    accentColor: "#00D2FF",
    darkMode: true,
  };

  const headerMenu = menus.find((m) => m.location === "HEADER") || menus[0];
  const homePage = pages.find((p) => p.isHomePage) || pages[0];
  const blocks = homePage?.blocks || [];

  return (
    <div
      className={`min-h-screen ${
        theme.darkMode ? "bg-[#060814] text-white" : "bg-slate-50 text-slate-900"
      }`}
      style={{ fontFamily: theme.fontFamily || "Inter" }}
    >
      {/* 1. Branded Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-opacity-80 border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt={site.siteTitle} className="h-8 w-auto object-contain" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {site.siteTitle ? site.siteTitle.charAt(0) : "T"}
              </div>
            )}
            <div>
              <span className="font-bold text-base tracking-tight">{site.siteTitle}</span>
              {site.tagline && (
                <span className="block text-[11px] text-slate-400 font-medium">{site.tagline}</span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {headerMenu?.tree?.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target={item.target || "_self"}
                className="text-sm font-medium text-slate-300 hover:text-white transition"
              >
                {item.title}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition shadow-sm hover:opacity-90"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero & Dynamic Blocks */}
      {blocks.map((block) => {
        if (block.blockType === "HERO") {
          const content = block.contentJson || {};
          return (
            <section
              key={block.id}
              className="relative py-28 px-6 overflow-hidden border-b border-white/5"
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 pointer-events-none"
                style={{ backgroundColor: theme.primaryColor }}
              />

              <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
                {content.badgeText && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-semibold backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
                    <span>{content.badgeText}</span>
                  </div>
                )}

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                  {content.headline || site.siteTitle}
                </h1>

                <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
                  {content.subheadline || site.tagline}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <Link
                    href={content.ctaLink || "/admin/login"}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-xl hover:opacity-90 transition"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <span>{content.ctaText || "Enter Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-white transition"
                  >
                    Explore Enterprise Tiers
                  </Link>
                </div>
              </div>
            </section>
          );
        }

        if (block.blockType === "FEATURES") {
          const content = block.contentJson || {};
          const items = content.items || [];
          return (
            <section key={block.id} className="py-24 px-6 max-w-7xl mx-auto space-y-12">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">
                  {content.title || "Enterprise Capabilities"}
                </h2>
                <p className="text-sm text-slate-400 max-w-xl mx-auto">
                  Engineered specifically for high-velocity tenant operations, audit assurance, and team synergy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {items.map((feat: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition space-y-4"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${theme.primaryColor}25`, color: theme.accentColor }}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold">{feat.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        return null;
      })}

      {/* 3. Footer */}
      <footer className="border-t border-white/10 py-12 px-6 text-center text-xs text-slate-500 space-y-2">
        <p>&copy; {new Date().getFullYear()} {site.siteTitle}. Powered by RealBiz Pro Multi-Tenant Engine.</p>
        <p className="text-[11px] text-slate-600 font-mono">
          Tenant Slug: {subdomain} &bull; Org Code: {site.organization?.code}
        </p>
      </footer>
    </div>
  );
}
