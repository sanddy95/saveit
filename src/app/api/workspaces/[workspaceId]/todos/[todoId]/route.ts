import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ workspaceId: string; todoId: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, todoId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const todo = await prisma.todoItem.findFirst({
    where: { id: todoId, workspaceId },
  });
  if (!todo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(todo);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, todoId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, completed, priority, dueDate, reminderAt, url, thumbnail, siteName, favicon } = body;

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (completed !== undefined) data.completed = completed;
  if (priority !== undefined) data.priority = priority;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (reminderAt !== undefined) data.reminderAt = reminderAt ? new Date(reminderAt) : null;
  if (url !== undefined) data.url = url || null;
  if (thumbnail !== undefined) data.thumbnail = thumbnail || null;
  if (siteName !== undefined) data.siteName = siteName || null;
  if (favicon !== undefined) data.favicon = favicon || null;

  const todo = await prisma.todoItem.update({
    where: { id: todoId, workspaceId },
    data,
  });

  return NextResponse.json(todo);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, todoId } = await ctx.params;

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  await prisma.todoItem.delete({ where: { id: todoId, workspaceId } });

  return NextResponse.json({ success: true });
}
