import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ workspaceId: string; boardId: string; columnId: string }>;
};

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId, columnId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const column = await prisma.kanbanColumn.findFirst({
    where: { id: columnId, board: { id: boardId, workspaceId } },
  });
  if (!column) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, color, icon, position } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (color !== undefined) data.color = color;
  if (icon !== undefined) data.icon = icon;
  if (position !== undefined) data.position = position;

  const updated = await prisma.kanbanColumn.update({
    where: { id: columnId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId, columnId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const column = await prisma.kanbanColumn.findFirst({
    where: { id: columnId, board: { id: boardId, workspaceId } },
    include: { _count: { select: { cards: true } } },
  });
  if (!column) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (column._count.cards > 0) {
    return NextResponse.json(
      { error: "Cannot delete column with cards. Move or remove cards first." },
      { status: 400 }
    );
  }

  await prisma.kanbanColumn.delete({ where: { id: columnId } });

  return NextResponse.json({ success: true });
}
