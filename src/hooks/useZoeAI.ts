import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { marked } from "marked";
import DOMPurify from "dompurify";

export interface ZoePromptPayload {
  prompt: string;
  context?: Record<string, unknown>;
}

export interface ZoeStructuredAnswer {
  answer: string;
  markdown: string;
  metadata?: Record<string, unknown>;
}

const formatMarkdown = (content: string): string => {
  const parsed = marked.parse(content ?? "");
  return typeof parsed === "string" ? parsed : "";
};

export const useZoeAI = () => {
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ prompt, context }: ZoePromptPayload): Promise<ZoeStructuredAnswer> => {
      const { data, error } = await supabase.functions.invoke("zoe-staff-prompt", {
        body: {
          prompt,
          context: {
            tenantId: profile?.tenant_id,
            userId: profile?.id,
            role: profile?.role,
            ...context,
          },
        },
      });

      if (error) throw error;

      const answer = data?.answer ?? "";
      const markdown = DOMPurify.sanitize(formatMarkdown(answer));

      return {
        answer,
        markdown,
        metadata: data?.metadata ?? {},
      } satisfies ZoeStructuredAnswer;
    },
  });
};

export const useZoePromptLibrary = () =>
  useMemo(
    () => [
      {
        id: "risk-audit",
        label: "Which students are at risk this week?",
        prompt: "List students at risk of missing document submissions this week with owner and blocker.",
      },
      {
        id: "deadline",
        label: "Applications near deadlines",
        prompt: "Show applications within 7 days of deadline requiring action.",
      },
      {
        id: "agent-performance",
        label: "Top performing agents",
        prompt: "Summarize agents exceeding conversion targets this month.",
      },
      {
        id: "next-best",
        label: "Next best actions",
        prompt: "Recommend next best actions for my staff queue today.",
      },
    ],
    [],
  );

