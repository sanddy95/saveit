import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addCardSchema } from "@/lib/validators";

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
  const parsed = addCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify column belongs to this board
  const column = await prisma.kanbanColumn.findFirst({
    where: { id: data.columnId, boardId },
  });
  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  // Check max 100 cards per column
  const cardCount = await prisma.kanbanCard.count({
    where: { columnId: data.columnId },
  });
  if (cardCount >= 100) {
    return NextResponse.json(
      { error: "Maximum 100 cards per column" },
      { status: 400 }
    );
  }

  let todoId: string | undefined;

  if (data.mode === "existing") {
    todoId = data.todoId;

    // Check duplicate on this board
    const existingCard = await prisma.kanbanCard.findFirst({
      where: {
        column: { boardId },
        todoId,
      },
    });
    if (existingCard) {
      return NextResponse.json(
        { error: "This item is already on the board" },
        { status: 400 }
      );
    }
  } else if (data.mode === "new-todo") {
    const todo = await prisma.todoItem.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || "medium",
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : undefined,
        url: data.url || undefined,
        thumbnail: data.thumbnail || undefined,
        siteName: data.siteName || undefined,
        favicon: data.favicon || undefined,
        workspaceId,
      },
    });
    todoId = todo.id;
  }

  const card = await prisma.kanbanCard.create({
    data: {
      position: cardCount,
      columnId: data.columnId,
      todoId,
    },
    include: {
      todo: true,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
