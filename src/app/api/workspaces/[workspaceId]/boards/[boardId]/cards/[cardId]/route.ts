import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ workspaceId: string; boardId: string; cardId: string }>;
};

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId, cardId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const card = await prisma.kanbanCard.findFirst({
    where: { id: cardId, column: { board: { id: boardId, workspaceId } } },
  });
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { columnId, position } = body;

  const data: Record<string, unknown> = {};
  if (columnId !== undefined) data.columnId = columnId;
  if (position !== undefined) data.position = position;

  const updated = await prisma.kanbanCard.update({
    where: { id: cardId },
    data,
    include: { todo: true, savedLink: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId, cardId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const card = await prisma.kanbanCard.findFirst({
    where: { id: cardId, column: { board: { id: boardId, workspaceId } } },
  });
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.kanbanCard.delete({ where: { id: cardId } });

  return NextResponse.json({ success: true });
}
