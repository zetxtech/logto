import { useFormContext } from 'react-hook-form';

import DangerousRaw from '@/ds-components/DangerousRaw';
import FormField from '@/ds-components/FormField';
import TextInput from '@/ds-components/TextInput';

import type { FormData } from './types';

function S3FormFields() {
  const { register } = useFormContext<FormData>();

  return (
    <>
      <FormField title={<DangerousRaw>S3 Endpoint</DangerousRaw>}>
        <TextInput
          {...register('s3Endpoint')}
          placeholder="https://s3.amazonaws.com or http://minio:9000"
        />
      </FormField>
      <FormField title={<DangerousRaw>Region</DangerousRaw>}>
        <TextInput {...register('s3Region')} placeholder="us-east-1" />
      </FormField>
      <FormField isRequired title={<DangerousRaw>Bucket</DangerousRaw>}>
        <TextInput {...register('s3Bucket', { required: true })} placeholder="my-bucket" />
      </FormField>
      <FormField isRequired title={<DangerousRaw>Access Key ID</DangerousRaw>}>
        <TextInput
          {...register('s3AccessKeyId', { required: true })}
          placeholder="AKIAIOSFODNN7EXAMPLE"
        />
      </FormField>
      <FormField isRequired title={<DangerousRaw>Secret Access Key</DangerousRaw>}>
        <TextInput
          {...register('s3AccessSecretKey', { required: true })}
          type="password"
          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        />
      </FormField>
      <FormField title={<DangerousRaw>Public URL (optional)</DangerousRaw>}>
        <TextInput {...register('s3PublicUrl')} placeholder="https://cdn.example.com/bucket" />
      </FormField>
    </>
  );
}

export default S3FormFields;
