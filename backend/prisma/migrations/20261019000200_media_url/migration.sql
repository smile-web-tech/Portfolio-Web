-- Uploads move from local disk to Vercel Blob, so media is identified by URL, not filename.
ALTER TABLE "Media" ADD COLUMN "url" TEXT;
UPDATE "Media" SET "url" = '/uploads/' || "filename";
ALTER TABLE "Media" ALTER COLUMN "url" SET NOT NULL;
DROP INDEX "Media_filename_key";
ALTER TABLE "Media" DROP COLUMN "filename";
CREATE UNIQUE INDEX "Media_url_key" ON "Media"("url");

-- Login throttling reads recent failures per IP from the audit log.
CREATE INDEX "AuditLog_action_ip_createdAt_idx" ON "AuditLog"("action", "ip", "createdAt");
