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

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [dueToday, overdue, completedToday, totalTodosToday] =
    await Promise.all([
      prisma.todoItem.count({
        where: {
          workspaceId: { in: workspaceIds },
          completed: false,
          dueDate: { gte: startOfDay, lt: endOfDay },
        },
      }),
      prisma.todoItem.count({
        where: {
          workspaceId: { in: workspaceIds },
          completed: false,
          dueDate: { lt: startOfDay },
        },
      }),
      prisma.todoItem.count({
        where: {
          workspaceId: { in: workspaceIds },
          completed: true,
          updatedAt: { gte: startOfDay },
        },
      }),
      prisma.todoItem.count({
        where: {
          workspaceId: { in: workspaceIds },
          OR: [
            { createdAt: { gte: startOfDay } },
            { dueDate: { gte: startOfDay, lt: endOfDay } },
          ],
        },
      }),
    ]);

  return NextResponse.json({
    totalTodosToday,
    completedToday,
    dueToday,
    overdue,
  });
}
