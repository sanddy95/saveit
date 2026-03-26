import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workspaceSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ workspaceId: string }> };

async function verifyMembership(userId: string, workspaceId: string) {
  return prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await ctx.params;
  const member = await verifyMembership(session.user.id, workspaceId);
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { members: true, todos: true } },
    },
  });

  return NextResponse.json(workspace);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await ctx.params;
  const member = await verifyMembership(session.user.id, workspaceId);
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = workspaceSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: parsed.data,
    include: { _count: { select: { members: true } } },
  });

  return NextResponse.json(workspace);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await ctx.params;
  const member = await verifyMembership(session.user.id, workspaceId);
  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can delete" }, { status: 403 });
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });

  return NextResponse.json({ success: true });
}
