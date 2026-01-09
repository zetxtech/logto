type StorageProvider = 'S3Storage' | 'AzureStorage';

const storageProviders: ReadonlySet<string> = new Set(['S3Storage', 'AzureStorage']);

export const isStorageProvider = (value: string): value is StorageProvider =>
  storageProviders.has(value);

type S3Config = {
  provider: 'S3Storage';
  endpoint?: string;
  region?: string;
  bucket: string;
  accessKeyId: string;
  accessSecretKey: string;
  publicUrl?: string;
  forcePathStyle?: boolean;
};

type AzureConfig = {
  provider: 'AzureStorage';
  connectionString: string;
  container: string;
  publicUrl?: string;
};

export type StorageConfig = S3Config | AzureConfig;

export type FormData = {
  provider: StorageProvider;
  // S3 fields
  s3Endpoint: string;
  s3Region: string;
  s3Bucket: string;
  s3AccessKeyId: string;
  s3AccessSecretKey: string;
  s3PublicUrl: string;
  s3ForcePathStyle: boolean;
  // Azure fields
  azureConnectionString: string;
  azureContainer: string;
  azurePublicUrl: string;
};

export const defaultFormValues: FormData = {
  provider: 'S3Storage',
  s3Endpoint: '',
  s3Region: 'us-east-1',
  s3Bucket: '',
  s3AccessKeyId: '',
  s3AccessSecretKey: '',
  s3PublicUrl: '',
  s3ForcePathStyle: false,
  azureConnectionString: '',
  azureContainer: '',
  azurePublicUrl: '',
};

export const configToFormData = (config: StorageConfig | undefined): FormData => {
  if (!config) {
    return defaultFormValues;
  }

  if (config.provider === 'S3Storage') {
    return {
      ...defaultFormValues,
      provider: 'S3Storage',
      s3Endpoint: config.endpoint ?? '',
      s3Region: config.region ?? 'us-east-1',
      s3Bucket: config.bucket,
      s3AccessKeyId: config.accessKeyId,
      s3AccessSecretKey: config.accessSecretKey,
      s3PublicUrl: config.publicUrl ?? '',
      s3ForcePathStyle: config.forcePathStyle ?? false,
    };
  }

  return {
    ...defaultFormValues,
    provider: 'AzureStorage',
    azureConnectionString: config.connectionString,
    azureContainer: config.container,
    azurePublicUrl: config.publicUrl ?? '',
  };
};

export const formDataToConfig = (data: FormData): StorageConfig => {
  if (data.provider === 'S3Storage') {
    return {
      provider: 'S3Storage',
      endpoint: data.s3Endpoint || undefined,
      region: data.s3Region || undefined,
      bucket: data.s3Bucket,
      accessKeyId: data.s3AccessKeyId,
      accessSecretKey: data.s3AccessSecretKey,
      publicUrl: data.s3PublicUrl || undefined,
      forcePathStyle: data.s3ForcePathStyle,
    };
  }

  return {
    provider: 'AzureStorage',
    connectionString: data.azureConnectionString,
    container: data.azureContainer,
    publicUrl: data.azurePublicUrl || undefined,
  };
};
