import { supabase } from '@/integrations/supabase/client';

export type AnalyticsEventName = 'visa_calculator_card_click' | (string & {});

interface AnalyticsEventOptions {
  source?: string;
  properties?: Record<string, unknown>;
  userId?: string | null;
}

export async function logAnalyticsEvent(
  eventName: AnalyticsEventName,
  options: AnalyticsEventOptions = {}
): Promise<void> {
  const { source = 'web', properties = {}, userId: providedUserId } = options;

  try {
    let userId = providedUserId ?? null;

    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }

    const augmentedProperties: Record<string, unknown> = {
      ...properties,
    };

    if (typeof window !== 'undefined' && !('path' in augmentedProperties)) {
      augmentedProperties.path = window.location.pathname;
    }

    const { error } = await supabase.from('analytics_events').insert({
      event_name: eventName,
      event_source: source,
      event_properties: augmentedProperties,
      user_id: userId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to log analytics event:', error);
    }
  }
}

export function logVisaCalculatorCardClick(variant: 'card' | 'cta_button'): void {
  void logAnalyticsEvent('visa_calculator_card_click', {
    source: 'landing_page',
    properties: { variant },
  });
}
