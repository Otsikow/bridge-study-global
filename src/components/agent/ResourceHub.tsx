import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image, Video, BookOpen, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'image' | 'video' | 'link';
  icon: any;
  url: string;
  category: string;
}

export default function ResourceHub() {
  const resources: Resource[] = [
    {
      id: '1',
      title: 'Agent Handbook',
      description: 'Complete guide to recruitment best practices',
      type: 'pdf',
      icon: FileText,
      url: '#',
      category: 'Guides',
    },
    {
      id: '2',
      title: 'University Brochures',
      description: 'Marketing materials for partner universities',
      type: 'pdf',
      icon: BookOpen,
      url: '#',
      category: 'Marketing',
    },
    {
      id: '3',
      title: 'Social Media Graphics',
      description: 'Ready-to-use images for social promotion',
      type: 'image',
      icon: Image,
      url: '#',
      category: 'Marketing',
    },
    {
      id: '4',
      title: 'Training Videos',
      description: 'Video tutorials on using the platform',
      type: 'video',
      icon: Video,
      url: '#',
      category: 'Training',
    },
    {
      id: '5',
      title: 'Application Templates',
      description: 'Sample documents and checklists',
      type: 'pdf',
      icon: FileText,
      url: '#',
      category: 'Resources',
    },
    {
      id: '6',
      title: 'Partner Portal',
      description: 'Access partner university portals',
      type: 'link',
      icon: ExternalLink,
      url: '#',
      category: 'Links',
    },
  ];

  const categories = [...new Set(resources.map(r => r.category))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resource Hub</CardTitle>
          <CardDescription>
            Access marketing materials, guides, and tools to help you recruit students
          </CardDescription>
        </CardHeader>
      </Card>

      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resources
                .filter((r) => r.category === category)
                .map((resource) => {
                  const Icon = resource.icon;
                  return (
                    <div
                      key={resource.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{resource.title}</h4>
                          <p className="text-xs text-muted-foreground">{resource.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        {resource.type === 'link' ? (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
