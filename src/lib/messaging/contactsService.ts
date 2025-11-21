import { supabase } from "@/integrations/supabase/client";

export interface DirectoryProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: 'student' | 'agent' | 'partner' | 'staff' | 'admin' | 'counselor' | 'verifier' | 'finance' | 'school_rep';
  tenant_id: string;
  headline?: string;
}

export interface StudentContact {
  student_id: string;
  application_count: number;
  student: {
    profile_id: string;
    profile: DirectoryProfile;
  };
}

export async function fetchMessagingContacts(
  query?: string,
  limit?: number
): Promise<DirectoryProfile[]> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', userData.user.id)
      .single();

    if (!profileData) return [];

    if (profileData.role === 'agent') {
      // Get students linked to this agent
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', userData.user.id)
        .single();

      if (!agentData) return [];

      const { data: links } = await supabase
        .from('agent_student_links')
        .select(`
          student_id,
          students!inner(
            id,
            profile_id,
            profiles!inner(id, full_name, email, avatar_url, role, tenant_id)
          )
        `)
        .eq('agent_id', agentData.id);

      if (!links) return [];

      // Transform the data
      return links
        .map((link: any) => {
          const student = link.students;
          if (!student?.profiles) return null;
          return {
            id: student.profiles.id,
            full_name: student.profiles.full_name,
            email: student.profiles.email,
            avatar_url: student.profiles.avatar_url,
            role: student.profiles.role,
            tenant_id: student.profiles.tenant_id,
          };
        })
        .filter((p: any): p is DirectoryProfile => p !== null);
    }

    // For other roles, return staff/admin profiles
    let queryBuilder = supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, tenant_id')
      .in('role', ['admin', 'staff'])
      .eq('tenant_id', profileData.tenant_id);

    if (query) {
      queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
    }

    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const { data: profiles } = await queryBuilder;

    return (profiles || []) as DirectoryProfile[];
  } catch (error) {
    console.error('Error fetching messaging contacts:', error);
    return [];
  }
}

export async function fetchMessagingContactIds(): Promise<string[]> {
  try {
    const contacts = await fetchMessagingContacts();
    return contacts.map((contact) => contact.id);
  } catch (error) {
    console.error("Error fetching messaging contact IDs:", error);
    return [];
  }
}
