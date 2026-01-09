import { useFormContext, Controller } from 'react-hook-form';

import FormField from '@/ds-components/FormField';
import Switch from '@/ds-components/Switch';
import TextInput from '@/ds-components/TextInput';

import type { FormData } from './types';

function S3FormFields() {
  const { register, control } = useFormContext<FormData>();

  return (
    <>
      <FormField title="tenants.storage.s3_endpoint">
        <TextInput
          {...register('s3Endpoint')}
          placeholder="https://s3.amazonaws.com or http://minio:9000"
        />
      </FormField>
      <FormField title="tenants.storage.s3_region">
        <TextInput {...register('s3Region')} placeholder="us-east-1" />
      </FormField>
      <FormField isRequired title="tenants.storage.s3_bucket">
        <TextInput {...register('s3Bucket', { required: true })} placeholder="my-bucket" />
      </FormField>
      <FormField isRequired title="tenants.storage.s3_access_key_id">
        <TextInput
          {...register('s3AccessKeyId', { required: true })}
          placeholder="AKIAIOSFODNN7EXAMPLE"
        />
      </FormField>
      <FormField isRequired title="tenants.storage.s3_secret_access_key">
        <TextInput
          {...register('s3AccessSecretKey', { required: true })}
          type="password"
          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        />
      </FormField>
      <FormField title="tenants.storage.s3_public_url">
        <TextInput {...register('s3PublicUrl')} placeholder="https://cdn.example.com/bucket" />
      </FormField>
      <FormField
        title="tenants.storage.s3_force_path_style"
        tip="tenants.storage.s3_force_path_style_description"
      >
        <Controller
          name="s3ForcePathStyle"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Switch
              checked={value}
              onChange={({ currentTarget: { checked } }) => {
                onChange(checked);
              }}
            />
          )}
        />
      </FormField>
    </>
  );
}

export default S3FormFields;
