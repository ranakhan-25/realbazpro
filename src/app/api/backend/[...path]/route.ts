import { NextRequest, NextResponse } from "next/server";

const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:5002/realbizpro/api/v1";
const API_BASE_URL = configuredApiUrl.replace(/^http:\/\/localhost(?=:)/i, "http://127.0.0.1");

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const targetUrl = new URL(`${API_BASE_URL.replace(/\/$/, "")}/${path.join("/")}`);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  if (!headers.has("authorization")) {
    const token =
      request.cookies.get("admin_access_token")?.value ||
      request.cookies.get("access_token")?.value ||
      request.cookies.get("token")?.value;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.text(),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend request failed";
    console.error(`Backend proxy request failed: ${targetUrl.toString()}`, error);
    return NextResponse.json(
      { success: false, message: `Backend unavailable at ${targetUrl.origin}: ${message}` },
      { status: 502 },
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return NextResponse.json(await response.json(), { status: response.status });
  }

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": contentType || "text/plain" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
