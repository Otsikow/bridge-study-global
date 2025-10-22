import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

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
    role?: string
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

        // If profile doesn't exist, create it and refetch
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating...');
          await createProfileForUser(userId);

          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (retryError) {
            console.error('Failed to create profile:', retryError);
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

      // Try to get the default tenant (e.g., 'geg')
      let { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', 'geg')
        .single();

      if (!tenant) {
        // Fallback: fetch any tenant
        const { data: anyTenant } = await supabase
          .from('tenants')
          .select('id')
          .limit(1)
          .single();
        tenant = anyTenant;
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

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        tenant_id: tenant.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'User',
        role: user.user_metadata?.role || 'student',
        onboarded: false,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return;
      }

      // Create user role record
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: user.user_metadata?.role || 'student',
      });

      if (roleError) {
        console.error('Error creating user role:', roleError);
      }

      // Role-specific record creation
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state change:', event, currentSession?.user?.id);

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Delay to allow Supabase triggers to complete
        setTimeout(async () => {
          await fetchProfile(currentSession.user.id);
        }, 1000);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error('Sign in exception:', err);
      return { error: err };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: string = 'student'
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
            role: role,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }

      console.log('Sign up successful:', data);
      return { error: null };
    } catch (err) {
      console.error('Sign up exception:', err);
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
