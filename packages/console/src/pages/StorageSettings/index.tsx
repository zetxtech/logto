import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import DetailsPage from '@/components/DetailsPage';
import FormCard from '@/components/FormCard';
import PageMeta from '@/components/PageMeta';
import SubmitFormChangesActionBar from '@/components/SubmitFormChangesActionBar';
import UnsavedChangesAlertModal from '@/components/UnsavedChangesAlertModal';
import Button from '@/ds-components/Button';
import DangerousRaw from '@/ds-components/DangerousRaw';
import FormField from '@/ds-components/FormField';
import RadioGroup, { Radio } from '@/ds-components/RadioGroup';
import useApi from '@/hooks/use-api';
import useSwrFetcher from '@/hooks/use-swr-fetcher';
import { trySubmitSafe } from '@/utils/form';

import AzureFormFields from './AzureFormFields.js';
import S3FormFields from './S3FormFields.js';
import styles from './index.module.scss';
import {
  type StorageConfig,
  type FormData,
  defaultFormValues,
  configToFormData,
  formDataToConfig,
  isStorageProvider,
} from './types.js';

function StorageSettings() {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const api = useApi();
  const fetcher = useSwrFetcher<StorageConfig | undefined>(api);

  const { data: currentConfig, mutate } = useSWR<StorageConfig | undefined>(
    'api/systems/storage-provider',
    fetcher
  );

  const methods = useForm<FormData>({
    defaultValues: configToFormData(currentConfig),
    values: configToFormData(currentConfig),
  });

  const {
    watch,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = methods;

  const selectedProvider = watch('provider');

  const onSubmit = handleSubmit(
    trySubmitSafe(async (data: FormData) => {
      const config = formDataToConfig(data);
      await api.put('api/systems/storage-provider', { json: config });
      await mutate();
      reset(data);
      toast.success(t('general.saved'));
    })
  );

  const handleDelete = async () => {
    await api.delete('api/systems/storage-provider');
    await mutate();
    reset(defaultFormValues);
    toast.success(t('general.deleted'));
  };

  const isConfigured = Boolean(currentConfig);

  const providerLabel = currentConfig?.provider === 'S3Storage' ? 'S3' : 'Azure';

  return (
    <DetailsPage
      backLink="/storage-settings"
      backLinkTitle="tenants.storage.title"
      isLoading={false}
    >
      <PageMeta titleKey="tenants.storage.title" />
      <FormCard title="tenants.storage.title" description="tenants.storage.description">
        <div className={styles.statusCard} data-configured={isConfigured}>
          <span>
            {isConfigured
              ? t('tenants.storage.status_configured', { provider: providerLabel })
              : t('tenants.storage.status_not_configured')}
          </span>
          {isConfigured && (
            <Button type="default" size="small" title="general.delete" onClick={handleDelete} />
          )}
        </div>

        <FormProvider {...methods}>
          <form className={styles.form}>
            <FormField title="tenants.storage.provider">
              <RadioGroup
                name="provider"
                value={selectedProvider}
                onChange={(value) => {
                  if (isStorageProvider(value)) {
                    methods.setValue('provider', value, { shouldDirty: true });
                  }
                }}
              >
                <Radio value="S3Storage" title={<DangerousRaw>S3 / MinIO</DangerousRaw>} />
                <Radio
                  value="AzureStorage"
                  title={<DangerousRaw>Azure Blob Storage</DangerousRaw>}
                />
              </RadioGroup>
            </FormField>

            {selectedProvider === 'S3Storage' && <S3FormFields />}
            {selectedProvider === 'AzureStorage' && <AzureFormFields />}
          </form>
        </FormProvider>
      </FormCard>

      <SubmitFormChangesActionBar
        isOpen={isDirty}
        isSubmitting={isSubmitting}
        onDiscard={() => {
          reset();
        }}
        onSubmit={onSubmit}
      />
      <UnsavedChangesAlertModal hasUnsavedChanges={isDirty} />
    </DetailsPage>
  );
}

export default StorageSettings;
