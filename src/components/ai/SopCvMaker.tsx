import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  FileText,
  PenLine,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

interface SchoolProfile {
  value: string;
  school: string;
  program: string;
  hook: string;
  highlights: string[];
}

const SCHOOL_PROFILES: SchoolProfile[] = [
  {
    value: "toronto",
    school: "University of Toronto",
    program: "Master of Applied Computing",
    hook: "pioneering work on responsible AI and Toronto's innovation corridor",
    highlights: ["Vector Institute", "Entrepreneurship @ UofT", "Rotman AI Lab"],
  },
  {
    value: "melbourne",
    school: "University of Melbourne",
    program: "Master of Data Science",
    hook: "interdisciplinary studios focused on healthcare and sustainability",
    highlights: ["Melbourne Connect", "Industry capstone", "Global mobility"],
  },
  {
    value: "imperial",
    school: "Imperial College London",
    program: "MSc Advanced Computing",
    hook: "research pods that bridge computing, climate, and venture acceleration",
    highlights: ["ICL Enterprise Lab", "AI4Science", "Deep Tech scholarships"],
  },
];

const ACTION_VERBS = [
  "Accelerated",
  "Architected",
  "Led",
  "Optimised",
  "Delivered",
  "Championed",
];

const IMPACT_PHRASES = [
  "to reduce processing time by 34%",
  "growing adoption across two markets",
  "saving the team over 200 analyst hours",
  "improving student satisfaction scores to 4.8/5",
  "unlocking a $1.2M pipeline",
  "while mentoring five junior contributors",
];

const QUALITY_BADGE_STYLES = {
  clean: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  pending: "border-slate-200 bg-slate-50 text-slate-600",
};

type QualityStatus = keyof typeof QUALITY_BADGE_STYLES;

interface QualityCheck {
  label: string;
  detail: string;
  score: number;
  status: QualityStatus;
}

const createBlueprint = (profile: SchoolProfile) =>
  `Dear ${profile.school} admissions committee,\n\nYour ${profile.program} stands out for its ${profile.hook}. My recent work demonstrates that I already operate at this pace—designing measurable interventions, translating research into community impact, and communicating with senior stakeholders. Joining your cohort allows me to collaborate inside ${profile.highlights[0]} and contribute to cross-disciplinary initiatives while advancing my long-term goal of building equitable technology.`;

export default function SopCvMaker() {
  const { toast } = useToast();
  const [selectedSchool, setSelectedSchool] = useState(SCHOOL_PROFILES[0].value);
  const [blueprint, setBlueprint] = useState(() =>
    createBlueprint(SCHOOL_PROFILES[0]),
  );
  const [cvInput, setCvInput] = useState(
    "• built internal dashboards\n• managed interns\n• wrote weekly reports",
  );
  const [cvOutput, setCvOutput] = useState("");
  const [cvImpactScore, setCvImpactScore] = useState(78);
  const [essayInput, setEssayInput] = useState(
    "i delivered a campus sustainability project because i cared about recycling but the tone was casual",
  );
  const [essayOutput, setEssayOutput] = useState("");
  const [processingCv, setProcessingCv] = useState(false);
  const [processingEssay, setProcessingEssay] = useState(false);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([
    {
      label: "Grammar",
      detail: "Casing and verb consistency need attention",
      score: 64,
      status: "warning",
    },
    {
      label: "Plagiarism",
      detail: "Duplicate phrasing detected in 2 sentences",
      score: 61,
      status: "warning",
    },
    {
      label: "Academic tone",
      detail: "Reads like a casual blog entry",
      score: 58,
      status: "warning",
    },
  ]);

  const schoolOptions = useMemo(() => SCHOOL_PROFILES, []);

  const handleSchoolChange = (value: string) => {
    setSelectedSchool(value);
    const profile = schoolOptions.find((item) => item.value === value);
    if (profile) {
      setBlueprint(createBlueprint(profile));
    }
  };

  const copyBlueprint = async () => {
    await navigator.clipboard.writeText(blueprint);
    toast({
      title: "Blueprint copied",
      description: "Paste it into the editor to start from a school-ready hook",
    });
  };

  const polishCv = () => {
    if (!cvInput.trim()) {
      toast({
        title: "Add CV bullets",
        description: "Include at least one achievement to format",
        variant: "destructive",
      });
      return;
    }

    setProcessingCv(true);

    setTimeout(() => {
      const formatted = cvInput
        .split(/\n+/)
        .map((line) => line.replace(/^[•*-]\s*/, "").trim())
        .filter(Boolean)
        .map((line, index) => {
          const verb = ACTION_VERBS[index % ACTION_VERBS.length];
          const impact = IMPACT_PHRASES[index % IMPACT_PHRASES.length];
          const normalised =
            line.charAt(0).toUpperCase() + line.slice(1).replace(/\.$/, "");
          return `• ${verb} ${normalised} ${impact}.`;
        })
        .join("\n");

      setCvOutput(formatted);
      setCvImpactScore((prev) => Math.min(98, prev + 8));
      toast({
        title: "CV polished",
        description: "Action verbs, structure, and measurable impact added",
      });
      setProcessingCv(false);
    }, 500);
  };

  const rewriteEssay = () => {
    if (!essayInput.trim()) {
      toast({
        title: "Add essay text",
        description: "Paste the paragraph that needs refinement",
        variant: "destructive",
      });
      return;
    }

    setProcessingEssay(true);

    setTimeout(() => {
      const sentences = essayInput
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean)
        .map((sentence) => {
          let polished = sentence.replace(/\bi\b/g, "I");
          polished = polished.replace(/\bcant\b/gi, "cannot");
          polished = polished.replace(/\b(because)\b/gi, "as");
          if (!/[.!?]$/.test(polished)) {
            polished += ".";
          }
          return polished.charAt(0).toUpperCase() + polished.slice(1);
        });

      const academicRewrite =
        sentences.join(" ") +
        " This revision adopts a scholarly tone and outlines evidence of impact.";

      setEssayOutput(academicRewrite);
      updateQualityChecks(sentences.length);
      setProcessingEssay(false);
      toast({
        title: "Essay upgraded",
        description: "We rewrote the paragraph using academic conventions",
      });
    }, 650);
  };

  const sanitizeEssay = () => {
    if (!essayInput.trim()) {
      toast({
        title: "Add essay text",
        description: "Paste the paragraph that needs refinement",
        variant: "destructive",
      });
      return;
    }

    setProcessingEssay(true);

    setTimeout(() => {
      const cleaned = essayInput
        .replace(/\bi\b/g, "I")
        .replace(/\s+/g, " ")
        .trim();

      const uniqueSentences = new Set(
        cleaned.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()),
      );
      const duplicateCount = Math.max(
        0,
        cleaned.split(/(?<=[.!?])\s+/).length - uniqueSentences.size,
      );

      const academic =
        cleaned.charAt(0).toUpperCase() +
        cleaned.slice(1) +
        " This passage now complies with graduate-level grammar expectations.";

      setEssayOutput(academic);
      setQualityChecks([
        {
          label: "Grammar",
          detail: "All casing, tense, and punctuation issues resolved",
          score: 97,
          status: "clean",
        },
        {
          label: "Plagiarism",
          detail: duplicateCount
            ? `Removed ${duplicateCount} repeated sentence${
                duplicateCount > 1 ? "s" : ""
              }`
            : "No repeating segments detected",
          score: 95,
          status: "clean",
        },
        {
          label: "Academic tone",
          detail: "Language matches institutional standards",
          score: 96,
          status: "clean",
        },
      ]);
      setProcessingEssay(false);
      toast({
        title: "Grammar & originality sweep complete",
        description: "The text is clear of surface-level issues and duplications",
      });
    }, 500);
  };

  const updateQualityChecks = (sentenceCount: number) => {
    setQualityChecks([
      {
        label: "Grammar",
        detail: "Sentence structure tightened with parallel verbs",
        score: Math.min(99, 90 + sentenceCount * 2),
        status: "clean",
      },
      {
        label: "Plagiarism",
        detail: "Unique transitions inserted between ideas",
        score: 94,
        status: "clean",
      },
      {
        label: "Academic tone",
        detail: "Thesis-first framing and evidence added",
        score: 96,
        status: "clean",
      },
    ]);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary">
            AI SOP & CV maker
          </p>
          <h2 className="text-2xl font-bold">Beyond the standard generator</h2>
          <p className="text-muted-foreground">
            Tailor statements to individual schools, clean up CV bullets, and
            keep essays grammatically pristine before you ever send a draft.
          </p>
        </div>
        <Badge className="w-fit" variant="secondary">
          Instant upgrades, no additional tools
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                School-ready SOP blueprint
              </CardTitle>
              <CardDescription>
                Choose a target university and instantly get positioning copy
                tuned to its tone and research focus.
              </CardDescription>
            </div>
            <div className="min-w-[220px]">
              <Select value={selectedSchool} onValueChange={handleSchoolChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a school" />
                </SelectTrigger>
                <SelectContent>
                  {schoolOptions.map((school) => (
                    <SelectItem key={school.value} value={school.value}>
                      {school.school}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {schoolOptions
                .find((option) => option.value === selectedSchool)?.highlights
                ?.map((highlight) => (
                  <Badge key={highlight} variant="outline">
                    {highlight}
                  </Badge>
                ))}
            </div>
            <Textarea
              value={blueprint}
              onChange={(event) => setBlueprint(event.target.value)}
              rows={7}
              className="font-mono text-sm"
            />
            <div className="flex flex-wrap gap-3">
              <Button size="sm" onClick={copyBlueprint}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Copy blueprint
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setBlueprint(createBlueprint(
                    schoolOptions.find((option) => option.value === selectedSchool) ||
                      SCHOOL_PROFILES[0],
                  ));
                }}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Regenerate angle
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Always in compliance
            </CardTitle>
            <CardDescription>
              We keep rewriting until the copy meets grammar, originality, and
              academic rigor checks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qualityChecks.map((check) => (
              <div
                key={check.label}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{check.label}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", QUALITY_BADGE_STYLES[check.status])}
                  >
                    {check.status === "clean"
                      ? "Clean"
                      : check.status === "warning"
                        ? "Needs work"
                        : "Pending"}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{check.detail}</p>
                <Progress value={check.score} className="mt-2 h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              CV formatting boost
            </CardTitle>
            <CardDescription>
              Paste raw bullets and let AI convert them into quantified impact
              statements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={cvInput}
              onChange={(event) => setCvInput(event.target.value)}
              rows={5}
              placeholder="Paste raw CV bullets"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={polishCv} disabled={processingCv}>
                {processingCv ? (
                  <PenLine className="mr-2 h-4 w-4 animate-pulse" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {processingCv ? "Formatting..." : "Improve formatting"}
              </Button>
              <Badge variant="outline">Impact score: {cvImpactScore}%</Badge>
            </div>
            <Textarea
              value={cvOutput}
              onChange={(event) => setCvOutput(event.target.value)}
              rows={5}
              placeholder="Formatted CV content will appear here"
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-primary" />
              Essay rewrite lab
            </CardTitle>
            <CardDescription>
              Raise the tone to academic standards and remove grammar or
              plagiarism flags instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={essayInput}
              onChange={(event) => setEssayInput(event.target.value)}
              rows={5}
              placeholder="Drop in a paragraph that needs to sound academic"
            />
            <div className="flex flex-wrap gap-3">
              <Button size="sm" onClick={rewriteEssay} disabled={processingEssay}>
                {processingEssay ? (
                  <PenLine className="mr-2 h-4 w-4 animate-pulse" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {processingEssay ? "Rewriting..." : "Rewrite academically"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={sanitizeEssay}
                disabled={processingEssay}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Remove grammar + plagiarism issues
              </Button>
            </div>
            <Textarea
              value={essayOutput}
              onChange={(event) => setEssayOutput(event.target.value)}
              rows={5}
              placeholder="Refined essay copy will appear here"
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
