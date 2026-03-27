import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reorderSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ workspaceId: string; boardId: string }>;
};

export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, boardId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const board = await prisma.kanbanBoard.findFirst({
    where: { id: boardId, workspaceId },
  });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { columns, cards } = parsed.data;

  const operations: Promise<unknown>[] = [];

  if (columns) {
    for (const col of columns) {
      operations.push(
        prisma.kanbanColumn.update({
          where: { id: col.id },
          data: { position: col.position },
        })
      );
    }
  }

  if (cards) {
    for (const card of cards) {
      operations.push(
        prisma.kanbanCard.update({
          where: { id: card.id },
          data: { columnId: card.columnId, position: card.position },
        })
      );
    }
  }

  await Promise.all(operations);

  await prisma.kanbanBoard.update({
    where: { id: boardId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
