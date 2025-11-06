import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { logFailedAuthentication } from '@/lib/securityLogger';
import { formatReferralUsername } from '@/lib/referrals';

type SignupRole = 'student' | 'agent' | 'partner' | 'admin' | 'staff';

interface Profile {
  id: string;
  tenant_id: string;
  role:
    | 'student'
    | 'agent'
    | 'partner'
    | 'staff'
    | 'admin'
    | 'counselor'
    | 'verifier'
    | 'finance'
    | 'school_rep';
  full_name: string;
  email: string;
  phone?: string;
  country?: string;
  avatar_url?: string;
  onboarded: boolean;
  username: string;
  referrer_id?: string | null;
  referred_by?: string | null;
}

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  role?: SignupRole;
  phone?: string;
  country?: string;
  username: string;
  referrerId?: string;
  referrerUsername?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (params: SignUpParams) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);

        // If profile not found, create and retry
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new one...');
          await createProfileForUser(userId);

          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (retryError) {
            console.error('Retry failed creating profile:', retryError);
            setProfile(null);
          } else {
            setProfile(retryData);
          }
        } else {
          setProfile(null);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setProfile(null);
    }
  };

  const createProfileForUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const rawUsername = typeof user.user_metadata?.username === 'string'
        ? user.user_metadata.username
        : undefined;
      let username = rawUsername ? formatReferralUsername(rawUsername) : '';
      if (!username) {
        username = `user_${userId.slice(0, 12)}`;
      }

      const { data: existingUsername } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .maybeSingle();

      if (existingUsername) {
        username = `${username}_${userId.slice(0, 6)}`;
      }

      let referrerProfileId: string | null = null;
      let referrerUsername: string | null = null;

      if (typeof user.user_metadata?.referrer_id === 'string') {
        referrerProfileId = user.user_metadata.referrer_id;
      }

      if (referrerProfileId) {
        const { data: refProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', referrerProfileId)
          .maybeSingle();
        referrerUsername = refProfile?.username ?? null;
      } else if (typeof user.user_metadata?.referrer_username === 'string') {
        const normalizedReferrer = user.user_metadata.referrer_username.trim().toLowerCase();
        if (normalizedReferrer) {
          const { data: referrerProfile } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('username', normalizedReferrer)
            .maybeSingle();
          referrerProfileId = referrerProfile?.id ?? null;
          referrerUsername = referrerProfile?.username ?? normalizedReferrer;
        }
      }

      let { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', 'geg')
        .single();

      if (!tenant) {
        const { data: fallbackTenant } = await supabase
          .from('tenants')
          .select('id')
          .limit(1)
          .single();
        tenant = fallbackTenant;
      }

      if (!tenant) {
        console.error('No tenant found, creating default tenant...');
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: 'Default Tenant',
            slug: 'default',
            email_from: 'noreply@example.com',
            active: true,
          })
          .select()
          .single();

        if (tenantError) {
          console.error('Error creating tenant:', tenantError);
          return;
        }

        tenant = newTenant;
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        tenant_id: tenant.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'User',
        role: user.user_metadata?.role || 'student',
        phone: user.user_metadata?.phone || '',
        country: user.user_metadata?.country || '',
        username,
        referrer_id: referrerProfileId,
        referred_by: referrerUsername,
        onboarded: false,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return;
      }

      const role = user.user_metadata?.role || 'student';
      if (role === 'student') {
        await supabase.from('students').insert({
          tenant_id: tenant.id,
          profile_id: userId,
        });
      } else if (role === 'agent') {
        await supabase.from('agents').insert({
          tenant_id: tenant.id,
          profile_id: userId,
          username,
        });
      }

      console.log('Profile created successfully for user:', userId);
    } catch (err) {
      console.error('Error creating profile for user:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let lastUserId: string | undefined = undefined;

    const handleAuthChange = async (session: Session | null) => {
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      const currentUserId = currentUser?.id;

      setUser(currentUser);
      setSession(session);

      if (currentUser && !currentUser.email_confirmed_at) {
        console.info('User email address is not verified yet. Redirecting to verification gate.');
        setProfile(null);
        return;
      }

      // Fetch profile only if user has changed
      if (currentUserId && currentUserId !== lastUserId) {
        await fetchProfile(currentUserId);
      } else if (!currentUserId) {
        setProfile(null);
      }

      lastUserId = currentUserId;
    };

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleAuthChange(session);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Initial check
    init();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // The event SIGNED_IN is already handled by the initial check.
        // TOKEN_REFRESHED should not re-trigger profile fetching unless needed.
        // The event SIGNED_IN is already handled by the initial check.
        // TOKEN_REFRESHED should not re-trigger profile fetching unless needed.
        if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          handleAuthChange(session);
        } else if (event === 'SIGNED_IN') {
          // Only handle SIGNED_IN if the user is different, to prevent double-fetch on load
          if (session?.user?.id !== lastUserId) {
            handleAuthChange(session);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Handle token refresh, which could be for a different user
          if (session?.user?.id !== lastUserId) {
            handleAuthChange(session);
          } else if (isMounted) {
            // If same user, just update the session
            setSession(session);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign-in error:', error);
        void logFailedAuthentication(email, error.message ?? 'Unknown sign-in error', {
          code: (error as any)?.code,
          status: (error as any)?.status,
          name: error.name,
        });
        return { error };
      }

      if (data?.user && !data.user.email_confirmed_at) {
        console.warn('Sign-in blocked: email address is not verified yet.');
        await supabase.auth.signOut();
        return {
          error: new Error('Please verify your email before signing in.'),
        };
      }

      console.log('Sign-in successful:', data);
      return { error: null };
    } catch (err) {
      console.error('Sign-in exception:', err);
      const reason = err instanceof Error ? err.message : 'Unexpected sign-in error';
      void logFailedAuthentication(email, reason, {
        isException: true,
      });
      return { error: err };
    }
  };

    const signUp = async ({
      email,
      password,
      fullName,
      role = 'student',
      phone,
      country,
      username,
      referrerId,
      referrerUsername,
    }: SignUpParams) => {
      try {
        const redirectUrl = `${window.location.origin}/auth/callback`;

        const sanitizedUsername = formatReferralUsername(username);

        const metadata: Record<string, string> = {
          full_name: fullName,
          role,
          phone: phone || '',
          country: country || '',
          username: sanitizedUsername || `user_${crypto.randomUUID().slice(0, 12)}`,
        };

        if (referrerUsername) {
          metadata.referrer_username = referrerUsername;
        }

        if (referrerId) {
          metadata.referrer_id = referrerId;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: metadata,
          },
        });

        if (error) {
          console.error('Sign-up error:', error);
          return { error };
        }

        console.log('Sign-up successful. Verification email sent:', data);
        return { error: null };
      } catch (err) {
        console.error('Sign-up exception:', err);
        return { error: err };
      }
    };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    navigate('/auth/login');
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
