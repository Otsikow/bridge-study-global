export const generateReferralLink = (username: string | null | undefined): string => {
  if (!username) {
    return '';
  }

  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://portal.gegglobal.com';

  return `${origin}/signup?ref=${encodeURIComponent(username)}`;
};

export const formatReferralUsername = (raw: string): string => {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
};
