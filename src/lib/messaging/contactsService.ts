import { supabase } from "@/integrations/supabase/client";
import type { DirectoryProfile } from "./directory";
import { DEFAULT_TENANT_ID } from "./data";

export interface MessagingContact {
  profile_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: DirectoryProfile["role"];
  contact_type: string;
  headline?: string | null;
}

/**
 * Fetches messaging contacts from the database based on the current user's role
 * @param searchQuery Optional search query to filter contacts
 * @param limit Maximum number of contacts to return
 * @returns Array of messaging contacts
 */
export async function fetchMessagingContacts(
  searchQuery?: string,
  limit: number = 50
): Promise<DirectoryProfile[]> {
  try {
    const { data, error } = await supabase.rpc("get_messaging_contacts", {
      p_search: searchQuery || null,
      p_limit: limit,
    });

    if (error) {
      console.error("Error fetching messaging contacts:", error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Get the current user's tenant_id
    const { data: userData } = await supabase.auth.getUser();
    let tenantId = DEFAULT_TENANT_ID;

    if (userData?.user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", userData.user.id)
        .single();

      if (profileData?.tenant_id) {
        tenantId = profileData.tenant_id;
      }
    }

    // Transform database results to DirectoryProfile format
    const contacts: DirectoryProfile[] = data.map((contact: MessagingContact) => ({
      id: contact.profile_id,
      full_name: contact.full_name,
      email: contact.email,
      avatar_url: contact.avatar_url,
      role: contact.role,
      headline: contact.headline || undefined,
      tenant_id: tenantId,
    }));

    return contacts;
  } catch (error) {
    console.error("Error in fetchMessagingContacts:", error);
    return [];
  }
}

/**
 * Gets the list of user IDs that the current user can message
 * @returns Array of user IDs
 */
export async function fetchMessagingContactIds(): Promise<string[]> {
  try {
    const contacts = await fetchMessagingContacts("", 200);
    return contacts.map((contact) => contact.id);
  } catch (error) {
    console.error("Error fetching messaging contact IDs:", error);
    return [];
  }
}
