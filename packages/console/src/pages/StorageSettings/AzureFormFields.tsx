import { useFormContext } from 'react-hook-form';

import FormField from '@/ds-components/FormField';
import TextInput from '@/ds-components/TextInput';

import type { FormData } from './types';

function AzureFormFields() {
  const { register } = useFormContext<FormData>();

  return (
    <>
      <FormField isRequired title="tenants.storage.azure_connection_string">
        <TextInput
          {...register('azureConnectionString', { required: true })}
          type="password"
          placeholder="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
        />
      </FormField>
      <FormField isRequired title="tenants.storage.azure_container">
        <TextInput
          {...register('azureContainer', { required: true })}
          placeholder="experience-blobs"
        />
      </FormField>
      <FormField title="tenants.storage.azure_public_url">
        <TextInput
          {...register('azurePublicUrl')}
          placeholder="https://myaccount.blob.core.windows.net/container"
        />
      </FormField>
    </>
  );
}

export default AzureFormFields;
