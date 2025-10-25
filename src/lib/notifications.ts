import { supabase } from '@/integrations/supabase/client';

export interface CreateNotificationParams {
  userId: string;
  tenantId: string;
  type: 'application_status' | 'message' | 'commission' | 'course_recommendation' | 'general';
  title: string;
  content: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
}

/**
 * Create a custom notification for a user
 * 
 * @example
 * ```typescript
 * await createNotification({
 *   userId: user.id,
 *   tenantId: tenant.id,
 *   type: 'general',
 *   title: 'Welcome!',
 *   content: 'Welcome to the platform!',
 *   actionUrl: '/dashboard'
 * });
 * ```
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, tenantId, type, title, content, metadata = {}, actionUrl } = params;

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        type,
        title,
        content,
        metadata,
        action_url: actionUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
}

/**
 * Send a course recommendation notification to a student
 * This calls the database function that handles all the logic
 * 
 * @example
 * ```typescript
 * await sendCourseRecommendation(
 *   'student-uuid',
 *   'program-uuid',
 *   'This program matches your academic profile'
 * );
 * ```
 */
export async function sendCourseRecommendation(
  studentId: string,
  programId: string,
  reason?: string
) {
  try {
    const { data, error } = await supabase.rpc('notify_course_recommendation', {
      p_student_id: studentId,
      p_program_id: programId,
      p_reason: reason,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error sending course recommendation:', error);
    return { data: null, error };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { error };
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { error };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { error };
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Notification type helpers for better type safety
 */
export const NotificationTypes = {
  APPLICATION_STATUS: 'application_status' as const,
  MESSAGE: 'message' as const,
  COMMISSION: 'commission' as const,
  COURSE_RECOMMENDATION: 'course_recommendation' as const,
  GENERAL: 'general' as const,
};

/**
 * Helper to create application status notification
 */
export async function notifyApplicationStatus(
  userId: string,
  tenantId: string,
  programName: string,
  universityName: string,
  newStatus: string,
  actionUrl = '/student/applications'
) {
  return createNotification({
    userId,
    tenantId,
    type: NotificationTypes.APPLICATION_STATUS,
    title: 'Application Status Updated',
    content: `Your application to ${programName} at ${universityName} is now ${newStatus}.`,
    metadata: { programName, universityName, status: newStatus },
    actionUrl,
  });
}

/**
 * Helper to create message notification
 */
export async function notifyNewMessage(
  userId: string,
  tenantId: string,
  senderName: string,
  messagePreview?: string,
  actionUrl = '/student/messages'
) {
  return createNotification({
    userId,
    tenantId,
    type: NotificationTypes.MESSAGE,
    title: 'New Message',
    content: messagePreview 
      ? `${senderName}: ${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}`
      : `${senderName} sent you a message.`,
    metadata: { senderName },
    actionUrl,
  });
}

/**
 * Helper to create commission notification
 */
export async function notifyCommission(
  userId: string,
  tenantId: string,
  amount: number,
  currency: string,
  status: 'approved' | 'paid',
  actionUrl = '/dashboard/commissions'
) {
  const statusText = status === 'paid' ? 'paid' : 'approved';
  return createNotification({
    userId,
    tenantId,
    type: NotificationTypes.COMMISSION,
    title: `Commission ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
    content: `Your commission of ${amount.toFixed(2)} ${currency} has been ${statusText}.`,
    metadata: { amount, currency, status },
    actionUrl,
  });
}
