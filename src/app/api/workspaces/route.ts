import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workspaceSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(workspaces);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = workspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const workspace = await prisma.workspace.create({
    data: {
      ...parsed.data,
      members: {
        create: {
          userId: session.user.id,
          role: "owner",
        },
      },
    },
    include: {
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json(workspace, { status: 201 });
}
