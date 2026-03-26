import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todoSchema } from "@/lib/validators";
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
  const status = searchParams.get("status") || "all";
  const priority = searchParams.get("priority");
  const sort = searchParams.get("sort") || "createdAt";

  const where: Prisma.TodoItemWhereInput = { workspaceId };

  if (status === "active") where.completed = false;
  else if (status === "completed") where.completed = true;

  if (priority) where.priority = priority;

  const orderBy: Prisma.TodoItemOrderByWithRelationInput =
    sort === "dueDate"
      ? { dueDate: { sort: "asc", nulls: "last" } }
      : sort === "priority"
        ? { priority: "asc" }
        : { createdAt: "desc" };

  const todos = await prisma.todoItem.findMany({ where, orderBy });

  return NextResponse.json(todos);
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
  const parsed = todoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { dueDate, reminderAt, ...rest } = parsed.data;

  const todo = await prisma.todoItem.create({
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      reminderAt: reminderAt ? new Date(reminderAt) : undefined,
      workspaceId,
    },
  });

  return NextResponse.json(todo, { status: 201 });
}
