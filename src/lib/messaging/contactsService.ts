import { supabase } from "@/integrations/supabase/client";

export interface DirectoryProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
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
  userId: string,
  userRole: string
): Promise<DirectoryProfile[]> {
  try {
    if (userRole === 'agent') {
      // Get students linked to this agent
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', userId)
        .single();

      if (!agentData) return [];

      const { data: links } = await supabase
        .from('agent_student_links')
        .select(`
          student_id,
          students!inner(
            id,
            profile_id,
            profiles!inner(id, full_name, email, avatar_url)
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
          };
        })
        .filter((p: any): p is DirectoryProfile => p !== null);
    }

    // For other roles, return staff/admin profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('role', ['admin', 'staff'])
      .limit(50);

    return (profiles || []) as DirectoryProfile[];
  } catch (error) {
    console.error('Error fetching messaging contacts:', error);
    return [];
  }
}

export async function fetchMessagingContactIds(): Promise<string[]> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!profileData) return [];
    
    const contacts = await fetchMessagingContacts(userData.user.id, profileData.role);
    return contacts.map((contact) => contact.id);
  } catch (error) {
    console.error("Error fetching messaging contact IDs:", error);
    return [];
  }
}
