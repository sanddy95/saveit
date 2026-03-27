import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });

  const workspaceIds = memberships.map((m) => m.workspaceId);

  const boards = await prisma.kanbanBoard.findMany({
    where: { workspaceId: { in: workspaceIds } },
    orderBy: { updatedAt: "desc" },
    take: 3,
    include: {
      workspace: { select: { id: true, name: true, color: true } },
      _count: { select: { columns: true } },
      columns: {
        include: { _count: { select: { cards: true } } },
      },
    },
  });

  const result = boards.map((b) => ({
    id: b.id,
    name: b.name,
    workspaceId: b.workspaceId,
    updatedAt: b.updatedAt,
    workspace: b.workspace,
    columnCount: b._count.columns,
    cardCount: b.columns.reduce((sum, c) => sum + c._count.cards, 0),
  }));

  return NextResponse.json(result);
}
