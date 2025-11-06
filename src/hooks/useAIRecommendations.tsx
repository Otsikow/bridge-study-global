import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UniversityRanking {
  world_rank?: number;
  [key: string]: unknown;
}

export interface ProgramRecommendation {
  id: string;
  name: string;
  level: string;
  discipline: string;
  tuition_amount: number;
  tuition_currency: string;
  duration_months: number;
  match_score: number;
  match_reasons: string[];
  university: {
    name: string;
    city: string;
    country: string;
    ranking?: UniversityRanking;
  };
  entry_requirements: unknown;
  ielts_overall?: number;
  toefl_overall?: number;
}

export interface StudentProfile {
  academic_scores: {
    gpa?: number;
    ielts?: number;
    toefl?: number;
    gre?: number;
    gmat?: number;
  };
  preferences: {
    countries: string[];
    budget_range: [number, number];
    program_level: string[];
    disciplines: string[];
  };
  education_history: Record<string, unknown>;
}

export const useAIRecommendations = () => {
  const [recommendations, setRecommendations] = useState<ProgramRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const generateRecommendations = async (profile: StudentProfile) => {
    setLoading(true);
    setError(null);

    try {
      // Get student's current applications to avoid duplicates
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      const { data: existingApps } = studentData ? await supabase
        .from('applications')
        .select('program_id')
        .eq('student_id', studentData.id) : { data: [] };

      const appliedProgramIds = existingApps?.map(app => app.program_id) || [];

      // Fetch all active programs
      let query = supabase
        .from('programs')
        .select(`
          id,
          name,
          level,
          discipline,
          tuition_amount,
          tuition_currency,
          duration_months,
          entry_requirements,
          ielts_overall,
          toefl_overall,
          university:universities (
            name,
            city,
            country,
            ranking
          )
        `)
        .eq('active', true);

      // Exclude programs the student already applied to (guard empty list)
      if (appliedProgramIds.length > 0) {
        const list = appliedProgramIds.map((id) => `'${id}'`).join(',');
        query = query.not('id', 'in', `(${list})`);
      }

      const { data: programs, error: programsError } = await query;

      if (programsError) throw programsError;

      // AI matching algorithm
      const scoredPrograms = programs?.map(program => {
        let score = 0;
        const reasons: string[] = [];

        // Country preference matching (40% weight)
        if (profile.preferences.countries.includes(program.university.country)) {
          score += 40;
          reasons.push(`Matches your preferred country: ${program.university.country}`);
        }

        // Program level matching (20% weight)
        if (profile.preferences.program_level.includes(program.level)) {
          score += 20;
          reasons.push(`Matches your preferred level: ${program.level}`);
        }

        // Discipline matching (20% weight)
        if (profile.preferences.disciplines.some(d => 
          program.discipline.toLowerCase().includes(d.toLowerCase()) ||
          d.toLowerCase().includes(program.discipline.toLowerCase())
        )) {
          score += 20;
          reasons.push(`Matches your field of interest: ${program.discipline}`);
        }

        // Budget matching (10% weight)
        const [minBudget, maxBudget] = profile.preferences.budget_range;
        if (program.tuition_amount >= minBudget && program.tuition_amount <= maxBudget) {
          score += 10;
          reasons.push(`Fits your budget range`);
        }

        // Academic requirements matching (10% weight)
        if (profile.academic_scores.ielts && program.ielts_overall) {
          if (profile.academic_scores.ielts >= program.ielts_overall) {
            score += 5;
            reasons.push(`Meets IELTS requirements`);
          }
        }

        if (profile.academic_scores.toefl && program.toefl_overall) {
          if (profile.academic_scores.toefl >= program.toefl_overall) {
            score += 5;
            reasons.push(`Meets TOEFL requirements`);
          }
        }

        // University ranking bonus
        const ranking = program.university.ranking as UniversityRanking | undefined;
        if (ranking && typeof ranking.world_rank === 'number' && ranking.world_rank <= 100) {
          score += 5;
          reasons.push(`Top-ranked university`);
        }

        return {
          ...program,
          university: {
            ...program.university,
            ranking: program.university.ranking as UniversityRanking | undefined
          },
          match_score: Math.min(score, 100),
          match_reasons: reasons
        };
      }) || [];

      // Sort by match score and return top 10
      const sortedPrograms = scoredPrograms
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 10);

      setRecommendations(sortedPrograms);
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getVisaEligibility = async (country: string, profile: StudentProfile) => {
    // Simple visa eligibility estimation based on common factors
    let eligibility: 'High' | 'Medium' | 'Low' = 'Medium';
    const factors: string[] = [];

    // Academic performance
    if (profile.academic_scores.gpa && profile.academic_scores.gpa >= 3.5) {
      factors.push('Strong academic record');
    }

    // Language proficiency
    if (profile.academic_scores.ielts && profile.academic_scores.ielts >= 7.0) {
      factors.push('Excellent English proficiency');
    }

    // Financial capacity
    const [minBudget, maxBudget] = profile.preferences.budget_range;
    if (maxBudget >= 50000) {
      factors.push('Strong financial capacity');
    }

    // Country-specific factors
    switch (country.toLowerCase()) {
      case 'canada':
        if (profile.academic_scores.ielts && profile.academic_scores.ielts >= 6.5) {
          eligibility = 'High';
          factors.push('Meets Canadian language requirements');
        }
        break;
      case 'united kingdom':
      case 'uk':
        if (profile.academic_scores.ielts && profile.academic_scores.ielts >= 6.0) {
          eligibility = 'High';
          factors.push('Meets UK language requirements');
        }
        break;
      case 'australia':
        if (profile.academic_scores.ielts && profile.academic_scores.ielts >= 6.0) {
          eligibility = 'High';
          factors.push('Meets Australian language requirements');
        }
        break;
    }

    return {
      eligibility,
      factors,
      percentage: eligibility === 'High' ? 85 : eligibility === 'Medium' ? 65 : 45
    };
  };

  return {
    recommendations,
    loading,
    error,
    generateRecommendations,
    getVisaEligibility
  };
};