// scripts/seed-training-resources.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'scripts/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Key is not defined in .env file");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const NEW_TRAINING_RESOURCES = [
    {
      title: "GEG Admissions Workflow Training Guide",
      description: "A comprehensive guide detailing the step-by-step admissions workflow for agents. This document covers everything from initial application submission to final decision.",
      resource_type: "training",
      file_type: "pdf",
      access_level: "agents",
      storage_path: "training/geg-admissions-workflow-guide.pdf",
      file_name: "GEG_Admissions_Workflow_Guide.pdf",
      file_extension: "pdf",
      file_size: 1200000,
    },
    {
      title: "Agent Onboarding Training",
      description: "An engaging video tutorial to help new agents get started with the GEG platform. The training covers key features and best practices for success.",
      resource_type: "training",
      file_type: "video",
      access_level: "agents",
      storage_path: "training/agent-onboarding-training.mp4",
      file_name: "Agent_Onboarding_Training.mp4",
      file_extension: "mp4",
      file_size: 25000000,
    },
    {
      title: "Using Supabase Dashboard",
      description: "A practical guide for agents on how to effectively use the Supabase dashboard. Learn how to track student progress and manage applications.",
      resource_type: "training",
      file_type: "doc",
      access_level: "agents",
      storage_path: "training/using-supabase-dashboard-guide.docx",
      file_name: "Using_Supabase_Dashboard_Guide.docx",
      file_extension: "docx",
      file_size: 500000,
    },
    {
      title: "AI Tools for Student Recruitment",
      description: "A slide deck showcasing the latest AI tools that can help agents streamline their recruitment process. Discover how to work smarter, not harder.",
      resource_type: "training",
      file_type: "presentation",
      access_level: "agents",
      storage_path: "training/ai-tools-for-recruitment-slides.pptx",
      file_name: "AI_Tools_for_Student_Recruitment.pptx",
      file_extension: "pptx",
      file_size: 5000000,
    },
  ];

async function seedData() {
    console.log("Seeding training resources...");

    const { data, error } = await supabase
      .from('resource_library')
      .insert(NEW_TRAINING_RESOURCES);

    if (error) {
      console.error('Error seeding data:', error);
    } else {
      console.log('Successfully seeded training resources:', data);
    }
  }

  seedData();
