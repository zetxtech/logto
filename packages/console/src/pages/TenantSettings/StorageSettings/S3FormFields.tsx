import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import DangerousRaw from '@/ds-components/DangerousRaw';
import FormField from '@/ds-components/FormField';
import TextInput from '@/ds-components/TextInput';

import type { FormData } from './types';

function S3FormFields() {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { register } = useFormContext<FormData>();

  return (
    <>
      <FormField
        title={
          <DangerousRaw>
            {t('tenants.storage.s3_endpoint', { defaultValue: 'S3 Endpoint' })}
          </DangerousRaw>
        }
      >
        <TextInput
          {...register('s3Endpoint')}
          placeholder="https://s3.amazonaws.com or http://minio:9000"
        />
      </FormField>
      <FormField
        title={
          <DangerousRaw>{t('tenants.storage.s3_region', { defaultValue: 'Region' })}</DangerousRaw>
        }
      >
        <TextInput {...register('s3Region')} placeholder="us-east-1" />
      </FormField>
      <FormField
        isRequired
        title={
          <DangerousRaw>{t('tenants.storage.s3_bucket', { defaultValue: 'Bucket' })}</DangerousRaw>
        }
      >
        <TextInput {...register('s3Bucket', { required: true })} placeholder="my-bucket" />
      </FormField>
      <FormField
        isRequired
        title={
          <DangerousRaw>
            {t('tenants.storage.s3_access_key_id', { defaultValue: 'Access Key ID' })}
          </DangerousRaw>
        }
      >
        <TextInput
          {...register('s3AccessKeyId', { required: true })}
          placeholder="AKIAIOSFODNN7EXAMPLE"
        />
      </FormField>
      <FormField
        isRequired
        title={
          <DangerousRaw>
            {t('tenants.storage.s3_secret_access_key', {
              defaultValue: 'Secret Access Key',
            })}
          </DangerousRaw>
        }
      >
        <TextInput
          {...register('s3AccessSecretKey', { required: true })}
          type="password"
          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        />
      </FormField>
      <FormField
        title={
          <DangerousRaw>
            {t('tenants.storage.s3_public_url', {
              defaultValue: 'Public URL (optional)',
            })}
          </DangerousRaw>
        }
      >
        <TextInput {...register('s3PublicUrl')} placeholder="https://cdn.example.com/bucket" />
      </FormField>
    </>
  );
}

export default S3FormFields;
