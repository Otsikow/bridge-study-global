import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FolderTree, UploadCloud } from "lucide-react";

const openZoe = (prompt: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

const AdminResources = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resource management</h1>
          <p className="text-sm text-muted-foreground">
            Curate and distribute content, training, and compliance assets across every audience.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => openZoe("Audit resource gaps for upcoming intake") }>
          <FolderTree className="h-4 w-4" />
          Audit resource library
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content operations</CardTitle>
          <CardDescription>Manage curated assets and publishing workflows.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            { label: "Playbooks", status: "Updated weekly" },
            { label: "Compliance", status: "In review" },
            { label: "Training", status: "Synced" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.label}</span>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{item.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.label === "Compliance" ? "Legal approvals pending" : "Ready for distribution"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Ingestion pipeline
          </CardTitle>
          <CardDescription>Automate ingestion of documents to Supabase storage with retention controls.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Coordinate with engineering on content tags, automated translations, and metadata standards for faster discovery.
          </p>
          <Separator />
          <Button onClick={() => openZoe("Generate tagging strategy recommendations for resources") }>
            Generate tagging recommendations
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResources;
