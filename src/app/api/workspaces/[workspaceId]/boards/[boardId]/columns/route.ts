import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { columnSchema } from "@/lib/validators";

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

  const columnCount = await prisma.kanbanColumn.count({
    where: { boardId },
  });
  if (columnCount >= 10) {
    return NextResponse.json(
      { error: "Maximum 10 columns per board" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = columnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const column = await prisma.kanbanColumn.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      icon: parsed.data.icon,
      position: columnCount,
      boardId,
    },
  });

  return NextResponse.json(column, { status: 201 });
}
