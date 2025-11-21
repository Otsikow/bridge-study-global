import { supabase } from "@/integrations/supabase/client";

const DEFAULT_TENANT_ID = "default-tenant";

interface DirectoryProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  role?: string;
  tenant_id: string;
}

/**
 * Fetch messaging contacts based on user role and relationships
 * Simplified version using direct queries instead of RPC
 */
export async function fetchMessagingContacts(
  searchQuery?: string,
  limit: number = 50
): Promise<DirectoryProfile[]> {
  try {
    // Get the current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return [];
    }

    // Get user's profile and tenant
    const { data: profileData } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", userData.user.id)
      .single();

    if (!profileData) {
      return [];
    }

    // Build query for profiles in the same tenant
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role")
      .eq("tenant_id", profileData.tenant_id)
      .neq("id", userData.user.id) // Exclude self
      .limit(limit);

    // Add search filter if provided
    if (searchQuery && searchQuery.trim()) {
      query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching messaging contacts:", error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Transform to DirectoryProfile format
    const contacts: DirectoryProfile[] = data.map((contact: any) => ({
      id: contact.id,
      full_name: contact.full_name,
      email: contact.email,
      avatar_url: contact.avatar_url || '',
      role: contact.role,
      tenant_id: profileData.tenant_id,
    }));

    return contacts;
  } catch (error) {
    console.error("Error in fetchMessagingContacts:", error);
    return [];
  }
}

/**
 * Search for agents by name or email
 */
export async function searchAgentContacts(
  searchQuery: string,
  limit: number = 20
): Promise<DirectoryProfile[]> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return [];
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userData.user.id)
      .single();

    if (!profileData) {
      return [];
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role")
      .eq("tenant_id", profileData.tenant_id)
      .eq("role", "agent")
      .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .limit(limit);

    if (error) {
      console.error("Error searching agent contacts:", error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((contact: any) => ({
      id: contact.id,
      full_name: contact.full_name,
      email: contact.email,
      avatar_url: contact.avatar_url || '',
      role: contact.role,
      tenant_id: profileData.tenant_id,
    }));
  } catch (error) {
    console.error("Error in searchAgentContacts:", error);
    return [];
  }
}
