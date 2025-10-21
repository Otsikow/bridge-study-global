import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image, Video, BookOpen, ExternalLink, type LucideIcon } from "lucide-react";
import ResourceLibrary from "@/components/ai/ResourceLibrary";

/**
 * ResourceHub Component
 * Combines ResourceLibrary from the AI module with the UI-ready card structure for flexibility.
 * Displays AI-sourced learning materials in a unified, styled layout.
 */

interface Resource {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "image" | "video" | "link";
  icon: LucideIcon;
  url: string;
  category: string;
}

export default function ResourceHub() {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle>Resource Hub</CardTitle>
          <CardDescription>
            Access curated educational materials, guides, and multimedia resources for agents and students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResourceLibrary />
        </CardContent>
      </Card>
    </div>
  );
}
