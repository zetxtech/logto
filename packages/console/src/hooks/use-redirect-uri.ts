import { ossConsolePath } from '@logto/schemas';
import { joinPath } from '@silverhand/essentials';
import { useMemo } from 'react';
import { useHref } from 'react-router-dom';

/**
 * The hook that returns the absolute URL for the sign-in or sign-out callback.
 * The path is not related to react-router, which means the path will also include
 * the basename of react-router if it's set.
 * Note: Always use OSS console path for redirect URI to ensure proper authentication.
 */
const useRedirectUri = (flow: 'signIn' | 'signOut' = 'signIn') => {
  const path = useHref(joinPath(ossConsolePath, flow === 'signIn' ? '/callback' : '/'));
  const url = useMemo(() => new URL(path, window.location.origin), [path]);

  return url;
};

export default useRedirectUri;
