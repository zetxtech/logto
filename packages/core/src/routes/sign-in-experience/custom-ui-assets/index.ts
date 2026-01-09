import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { uploadFileGuard, maxUploadFileSize, adminTenantId } from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import AdmZip from 'adm-zip';
import pRetry, { AbortError } from 'p-retry';
import { object, z } from 'zod';

import RequestError from '#src/errors/RequestError/index.js';
import koaGuard from '#src/middleware/koa-guard.js';
import { koaQuotaGuard } from '#src/middleware/koa-quota-guard.js';
import SystemContext from '#src/tenants/SystemContext.js';
import assertThat from '#src/utils/assert-that.js';
import { getConsoleLogFromContext } from '#src/utils/console.js';
import { streamToString } from '#src/utils/file.js';
import { buildAzureStorage } from '#src/utils/storage/azure-storage.js';
import { buildS3Storage } from '#src/utils/storage/s3-storage.js';
import { getTenantId } from '#src/utils/tenant.js';

import { type ManagementApiRouter, type RouterInitArgs } from '../../types.js';

const maxRetryCount = 5;

export default function customUiAssetsRoutes<T extends ManagementApiRouter>(
  ...[
    router,
    {
      libraries: { quota },
    },
  ]: RouterInitArgs<T>
) {
  router.post(
    '/sign-in-exp/default/custom-ui-assets',
    koaQuotaGuard({ key: 'bringYourUiEnabled', quota }),
    koaGuard({
      files: object({
        file: uploadFileGuard.array().min(1).max(1),
      }),
      response: z.object({
        customUiAssetId: z.string(),
      }),
      status: [200, 400, 500],
    }),
    async (ctx, next) => {
      const { file: bodyFiles } = ctx.guard.files;
      const file = bodyFiles[0];

      assertThat(file, 'guard.invalid_input');
      assertThat(file.size <= maxUploadFileSize, 'guard.file_size_exceeded');

      // Accept multiple ZIP MIME types (different browsers/OS send different types)
      const allowedZipMimeTypes = [
        'application/zip',
        'application/x-zip-compressed',
        'application/x-zip',
        'application/octet-stream',
      ];
      const isZipFile =
        allowedZipMimeTypes.includes(file.mimetype) ||
        file.originalFilename.toLowerCase().endsWith('.zip');
      assertThat(isZipFile, 'guard.mime_type_not_allowed');

      const [tenantId] = await getTenantId(ctx.URL);
      assertThat(tenantId, 'guard.can_not_get_tenant_id');
      assertThat(tenantId !== adminTenantId, 'guard.not_allowed_for_admin_tenant');

      const { experienceZipsProviderConfig, experienceBlobsProviderConfig } = SystemContext.shared;
      assertThat(experienceBlobsProviderConfig, 'storage.not_configured');

      const customUiAssetId = generateStandardId(8);

      try {
        if (experienceZipsProviderConfig?.provider === 'AzureStorage') {
          // Azure Storage: Use blob trigger for unzipping
          const { connectionString, container } = experienceZipsProviderConfig;
          const { uploadFile, downloadFile, isFileExisted } = buildAzureStorage(
            connectionString,
            container
          );

          const objectKey = `${tenantId}/${customUiAssetId}/assets.zip`;
          const errorLogObjectKey = `${tenantId}/${customUiAssetId}/error.log`;

          await uploadFile(await readFile(file.filepath), objectKey, {
            contentType: file.mimetype,
          });

          const hasUnzipCompleted = async (retryTimes: number) => {
            if (retryTimes > maxRetryCount) {
              throw new AbortError('Unzip timeout. Max retry count reached.');
            }
            const [hasZip, hasError] = await Promise.all([
              isFileExisted(objectKey),
              isFileExisted(errorLogObjectKey),
            ]);
            if (hasZip) {
              throw new Error('Unzip in progress...');
            }
            if (hasError) {
              const errorLogBlob = await downloadFile(errorLogObjectKey);
              const errorLog = await streamToString(errorLogBlob.readableStreamBody);
              throw new AbortError(errorLog || 'Unzipping failed.');
            }
          };

          await pRetry(hasUnzipCompleted, {
            retries: maxRetryCount,
          });
        } else if (experienceBlobsProviderConfig.provider === 'S3Storage') {
          // S3 Storage: Unzip locally and upload files
          const {
            endpoint,
            region,
            bucket,
            accessKeyId,
            accessSecretKey,
            forcePathStyle,
            publicUrl,
          } = experienceBlobsProviderConfig;

          const { uploadFile } = buildS3Storage({
            endpoint,
            region,
            bucket,
            accessKeyId,
            secretAccessKey: accessSecretKey,
            forcePathStyle,
            publicUrl,
          });

          // Extract zip file locally
          const zip = new AdmZip(file.filepath);
          const zipEntries = zip.getEntries();

          // Upload each file to S3 in parallel
          await Promise.all(
            zipEntries
              .filter((entry) => !entry.isDirectory)
              .map(async (entry) => {
                const entryData = entry.getData();
                const objectKey = `${tenantId}/${customUiAssetId}/${entry.entryName}`;
                const contentType = getContentType(entry.entryName);
                return uploadFile(entryData, objectKey, { contentType });
              })
          );
        } else {
          throw new RequestError({
            code: 'storage.not_configured',
            status: 501,
          });
        }
      } catch (error: unknown) {
        getConsoleLogFromContext(ctx).error(error);
        throw new RequestError(
          {
            code: 'storage.upload_error',
            status: 500,
          },
          {
            details: error instanceof Error ? error.message : String(error),
          }
        );
      }

      ctx.body = { customUiAssetId };
      return next();
    }
  );
}

function getContentType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
  };
  return mimeTypes[extension] ?? 'application/octet-stream';
}
