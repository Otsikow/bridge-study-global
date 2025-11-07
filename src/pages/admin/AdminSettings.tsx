import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
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
import {
  Database,
  Globe,
  KeyRound,
  Mail,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

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

const roleLabels: Record<RoleKey, string> = {
  admin: "Admin",
  staff: "Staff",
  agent: "Agent",
  university: "University",
};

const roleOrder: RoleKey[] = ["admin", "staff", "agent", "university"];

const permissionSeed = [
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
] satisfies Permission[];

const emailTemplateSeed = {
  onboarding: {
    name: "Onboarding welcome",
    description: "Sent immediately after a new partner or campus admin is provisioned.",
    subject: "Welcome to Bridge Global — getting started",
    body: "Hi {{first_name}},\n\nThanks for joining Bridge Global. Here’s your personalized launch checklist to activate admissions, marketing, and payments.\n\n— Bridge Global Team",
    sendAutomatically: true,
  },
  verification: {
    name: "Identity verification",
    description: "Used to confirm KYC/KYB verification steps with secure links.",
    subject: "Action required: verify your organization",
    body: "Hi {{first_name}},\n\nWe just need a final verification step to activate compliance workflows. Upload the requested documentation using the secure link below.\n\nNeed help? Reply and our risk team will assist within 2 business hours.",
    sendAutomatically: true,
  },
  payment: {
    name: "Payment confirmation",
    description: "Delivers proof of payment with ledger references and payout date.",
    subject: "Payment received — reference {{payment_reference}}",
    body: "Hi {{first_name}},\n\nWe’ve recorded your payment of {{amount}} for {{program_name}}. Funds will settle to the designated account on {{payout_date}}.\n\nTrack status anytime from your finance center.",
    sendAutomatically: true,
  },
} satisfies Record<EmailTemplateKey, EmailTemplate>;

const integrationSeed = [
  {
    id: "stripe",
    name: "Stripe",
    provider: "Payments & billing",
    environment: "Production" as const,
    apiKey: "sk_live_9Qp2R************",
    status: "Connected" as const,
    scopes: ["charges", "payouts", "customers"],
    lastRotated: "12 days ago",
  },
  {
    id: "supabase",
    name: "Supabase",
    provider: "Database & auth",
    environment: "Production" as const,
    apiKey: "sbp_live_z3K4a************",
    status: "Connected" as const,
    scopes: ["auth", "storage", "functions"],
    lastRotated: "30 days ago",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    provider: "Transactional email",
    environment: "Sandbox" as const,
    apiKey: "sg_test_V8Lm3************",
    status: "Action required" as const,
    scopes: ["mail.send", "marketing"],
    lastRotated: "Pending rotation",
  },
] satisfies Integration[];

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

const createInitialPermissions = () =>
  permissionSeed.map((permission) => ({
    ...permission,
    roles: { ...permission.roles },
  }));

const createInitialEmailTemplates = () =>
  Object.fromEntries(
    Object.entries(emailTemplateSeed).map(([key, template]) => [
      key,
      { ...template },
    ]),
  ) as Record<EmailTemplateKey, EmailTemplate>;

const createInitialIntegrations = () =>
  integrationSeed.map((integration) => ({
    ...integration,
    scopes: [...integration.scopes],
  }));

const createInitialLocalization = (): LocalizationSettings => ({
  primaryLanguage: "en",
  supportedLanguages: ["en", "fr", "es"],
  currency: "USD",
  fallbackCurrency: "USD",
});

const auditEntries = [
  {
    id: 1,
    actor: "Asha Patel",
    action: "Updated payment confirmation template",
    ipAddress: "192.168.10.8",
    timestamp: "2024-02-09 13:21 UTC",
  },
  {
    id: 2,
    actor: "Jordan Smith",
    action: "Rotated Stripe API key",
    ipAddress: "10.0.2.24",
    timestamp: "2024-02-08 22:04 UTC",
  },
  {
    id: 3,
    actor: "Global Automation Bot",
    action: "Auto-disabled inactive agent role",
    ipAddress: "Service",
    timestamp: "2024-02-08 18:44 UTC",
  },
  {
    id: 4,
    actor: "Mina Cho",
    action: "Exported compliance report",
    ipAddress: "172.16.4.19",
    timestamp: "2024-02-07 09:10 UTC",
  },
];

const openZoe = (prompt: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zoe:open-chat", { detail: { prompt } }));
};

const AdminSettings = () => {
  const [permissions, setPermissions] = useState<Permission[]>(createInitialPermissions);
  const [emailTemplates, setEmailTemplates] = useState<Record<EmailTemplateKey, EmailTemplate>>(createInitialEmailTemplates);
  const [integrations, setIntegrations] = useState<Integration[]>(createInitialIntegrations);
  const [localization, setLocalization] = useState<LocalizationSettings>(createInitialLocalization);
  const [autoBackups, setAutoBackups] = useState(true);
  const [backupStatus, setBackupStatus] = useState<"idle" | "running">("idle");
  const [lastBackupRun, setLastBackupRun] = useState("February 5, 2024 02:15 UTC");
  const { toast } = useToast();

  const updatePermission = (permissionId: string, role: RoleKey, value: boolean) => {
    setPermissions((prev) =>
      prev.map((permission) =>
        permission.id === permissionId
          ? { ...permission, roles: { ...permission.roles, [role]: value } }
          : permission,
      ),
    );
  };

  const handleEmailChange = (
    templateKey: EmailTemplateKey,
    field: keyof EmailTemplate,
    value: string | boolean,
  ) => {
    setEmailTemplates((prev) => ({
      ...prev,
      [templateKey]: {
        ...prev[templateKey],
        [field]: value,
      },
    }));
  };

  const handleIntegrationChange = (integrationId: string, value: string) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId ? { ...integration, apiKey: value } : integration,
      ),
    );
  };

  const rotateIntegration = (integration: Integration) => {
    const prefix = integration.apiKey.replace(/\*+$/, "").slice(0, 12) || `${integration.name.slice(0, 3)}_`;
    const randomToken = Math.random().toString(36).slice(-6).toUpperCase();

    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === integration.id
          ? {
              ...item,
              apiKey: `${prefix}${randomToken}************`,
              lastRotated: "Just now",
              status: "Connected",
            }
          : item,
      ),
    );

    toast({
      title: `${integration.name} key rotated`,
      description: "Remember to update dependent services with the regenerated credential.",
    });
  };

  const toggleLanguage = (code: string, enabled: boolean) => {
    setLocalization((prev) => {
      const nextSupported = enabled
        ? Array.from(new Set([...prev.supportedLanguages, code]))
        : prev.supportedLanguages.filter((language) => language !== code);

      return {
        ...prev,
        supportedLanguages: nextSupported.length ? nextSupported : [prev.primaryLanguage],
      };
    });
  };

  const handleBackup = () => {
    if (backupStatus === "running") return;

    setBackupStatus("running");
    toast({
      title: "Backup initiated",
      description: "A full snapshot is being generated in the background.",
    });

    setTimeout(() => {
      const timestamp = new Date().toLocaleString("en-US", {
        timeZone: "UTC",
        hour12: false,
      });
      setLastBackupRun(`${timestamp} UTC`);
      setBackupStatus("idle");
      toast({
        title: "Backup completed",
        description: "The latest snapshot is now available in the disaster recovery vault.",
      });
    }, 800);
  };

  const handleSave = () => {
    toast({
      title: "System settings saved",
      description: "Changes have been recorded across access controls and automation policies.",
    });
  };

  const handleReset = () => {
    setPermissions(createInitialPermissions());
    setEmailTemplates(createInitialEmailTemplates());
    setIntegrations(createInitialIntegrations());
    setLocalization(createInitialLocalization());
    setAutoBackups(true);
    setBackupStatus("idle");
    setLastBackupRun("February 5, 2024 02:15 UTC");
    toast({
      title: "Reverted changes",
      description: "All settings have been restored to their previous values.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure tenant-wide policies, integrations, and automation defaults.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => openZoe("Review security posture for settings changes")}
        >
          <ShieldCheck className="h-4 w-4" />
          Security review
        </Button>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roles & permissions
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email templates
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            API & integrations
          </TabsTrigger>
          <TabsTrigger value="localization" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Localization
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Audit & backups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Roles & permissions matrix
              </CardTitle>
              <CardDescription>
                Assign precise capabilities to each team role to keep governance aligned with your operating model.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Capability</TableHead>
                    {roleOrder.map((role) => (
                      <TableHead key={role} className="text-center">
                        {roleLabels[role]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium">{permission.label}</p>
                          <p className="text-sm text-muted-foreground">{permission.description}</p>
                        </div>
                      </TableCell>
                      {roleOrder.map((role) => (
                        <TableCell key={role} className="text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={permission.roles[role]}
                              onCheckedChange={(checked) =>
                                updatePermission(permission.id, role, Boolean(checked))
                              }
                              aria-label={`Toggle ${roleLabels[role]} access for ${permission.label}`}
                            />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Automated email templates
              </CardTitle>
              <CardDescription>
                Customize messaging for onboarding, verification, and payment confirmation workflows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-4">
                {(Object.keys(emailTemplates) as EmailTemplateKey[]).map((key) => {
                  const template = emailTemplates[key];
                  return (
                    <AccordionItem value={key} key={key} className="rounded-lg border">
                      <AccordionTrigger className="px-4 py-2 text-left">
                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:text-base">
                          <div>
                            <p className="font-medium leading-tight">{template.name}</p>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          <Badge variant={template.sendAutomatically ? "secondary" : "outline"}>
                            {template.sendAutomatically ? "Automated" : "Manual"}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 px-4 pb-4 pt-0">
                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                          <div>
                            <p className="font-medium">Send automatically</p>
                            <p className="text-sm text-muted-foreground">
                              Deliver this message as soon as its trigger conditions are met.
                            </p>
                          </div>
                          <Switch
                            checked={template.sendAutomatically}
                            onCheckedChange={(checked) =>
                              handleEmailChange(key, "sendAutomatically", Boolean(checked))
                            }
                            aria-label={`Toggle automation for ${template.name}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${key}-subject`}>Subject line</Label>
                          <Input
                            id={`${key}-subject`}
                            value={template.subject}
                            onChange={(event) => handleEmailChange(key, "subject", event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${key}-body`}>Message body</Label>
                          <Textarea
                            id={`${key}-body`}
                            rows={6}
                            value={template.body}
                            onChange={(event) => handleEmailChange(key, "body", event.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">
                            Tip: personalize with tokens like <code className="rounded bg-muted px-1">{`{{first_name}}`}</code> or
                            <code className="ml-1 rounded bg-muted px-1">{`{{program_name}}`}</code>.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                API keys & integrations
              </CardTitle>
              <CardDescription>
                Manage credentials for payments, data warehousing, and messaging platforms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-medium leading-tight">{integration.name}</p>
                      <Badge variant={integration.status === "Connected" ? "default" : "destructive"}>
                        {integration.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{integration.provider}</p>
                    <div className="flex flex-wrap gap-2">
                      {integration.scopes.map((scope) => (
                        <Badge key={scope} variant="outline">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Last rotated {integration.lastRotated}</p>
                  </div>
                  <div className="flex w-full flex-col gap-3 md:w-1/2">
                    <Label htmlFor={`${integration.id}-key`}>Active API key ({integration.environment})</Label>
                    <Input
                      id={`${integration.id}-key`}
                      type="password"
                      value={integration.apiKey}
                      onChange={(event) => handleIntegrationChange(integration.id, event.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleIntegrationChange(integration.id, "")}>
                        Clear key
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => rotateIntegration(integration)}
                      >
                        Rotate key
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Localization & currency
              </CardTitle>
              <CardDescription>
                Configure supported languages and currency defaults for campuses and partners.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primary-language">Default admin language</Label>
                  <Select
                    value={localization.primaryLanguage}
                    onValueChange={(value) =>
                      setLocalization((prev) => ({
                        ...prev,
                        primaryLanguage: value,
                        supportedLanguages: prev.supportedLanguages.includes(value)
                          ? prev.supportedLanguages
                          : [...prev.supportedLanguages, value],
                      }))
                    }
                  >
                    <SelectTrigger id="primary-language">
                      <SelectValue placeholder="Choose a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default settlement currency</Label>
                  <Select
                    value={localization.currency}
                    onValueChange={(value) =>
                      setLocalization((prev) => ({
                        ...prev,
                        currency: value,
                      }))
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                    Supported languages
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enable localized experiences for teams and recruiters in additional regions.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {availableLanguages.map((language) => {
                    const enabled = localization.supportedLanguages.includes(language.code);
                    const isDefault = localization.primaryLanguage === language.code;
                    return (
                      <div
                        key={language.code}
                        className="flex items-start justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium leading-tight">{language.label}</p>
                            {isDefault ? <Badge variant="secondary">Default</Badge> : null}
                          </div>
                          <p className="text-sm text-muted-foreground">{language.description}</p>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => toggleLanguage(language.code, Boolean(checked))}
                          aria-label={`Toggle ${language.label}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Audit logs & backups
              </CardTitle>
              <CardDescription>
                Trigger manual backups, monitor retention policies, and review recent activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">Automatic nightly backups</p>
                      <p className="text-sm text-muted-foreground">
                        Store encrypted snapshots for disaster recovery and compliance reporting.
                      </p>
                    </div>
                    <Switch
                      checked={autoBackups}
                      onCheckedChange={(checked) => setAutoBackups(Boolean(checked))}
                      aria-label="Toggle automatic backups"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Backups retained for 90 days in regionally redundant storage.
                  </p>
                </div>
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="font-medium">Manual backup</p>
                  <p className="text-sm text-muted-foreground">
                    Last completed {lastBackupRun}. Initiate a new snapshot when onboarding or before major changes.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleBackup} disabled={backupStatus === "running"}>
                      {backupStatus === "running" ? "Starting backup…" : "Trigger backup"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openZoe("Summarize the latest audit log anomalies")}
                    >
                      Ask Zoe to review
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Recent audit entries</h3>
                  <p className="text-sm text-muted-foreground">
                    Track sensitive configuration edits with actor, timestamp, and source IP details.
                  </p>
                </div>
                <ScrollArea className="h-64 rounded-lg border">
                  <div className="divide-y">
                    {auditEntries.map((entry) => (
                      <div key={entry.id} className="flex flex-col gap-1 p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{entry.actor}</span>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {entry.timestamp}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">Source: {entry.ipAddress}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </div>
  );
};

export default AdminSettings;
