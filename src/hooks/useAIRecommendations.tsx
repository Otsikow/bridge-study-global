import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecommendationParams {
  interests?: string;
  preferredCountries?: string[];
  budget?: number;
  currentLevel?: string;
  targetLevel?: string;
}

export function useAIRecommendations() {
  const [recommendations, setRecommendations] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getRecommendations = async (params: RecommendationParams) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-recommendations", {
        body: params,
      });

      if (error) throw error;

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to get AI recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { recommendations, loading, getRecommendations };
}
