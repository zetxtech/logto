import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import DangerousRaw from '@/ds-components/DangerousRaw';
import FormField from '@/ds-components/FormField';
import TextInput from '@/ds-components/TextInput';

import type { FormData } from './types';

function AzureFormFields() {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { register } = useFormContext<FormData>();

  return (
    <>
      <FormField
        isRequired
        title={
          <DangerousRaw>
            {t('tenants.storage.azure_connection_string', {
              defaultValue: 'Connection String',
            })}
          </DangerousRaw>
        }
      >
        <TextInput
          {...register('azureConnectionString', { required: true })}
          type="password"
          placeholder="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
        />
      </FormField>
      <FormField
        isRequired
        title={
          <DangerousRaw>
            {t('tenants.storage.azure_container', { defaultValue: 'Container' })}
          </DangerousRaw>
        }
      >
        <TextInput
          {...register('azureContainer', { required: true })}
          placeholder="experience-blobs"
        />
      </FormField>
      <FormField
        title={
          <DangerousRaw>
            {t('tenants.storage.azure_public_url', {
              defaultValue: 'Public URL (optional)',
            })}
          </DangerousRaw>
        }
      >
        <TextInput
          {...register('azurePublicUrl')}
          placeholder="https://myaccount.blob.core.windows.net/container"
        />
      </FormField>
    </>
  );
}

export default AzureFormFields;
