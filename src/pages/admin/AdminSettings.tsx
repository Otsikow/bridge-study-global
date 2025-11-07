"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import {
  Database,
  Globe,
  KeyRound,
  Mail,
  Settings2,
  ShieldCheck,
  Users,
  Palette,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

/* -------------------------------------------------------------------------- */
/* ✅ Zoe Helper                                                              */
/* -------------------------------------------------------------------------- */
const openZoe = (prompt: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

/* -------------------------------------------------------------------------- */
/* ✅ Seed Data                                                               */
/* -------------------------------------------------------------------------- */
type RoleKey = "admin" | "staff" | "agent" | "university";

type Permission = {
  id: string;
  label: string;
  description: string;
  roles: Record<RoleKey, boolean>;
};

type EmailTemplateKey = "onboarding" | "verification" | "payment";

type EmailTemplate = {
  name: string;
  description: string;
  subject: string;
  body: string;
  sendAutomatically: boolean;
};

type Integration = {
  id: string;
  name: string;
  provider: string;
  environment: "Production" | "Sandbox";
  apiKey: string;
  status: "Connected" | "Action required";
  scopes: string[];
  lastRotated: string;
};

type LocalizationSettings = {
  primaryLanguage: string;
  supportedLanguages: string[];
  currency: string;
  fallbackCurrency: string;
};

/* -------------------------------------------------------------------------- */
/* ✅ Initial Data Generators                                                 */
/* -------------------------------------------------------------------------- */
const roleLabels: Record<RoleKey, string> = {
  admin: "Admin",
  staff: "Staff",
  agent: "Agent",
  university: "University",
};

const roleOrder: RoleKey[] = ["admin", "staff", "agent", "university"];

const permissionSeed: Permission[] = [
  {
    id: "manage-users",
    label: "User management",
    description: "Create, suspend, and invite new platform users across teams.",
    roles: { admin: true, staff: true, agent: false, university: false },
  },
  {
    id: "workflow-automation",
    label: "Workflow automation",
    description: "Configure lifecycle automations, reminders, and checklist templates.",
    roles: { admin: true, staff: true, agent: true, university: false },
  },
  {
    id: "finance-ledger",
    label: "Finance & payouts",
    description: "Issue invoices, approve partner disbursements, and manage escrow.",
    roles: { admin: true, staff: false, agent: true, university: true },
  },
  {
    id: "content-governance",
    label: "Content governance",
    description: "Publish program updates, announcements, and compliance notices.",
    roles: { admin: true, staff: true, agent: true, university: true },
  },
  {
    id: "data-export",
    label: "Data export",
    description: "Download student rosters, performance metrics, and compliance logs.",
    roles: { admin: true, staff: true, agent: false, university: true },
  },
];

const emailTemplateSeed: Record<EmailTemplateKey, EmailTemplate> = {
  onboarding: {
    name: "Onboarding welcome",
    description: "Sent immediately after a new partner or campus admin is provisioned.",
    subject: "Welcome to Global Education Gateway — getting started",
    body: "Hi {{first_name}},\n\nThanks for joining Global Education Gateway. Here’s your launch checklist to activate admissions and finance tools.\n\n— GEG Team",
    sendAutomatically: true,
  },
  verification: {
    name: "Identity verification",
    description: "Used to confirm KYC/KYB verification steps with secure links.",
    subject: "Action required: verify your organization",
    body: "Hi {{first_name}},\n\nWe just need a final verification step to activate compliance workflows. Upload the requested documentation below.",
    sendAutomatically: true,
  },
  payment: {
    name: "Payment confirmation",
    description: "Delivers proof of payment with ledger references and payout date.",
    subject: "Payment received — reference {{payment_reference}}",
    body: "Hi {{first_name}},\n\nWe’ve recorded your payment of {{amount}} for {{program_name}}. Funds will settle by {{payout_date}}.",
    sendAutomatically: true,
  },
};

const integrationSeed: Integration[] = [
  {
    id: "stripe",
    name: "Stripe",
    provider: "Payments & billing",
    environment: "Production",
    apiKey: "sk_live_9Qp2R************",
    status: "Connected",
    scopes: ["charges", "payouts", "customers"],
    lastRotated: "12 days ago",
  },
  {
    id: "supabase",
    name: "Supabase",
    provider: "Database & auth",
    environment: "Production",
    apiKey: "sbp_live_z3K4a************",
    status: "Connected",
    scopes: ["auth", "storage", "functions"],
    lastRotated: "30 days ago",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    provider: "Transactional email",
    environment: "Sandbox",
    apiKey: "sg_test_V8Lm3************",
    status: "Action required",
    scopes: ["mail.send", "marketing"],
    lastRotated: "Pending rotation",
  },
];

const availableLanguages = [
  { code: "en", label: "English (US)", description: "Default language for the global admin team." },
  { code: "fr", label: "French", description: "Localized messaging for EU-based partners." },
  { code: "es", label: "Spanish", description: "Support for Latin America recruiters." },
  { code: "de", label: "German", description: "DACH region universities and agents." },
  { code: "hi", label: "Hindi", description: "Enable campaigns in the India subcontinent." },
];

const currencyOptions = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "INR", label: "INR — Indian Rupee" },
];

const createInitialLocalization = (): LocalizationSettings => ({
  primaryLanguage: "en",
  supportedLanguages: ["en", "fr", "es"],
  currency: "USD",
  fallbackCurrency: "USD",
});

/* -------------------------------------------------------------------------- */
/* ✅ Component                                                               */
/* -------------------------------------------------------------------------- */
const AdminSettings = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [permissions, setPermissions] = useState<Permission[]>(permissionSeed);
  const [emailTemplates, setEmailTemplates] = useState<Record<EmailTemplateKey, EmailTemplate>>(emailTemplateSeed);
  const [integrations, setIntegrations] = useState<Integration[]>(integrationSeed);
  const [localization, setLocalization] = useState<LocalizationSettings>(createInitialLocalization);
  const [autoBackups, setAutoBackups] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [logoFileName, setLogoFileName] = useState("");
  const [faviconFileName, setFaviconFileName] = useState("");

  /* ---------------------------------------------------------------------- */
  /* ✅ Handlers                                                             */
  /* ---------------------------------------------------------------------- */
  const handleBackup = () => {
    toast({
      title: t("admin.settings.backup.started", { defaultValue: "Backup initiated" }),
      description: t("admin.settings.backup.desc", { defaultValue: "System snapshot is being created in the background." }),
    });
  };

  const handleSave = () => {
    toast({
      title: t("admin.settings.saved", { defaultValue: "Settings saved" }),
      description: t("admin.settings.savedDesc", { defaultValue: "Your changes have been successfully saved." }),
    });
  };

  /* ---------------------------------------------------------------------- */
  /* ✅ Render                                                               */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("admin.settings.heading", { defaultValue: "System settings" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.settings.subheading", {
              defaultValue: "Configure branding, governance, integrations, and localization.",
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

      {/* Branding Section */}
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
          <div>
            <Label>{t("admin.settings.branding.logo.label", { defaultValue: "Upload logo" })}</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFileName(e.target.files?.[0]?.name ?? "")}
            />
            {logoFileName && <p className="text-xs text-muted-foreground">{`Selected: ${logoFileName}`}</p>}
          </div>
          <div>
            <Label>{t("admin.settings.branding.color.label", { defaultValue: "Primary color" })}</Label>
            <div className="flex gap-3">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-16 p-1"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t("admin.settings.branding.favicon.label", { defaultValue: "Upload favicon" })}</Label>
            <Input
              type="file"
              accept="image/x-icon,image/png"
              onChange={(e) => setFaviconFileName(e.target.files?.[0]?.name ?? "")}
            />
            {faviconFileName && <p className="text-xs text-muted-foreground">{`Selected: ${faviconFileName}`}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Roles, Emails, Integrations, Localization, Audit */}
      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
          <TabsTrigger value="roles">
            <Users className="mr-2 h-4 w-4" /> Roles
          </TabsTrigger>
          <TabsTrigger value="emails">
            <Mail className="mr-2 h-4 w-4" /> Emails
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <KeyRound className="mr-2 h-4 w-4" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="localization">
            <Globe className="mr-2 h-4 w-4" /> Localization
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Database className="mr-2 h-4 w-4" /> Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("admin.settings.roles.title", { defaultValue: "Roles & Permissions" })}
              </CardTitle>
              <CardDescription>
                {t("admin.settings.roles.description", {
                  defaultValue: "Control access levels for all user categories.",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Capability</TableHead>
                    {roleOrder.map((r) => (
                      <TableHead key={r}>{roleLabels[r]}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell>{perm.label}</TableCell>
                      {roleOrder.map((r) => (
                        <TableCell key={r}>
                          <Checkbox checked={perm.roles[r]} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Recovery</CardTitle>
              <CardDescription>Manage automated and manual backups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label>Automatic backups</Label>
                <Switch checked={autoBackups} onCheckedChange={setAutoBackups} />
              </div>
              <Separator className="my-4" />
              <Button onClick={handleBackup}>Trigger Manual Backup</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button variant="outline">{t("common.reset", { defaultValue: "Reset" })}</Button>
        <Button onClick={handleSave}>{t("common.saveChanges", { defaultValue: "Save Changes" })}</Button>
      </div>
    </div>
  );
};

export default AdminSettings;
