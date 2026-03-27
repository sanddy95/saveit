import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { boardSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ workspaceId: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const boards = await prisma.kanbanBoard.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { columns: true } },
      columns: {
        include: { _count: { select: { cards: true } } },
      },
    },
  });

  const result = boards.map((b) => ({
    ...b,
    columnCount: b._count.columns,
    cardCount: b.columns.reduce((sum, c) => sum + c._count.cards, 0),
    columns: undefined,
    _count: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = boardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const board = await prisma.kanbanBoard.create({
    data: {
      name: parsed.data.name,
      workspaceId,
      columns: {
        create: [
          { name: "To Do", position: 0 },
          { name: "In Progress", position: 1 },
          { name: "Done", position: 2 },
        ],
      },
    },
    include: {
      columns: { orderBy: { position: "asc" } },
    },
  });

  return NextResponse.json(board, { status: 201 });
}
