import { StorageProviderKey, storageProviderDataGuard } from '@logto/schemas';
import { sql } from '@silverhand/slonik';
import { object, string } from 'zod';

import { EnvSet } from '#src/env-set/index.js';
import koaGuard from '#src/middleware/koa-guard.js';
import SystemContext from '#src/tenants/SystemContext.js';

import type { ManagementApiRouter, RouterInitArgs } from './types.js';

export default function systemRoutes<T extends ManagementApiRouter>(
  ...[
    router,
    {
      libraries: { protectedApps },
    },
  ]: RouterInitArgs<T>
) {
  router.get(
    '/systems/application',
    koaGuard({
      response: object({ protectedApps: object({ defaultDomain: string() }) }),
      status: [200, 501],
    }),
    async (ctx, next) => {
      const defaultDomain = await protectedApps.getDefaultDomain();

      ctx.body = { protectedApps: { defaultDomain } };

      return next();
    }
  );

  router.get(
    '/systems/storage-provider',
    koaGuard({
      response: storageProviderDataGuard.nullable(),
      status: [200],
    }),
    async (ctx, next) => {
      const config = SystemContext.shared.experienceBlobsProviderConfig;
      ctx.body = config ?? null;
      return next();
    }
  );

  router.put(
    '/systems/storage-provider',
    koaGuard({
      body: storageProviderDataGuard,
      response: storageProviderDataGuard,
      status: [200, 400],
    }),
    async (ctx, next) => {
      const { body } = ctx.guard;
      const adminPool = await EnvSet.sharedPool;

      const jsonValue = JSON.stringify(body);

      // Update experienceBlobsProvider in systems table
      await adminPool.query(sql`
        INSERT INTO systems (key, value)
        VALUES (${StorageProviderKey.ExperienceBlobsProvider}, ${jsonValue}::jsonb)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `);

      // Also update experienceZipsProvider for Azure (needed for upload processing)
      if (body.provider === 'AzureStorage') {
        await adminPool.query(sql`
          INSERT INTO systems (key, value)
          VALUES (${StorageProviderKey.ExperienceZipsProvider}, ${jsonValue}::jsonb)
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `);
      }

      // Reload the config in SystemContext
      await SystemContext.shared.loadProviderConfigs(adminPool);

      ctx.body = body;
      return next();
    }
  );

  router.delete(
    '/systems/storage-provider',
    koaGuard({
      status: [204],
    }),
    async (ctx, next) => {
      const adminPool = await EnvSet.sharedPool;

      await adminPool.query(sql`
        DELETE FROM systems WHERE key IN (
          ${StorageProviderKey.ExperienceBlobsProvider},
          ${StorageProviderKey.ExperienceZipsProvider}
        )
      `);

      // Reload the config in SystemContext
      await SystemContext.shared.loadProviderConfigs(adminPool);

      ctx.status = 204;
      return next();
    }
  );
}
