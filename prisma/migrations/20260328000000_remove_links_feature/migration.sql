-- DropForeignKey
ALTER TABLE "SharedItem" DROP CONSTRAINT IF EXISTS "SharedItem_savedLinkId_fkey";
ALTER TABLE "KanbanCard" DROP CONSTRAINT IF EXISTS "KanbanCard_savedLinkId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "SharedItem_workspaceId_savedLinkId_key";

-- AlterTable
ALTER TABLE "SharedItem" DROP COLUMN IF EXISTS "savedLinkId";
ALTER TABLE "KanbanCard" DROP COLUMN IF EXISTS "savedLinkId";

-- DropTable
DROP TABLE IF EXISTS "SavedLink";
