import { Readable } from 'node:stream';

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

import type { UploadFile } from './types.js';

const getRegionFromEndpoint = (endpoint?: string) => {
  if (!endpoint) {
    return;
  }

  return /s3\.([^.]*)\.amazonaws/.exec(endpoint)?.[1];
};

type BuildS3StorageParameters = {
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  publicUrl?: string;
};

export const buildS3Storage = ({
  bucket,
  accessKeyId,
  secretAccessKey,
  region,
  endpoint,
  forcePathStyle,
  publicUrl,
}: BuildS3StorageParameters) => {
  if (!region && !endpoint) {
    throw new Error('Either region or endpoint must be provided');
  }

  // Endpoint example: s3.us-west-2.amazonaws.com
  const finalRegion = region ?? getRegionFromEndpoint(endpoint) ?? 'us-east-1';

  const client = new S3Client({
    region: finalRegion,
    endpoint,
    forcePathStyle,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const uploadFile: UploadFile = async (
    data,
    objectKey,
    { contentType, publicUrl: urlOverride } = {}
  ) => {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: data,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await client.send(command);

    const finalPublicUrl = urlOverride ?? publicUrl;
    if (finalPublicUrl) {
      return { url: `${finalPublicUrl}/${objectKey}` };
    }

    if (endpoint) {
      // Custom endpoint URL construction
      if (forcePathStyle) {
        // Path-style URL: https://endpoint/bucket/key
        return {
          url: `${endpoint}/${bucket}/${objectKey}`,
        };
      }
      // Virtual-hosted style URL: https://bucket.endpoint/key
      return {
        url: `${endpoint.replace(/^(https?:\/\/)/, `$1${bucket}.`)}/${objectKey}`,
      };
    }

    // AWS S3 standard URL construction
    if (forcePathStyle) {
      // Path-style URL: https://s3.region.amazonaws.com/bucket/key
      return {
        url: `https://s3.${finalRegion}.amazonaws.com/${bucket}/${objectKey}`,
      };
    }
    // Virtual-hosted style URL: https://bucket.s3.region.amazonaws.com/key
    return {
      url: `https://${bucket}.s3.${finalRegion}.amazonaws.com/${objectKey}`,
    };
  };

  const downloadFile = async (
    objectKey: string,
    offset?: number,
    count?: number
  ): Promise<{
    contentLength?: number;
    contentType?: string;
    body?: Readable;
  }> => {
    const range =
      offset !== undefined || count !== undefined
        ? `bytes=${offset ?? 0}-${count === undefined ? '' : (offset ?? 0) + count - 1}`
        : undefined;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Range: range,
    });

    const response = await client.send(command);
    const body = response.Body;

    return {
      contentLength: response.ContentLength,
      contentType: response.ContentType,
      // SdkStream<Readable> extends Readable, so it's compatible
      body: body instanceof Readable ? body : undefined,
    };
  };

  const isFileExisted = async (objectKey: string): Promise<boolean> => {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      });
      await client.send(command);
      return true;
    } catch {
      return false;
    }
  };

  const getFileProperties = async (
    objectKey: string
  ): Promise<{ contentLength?: number; contentType?: string }> => {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });
    const response = await client.send(command);
    return {
      contentLength: response.ContentLength,
      contentType: response.ContentType,
    };
  };

  const deleteFile = async (objectKey: string): Promise<void> => {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });
    await client.send(command);
  };

  const listFiles = async (prefix: string): Promise<string[]> => {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });
    const response = await client.send(command);
    return response.Contents?.map((item) => item.Key).filter(Boolean) ?? [];
  };

  return {
    uploadFile,
    downloadFile,
    isFileExisted,
    getFileProperties,
    deleteFile,
    listFiles,
  };
};
