import { getSiteUrl } from '@/lib/supabaseClientConfig';

const FALLBACK_PORTAL_URL = 'https://portal.gegglobal.com';

export const generateReferralLink = (username: string | null | undefined): string => {
  if (!username) {
    return '';
  }

  let origin = FALLBACK_PORTAL_URL;

  try {
    origin = getSiteUrl();
  } catch (error) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      origin = window.location.origin;
    }
  }

  return `${origin}/signup?ref=${encodeURIComponent(username)}`;
};

export const formatReferralUsername = (raw: string): string => {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
};
