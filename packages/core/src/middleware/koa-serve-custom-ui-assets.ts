import { isFileAssetPath, parseRange } from '@logto/core-kit';
import { tryThat } from '@silverhand/essentials';
import type { MiddlewareType, Context } from 'koa';

import SystemContext from '#src/tenants/SystemContext.js';
import assertThat from '#src/utils/assert-that.js';
import { buildAzureStorage } from '#src/utils/storage/azure-storage.js';
import { buildS3Storage } from '#src/utils/storage/s3-storage.js';
import { getTenantId } from '#src/utils/tenant.js';

import RequestError from '../errors/RequestError/index.js';

const noCache = 'no-cache, no-store, must-revalidate';
const maxAgeSevenDays = 'max-age=604_800_000';

type ServeFileContext = {
  ctx: Context;
  fileObjectKey: string;
  isFileAssetRequest: boolean;
  range: string;
  start?: number;
  end?: number;
  count?: number;
};

const setResponseHeaders = (
  ctx: Context,
  options: {
    contentLength: number;
    totalFileSize: number;
    isFileAssetRequest: boolean;
    range: string;
    start?: number;
    end?: number;
  }
) => {
  const { contentLength, totalFileSize, isFileAssetRequest, range, start, end } = options;
  ctx.set('Cache-Control', isFileAssetRequest ? maxAgeSevenDays : noCache);
  ctx.set('Content-Length', contentLength.toString());
  if (range) {
    ctx.set('Accept-Ranges', 'bytes');
    ctx.set(
      'Content-Range',
      `bytes ${start ?? 0}-${end ?? Math.max(totalFileSize - 1, 0)}/${totalFileSize}`
    );
  }
};

const serveFromAzureStorage = async (
  config: { container: string; connectionString: string },
  context: ServeFileContext
) => {
  const { ctx, fileObjectKey, isFileAssetRequest, range, start, end, count } = context;
  const { downloadFile, isFileExisted, getFileProperties } = buildAzureStorage(
    config.connectionString,
    config.container
  );

  const isExisted = await isFileExisted(fileObjectKey);
  assertThat(isExisted, 'entity.not_found', 404);

  const [
    { contentLength = 0, readableStreamBody, contentType },
    { contentLength: totalFileSize = 0 },
  ] = await Promise.all([
    downloadFile(fileObjectKey, start, count),
    getFileProperties(fileObjectKey),
  ]);

  ctx.body = readableStreamBody;
  ctx.type = contentType ?? 'application/octet-stream';
  ctx.status = range ? 206 : 200;

  setResponseHeaders(ctx, { contentLength, totalFileSize, isFileAssetRequest, range, start, end });
};

const serveFromS3Storage = async (
  config: {
    endpoint?: string;
    region?: string;
    bucket: string;
    accessKeyId: string;
    accessSecretKey: string;
    forcePathStyle?: boolean;
    publicUrl?: string;
  },
  context: ServeFileContext
) => {
  const { ctx, fileObjectKey, isFileAssetRequest, range, start, end, count } = context;
  const { downloadFile, isFileExisted, getFileProperties } = buildS3Storage({
    endpoint: config.endpoint,
    region: config.region,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.accessSecretKey,
    forcePathStyle: config.forcePathStyle,
    publicUrl: config.publicUrl,
  });

  const isExisted = await isFileExisted(fileObjectKey);
  assertThat(isExisted, 'entity.not_found', 404);

  const [{ contentLength = 0, body, contentType }, { contentLength: totalFileSize = 0 }] =
    await Promise.all([
      downloadFile(fileObjectKey, start, count),
      getFileProperties(fileObjectKey),
    ]);

  ctx.body = body;
  ctx.type = contentType ?? 'application/octet-stream';
  ctx.status = range ? 206 : 200;

  setResponseHeaders(ctx, { contentLength, totalFileSize, isFileAssetRequest, range, start, end });
};

/**
 * Middleware that serves custom UI assets user uploaded previously through sign-in experience settings.
 * If the request path contains a dot, consider it as a file and will try to serve the file directly.
 * Otherwise, redirect the request to the `index.html` page.
 */
export default function koaServeCustomUiAssets(customUiAssetId: string) {
  const { experienceBlobsProviderConfig } = SystemContext.shared;
  assertThat(experienceBlobsProviderConfig, 'storage.not_configured');

  const serve: MiddlewareType = async (ctx, next) => {
    const [tenantId] = await getTenantId(ctx.URL);
    assertThat(tenantId, 'session.not_found', 404);

    const contextPath = `${tenantId}/${customUiAssetId}`;
    const requestPath = ctx.request.path;
    const isFileAssetRequest = isFileAssetPath(requestPath);
    const fileObjectKey = `${contextPath}${isFileAssetRequest ? requestPath : '/index.html'}`;

    const range = ctx.get('range');
    const { start, end, count } = tryThat(
      () => parseRange(range),
      new RequestError({ code: 'request.range_not_satisfiable', status: 416 })
    );

    const serveContext: ServeFileContext = {
      ctx,
      fileObjectKey,
      isFileAssetRequest,
      range,
      start,
      end,
      count,
    };

    if (experienceBlobsProviderConfig.provider === 'AzureStorage') {
      await serveFromAzureStorage(experienceBlobsProviderConfig, serveContext);
    } else if (experienceBlobsProviderConfig.provider === 'S3Storage') {
      await serveFromS3Storage(experienceBlobsProviderConfig, serveContext);
    } else {
      throw new RequestError({ code: 'storage.not_configured', status: 501 });
    }

    return next();
  };

  return serve;
}
