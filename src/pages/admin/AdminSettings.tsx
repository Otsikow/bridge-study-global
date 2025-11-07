import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings2, ShieldCheck, Palette } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

const openZoe = (prompt: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

const AdminSettings = () => {
  const { t } = useTranslation();
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [auditAlerts, setAuditAlerts] = useState(true);
  const [primaryColor, setPrimaryColor] = useState<string>("#2563eb");
  const [logoFileName, setLogoFileName] = useState<string>("");
  const [faviconFileName, setFaviconFileName] = useState<string>("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("admin.settings.heading", { defaultValue: "System settings" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.settings.subheading", {
              defaultValue: "Configure tenant-wide policies, integrations, and automation defaults.",
            })}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            openZoe(
              t("admin.settings.securityPrompt", {
                defaultValue: "Review security posture for settings changes",
              }),
            )
          }
        >
          <ShieldCheck className="h-4 w-4" />
          {t("admin.settings.securityReview", { defaultValue: "Security review" })}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            {t("admin.settings.accessControl.title", { defaultValue: "Access control" })}
          </CardTitle>
          <CardDescription>
            {t("admin.settings.accessControl.description", {
              defaultValue: "Govern authentication requirements and privileged role assignments.",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="mfa">
                {t("admin.settings.accessControl.mfa.label", {
                  defaultValue: "Enforce multi-factor authentication",
                })}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("admin.settings.accessControl.mfa.description", {
                  defaultValue: "Mandate MFA for every admin and finance user.",
                })}
              </p>
            </div>
            <Switch id="mfa" checked={mfaEnforced} onCheckedChange={setMfaEnforced} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="audit-alerts">
                {t("admin.settings.accessControl.auditAlerts.label", {
                  defaultValue: "Real-time audit alerts",
                })}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("admin.settings.accessControl.auditAlerts.description", {
                  defaultValue: "Send alerts when privileged settings change.",
                })}
              </p>
            </div>
            <Switch id="audit-alerts" checked={auditAlerts} onCheckedChange={setAuditAlerts} />
          </div>
          <Button
            onClick={() =>
              openZoe(
                t("admin.settings.accessControl.summarizePrompt", {
                  defaultValue: "Summarize recent configuration changes",
                }),
              )
            }
          >
            {t("admin.settings.accessControl.summarize", { defaultValue: "Summarize changes" })}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            {t("admin.settings.branding.title", { defaultValue: "Organization branding" })}
          </CardTitle>
          <CardDescription>
            {t("admin.settings.branding.description", {
              defaultValue: "Control the visual identity used across the admin experience.",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="brand-logo">
              {t("admin.settings.branding.logo.label", { defaultValue: "Upload logo" })}
            </Label>
            <Input
              id="brand-logo"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setLogoFileName(file?.name ?? "");
              }}
            />
            {logoFileName ? (
              <p className="text-xs text-muted-foreground">
                {t("admin.settings.branding.logo.selected", {
                  defaultValue: "Selected file: {{name}}",
                  name: logoFileName,
                })}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-color">
              {t("admin.settings.branding.color.label", { defaultValue: "Primary color" })}
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="brand-color"
                type="color"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="h-10 w-16 p-1"
              />
              <Input
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                aria-label={t("admin.settings.branding.color.aria", { defaultValue: "Primary color hex value" })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.settings.branding.color.helpText", {
                defaultValue: "Applies to buttons, highlights, and key interface accents.",
              })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-favicon">
              {t("admin.settings.branding.favicon.label", { defaultValue: "Upload favicon" })}
            </Label>
            <Input
              id="brand-favicon"
              type="file"
              accept="image/x-icon,image/png"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setFaviconFileName(file?.name ?? "");
              }}
            />
            {faviconFileName ? (
              <p className="text-xs text-muted-foreground">
                {t("admin.settings.branding.favicon.selected", {
                  defaultValue: "Selected file: {{name}}",
                  name: faviconFileName,
                })}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button>
              {t("admin.settings.branding.save", { defaultValue: "Save branding" })}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
