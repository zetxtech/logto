import { useFormContext } from 'react-hook-form';

import DangerousRaw from '@/ds-components/DangerousRaw';
import FormField from '@/ds-components/FormField';
import TextInput from '@/ds-components/TextInput';

import type { FormData } from './types';

function AzureFormFields() {
  const { register } = useFormContext<FormData>();

  return (
    <>
      <FormField isRequired title={<DangerousRaw>Connection String</DangerousRaw>}>
        <TextInput
          {...register('azureConnectionString', { required: true })}
          type="password"
          placeholder="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
        />
      </FormField>
      <FormField isRequired title={<DangerousRaw>Container</DangerousRaw>}>
        <TextInput
          {...register('azureContainer', { required: true })}
          placeholder="experience-blobs"
        />
      </FormField>
      <FormField title={<DangerousRaw>Public URL (optional)</DangerousRaw>}>
        <TextInput
          {...register('azurePublicUrl')}
          placeholder="https://myaccount.blob.core.windows.net/container"
        />
      </FormField>
    </>
  );
}

export default AzureFormFields;
