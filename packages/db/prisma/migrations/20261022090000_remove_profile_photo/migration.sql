-- Remove the profile photo relation. FileAsset remains available for future
-- media such as project images and certificate scans.

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_photoAssetId_fkey";

-- DropIndex
DROP INDEX "Profile_photoAssetId_key";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "photoAssetId";
