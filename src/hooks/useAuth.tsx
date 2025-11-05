import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: SignupRole,
    phone?: string,
    country?: string
  ) => Promise<{ error: unknown }>;
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

      // Try to find the default tenant
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

      // If still no tenant, create a default one
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

      // Create user profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        tenant_id: tenant.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'User',
        role: user.user_metadata?.role || 'student',
        phone: user.user_metadata?.phone || '',
        country: user.user_metadata?.country || '',
        onboarded: false,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return;
      }

      // Role-based record creation
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
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          handleAuthChange(session);
        } else if (event === 'TOKEN_REFRESHED') {
          if (session?.user?.id !== lastUserId) {
             handleAuthChange(session);
          } else {
             // If the user ID is the same, we might not need to do anything,
             // or just update the session without re-fetching the profile.
             if (isMounted) setSession(session);
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
        return { error };
      }

      console.log('Sign-in successful:', data);
      return { error: null };
    } catch (err) {
      console.error('Sign-in exception:', err);
      return { error: err };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: SignupRole = 'student',
    phone?: string,
    country?: string
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role,
            phone: phone || '',
            country: country || '',
          },
        },
      });

      if (error) {
        console.error('Sign-up error:', error);
        return { error };
      }

      console.log('Sign-up successful:', data);
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
