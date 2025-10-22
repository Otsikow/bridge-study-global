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
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, attempting to create one...');
          await createProfileForUser(userId);
          // Try fetching again
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
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const createProfileForUser = async (userId: string) => {
    try {
      // Get user data from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get default tenant - try geg first, then any tenant
      let { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', 'geg')
        .single();

      if (!tenant) {
        // Fallback to any tenant
        const { data: anyTenant } = await supabase
          .from('tenants')
          .select('id')
          .limit(1)
          .single();
        tenant = anyTenant;
      }

      if (!tenant) {
        console.error('No tenant found - creating one');
        // Create a default tenant
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
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
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

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: user.user_metadata?.role || 'student',
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
      }

      // Create role-specific records
      const userRole = user.user_metadata?.role || 'student';
      if (userRole === 'student') {
        await supabase
          .from('students')
          .insert({
            tenant_id: tenant.id,
            profile_id: userId,
          });
      } else if (userRole === 'agent') {
        await supabase
          .from('agents')
          .insert({
            tenant_id: tenant.id,
            profile_id: userId,
          });
      }

      console.log('Profile created successfully for user:', userId);
    } catch (error) {
      console.error('Error creating profile for user:', error);
    }
  };

  useEffect(() => {
    // Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state change:', event, currentSession?.user?.id);
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Add a small delay to ensure the profile creation trigger has completed
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
      
      // If successful, the auth state change will handle profile fetching
      return { error: null };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error };
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
    } catch (error) {
      console.error('Sign up exception:', error);
      return { error };
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
    if (user) {
      await fetchProfile(user.id);
    }
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
