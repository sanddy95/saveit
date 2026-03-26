import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savedLinkSchema } from "@/lib/validators";
import { fetchUrlMetadata } from "@/lib/metadata";
import { Prisma } from "@/generated/prisma/client";

type RouteContext = { params: Promise<{ workspaceId: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";

  const where: Prisma.SavedLinkWhereInput = { workspaceId };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { url: { contains: search, mode: "insensitive" } },
    ];
  }

  const links = await prisma.savedLink.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(links);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = savedLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Auto-fetch metadata from URL
  const metadata = await fetchUrlMetadata(parsed.data.url);

  const link = await prisma.savedLink.create({
    data: {
      url: parsed.data.url,
      title: parsed.data.title || metadata.title || null,
      description: parsed.data.description || metadata.description || null,
      thumbnail: metadata.thumbnail || null,
      siteName: metadata.siteName || null,
      favicon: metadata.favicon || null,
      workspaceId,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
