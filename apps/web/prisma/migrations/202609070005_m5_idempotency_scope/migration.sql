CREATE UNIQUE INDEX "ApiIdempotencyKey_organizationId_key_method_path_key" ON "ApiIdempotencyKey"("organizationId","key","method","path");
