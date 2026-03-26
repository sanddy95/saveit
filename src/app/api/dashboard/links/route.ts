import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberWorkspaces = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });

  const workspaceIds = memberWorkspaces.map((m) => m.workspaceId);

  const links = await prisma.savedLink.findMany({
    where: {
      workspaceId: { in: workspaceIds },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      workspace: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(links);
}
