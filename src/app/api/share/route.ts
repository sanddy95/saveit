import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchUrlMetadata } from "@/lib/metadata";

function extractUrl(title?: string, text?: string, url?: string): string | null {
  // Check the url param first
  if (url && isValidUrl(url)) return url;

  // Parse URLs from text
  if (text) {
    const urlMatch = text.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/i);
    if (urlMatch) return urlMatch[0];
  }

  // Check if title is a URL
  if (title && isValidUrl(title)) return title;

  return null;
}

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  // Parse form-urlencoded body (share target sends this format)
  const contentType = req.headers.get("content-type") || "";
  let title = "";
  let text = "";
  let url = "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    title = (formData.get("title") as string) || "";
    text = (formData.get("text") as string) || "";
    url = (formData.get("url") as string) || "";
  } else {
    // JSON fallback (for manual replay from SW)
    try {
      const body = await req.json();
      title = body.title || "";
      text = body.text || "";
      url = body.url || "";
    } catch {
      // Try URL search params
      title = req.nextUrl.searchParams.get("title") || "";
      text = req.nextUrl.searchParams.get("text") || "";
      url = req.nextUrl.searchParams.get("url") || "";
    }
  }

  // Not authenticated — redirect to login
  if (!session?.user?.id) {
    const params = new URLSearchParams({ title, text, url });
    return NextResponse.redirect(
      new URL(`/login?returnUrl=/api/share?${params.toString()}`, req.url),
      303
    );
  }

  // Extract URL from shared data
  const extractedUrl = extractUrl(title, text, url);

  if (!extractedUrl) {
    return NextResponse.redirect(
      new URL("/dashboard?shared=error&reason=no-url", req.url),
      303
    );
  }

  // Get user's first workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });

  if (!membership) {
    return NextResponse.redirect(
      new URL("/dashboard?shared=error&reason=no-workspace", req.url),
      303
    );
  }

  // Fetch metadata
  let metadata = { title: "", description: "", thumbnail: "", siteName: "", favicon: "" };
  try {
    metadata = await fetchUrlMetadata(extractedUrl);
  } catch {
    // Continue without metadata
  }

  // Create todo with URL
  const todoTitle = metadata.title || title || extractedUrl;
  const todoDescription = metadata.description || (text !== extractedUrl ? text : "") || "";

  await prisma.todoItem.create({
    data: {
      title: todoTitle.slice(0, 200),
      description: todoDescription.slice(0, 500) || undefined,
      priority: "medium",
      url: extractedUrl,
      thumbnail: metadata.thumbnail || undefined,
      siteName: metadata.siteName || undefined,
      favicon: metadata.favicon || undefined,
      workspaceId: membership.workspaceId,
    },
  });

  return NextResponse.redirect(new URL("/dashboard?shared=true", req.url), 303);
}

// Also handle GET for share target fallback (some browsers use GET)
export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title") || "";
  const text = req.nextUrl.searchParams.get("text") || "";
  const url = req.nextUrl.searchParams.get("url") || "";

  // Redirect to dashboard with share_pending params so the client can handle it
  const params = new URLSearchParams({ title, text, url });
  return NextResponse.redirect(
    new URL(`/dashboard?share_pending=true&${params.toString()}`, req.url),
    303
  );
}
