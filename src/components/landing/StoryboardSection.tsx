import {
    Compass,
    ClipboardList,
    MessageCircle,
    Radar,
    PlaneTakeoff,
  } from "lucide-react";
  import { Card, CardContent } from "@/components/ui/card";
  import storyboardDiscover from "@/assets/university-buildings.png";
  import storyboardPlan from "@/assets/university-application.png";
  import storyboardCollaborate from "@/assets/agent-student-consulting.png";
  import storyboardTrack from "@/assets/student-journey-steps.png";
  import storyboardCelebrate from "@/assets/student-airport-travel.png";

  const storyboardSteps = [
      {
        title: "Discover Your Best-Fit Programs",
        description:
          "Tell us your goals and academics, and GEG instantly curates universities, programs, and scholarships that match.",
        support:
          "Smart filters and AI-powered recommendations remove the guesswork so you can shortlist confident choices in minutes.",
        icon: Compass,
        image: storyboardDiscover,
        imageAlt: "Student reviewing university programs on a campus tour",
      },
      {
        title: "Build a Personalized Application Plan",
        description:
          "Upload transcripts, test scores, and statements with guided checklists that break everything into manageable tasks.",
        support:
          "Auto-reminders and document tips keep you organized and ahead of every deadline.",
        icon: ClipboardList,
        image: storyboardPlan,
        imageAlt: "Student planning application tasks on a laptop outdoors",
      },
      {
        title: "Collaborate with Your Expert Agent",
        description:
          "Work side-by-side with a verified GEG advisor to polish documents, align on timelines, and stay interview ready.",
        support:
          "Shared workspaces, annotated feedback, and instant messaging keep every decision transparent and stress-free.",
        icon: MessageCircle,
        image: storyboardCollaborate,
        imageAlt: "Student connecting with an education agent using a mobile phone",
      },
      {
        title: "Submit & Track Without Stress",
        description:
          "Apply to multiple universities at once and follow every review, request, and offer from one simple timeline.",
        support:
          "Live status indicators and proactive nudges flag the next action so nothing slips through the cracks.",
        icon: Radar,
        image: storyboardTrack,
        imageAlt: "Student checking application progress while walking on campus",
      },
      {
        title: "Celebrate & Prepare for Departure",
        description:
          "Accept your offer, finalize visa steps, and access pre-departure resources tailored to your destination.",
        support:
          "Visa checklists, housing guidance, and enrollment confirmations keep you on track right up to takeoff.",
        icon: PlaneTakeoff,
        image: storyboardCelebrate,
        imageAlt: "Student celebrating visa approval with documents in hand",
      },
    ];

  export const StoryboardSection = () => {
      return (
          <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h2 className="text-4xl font-bold">How GEG Simplifies Every Step</h2>
              <p className="text-muted-foreground">
                Follow the storyboard to see exactly how our platform and people guide your application from idea to arrival.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
              {storyboardSteps.map((scene, index) => (
                <div key={scene.title} className="group relative">
                  {index < storyboardSteps.length - 1 && (
                    <div
                      className="hidden lg:block absolute right-[-18px] top-1/2 h-px w-10 bg-primary/20"
                      aria-hidden="true"
                    />
                  )}
                  <Card className="h-full border-primary/20 transition-all duration-300 group-hover:border-primary group-hover:shadow-xl group-hover:-translate-y-2">
                    <CardContent className="flex h-full flex-col gap-5 p-6 text-center">
                      <div className="relative w-full overflow-hidden rounded-xl shadow-lg ring-1 ring-primary/10">
                        <img
                          src={scene.image}
                          alt={scene.imageAlt}
                          className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      </div>
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        Step {index + 1}
                      </div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-110">
                        <scene.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">{scene.title}</h3>
                        <p className="text-sm text-muted-foreground">{scene.description}</p>
                      </div>
                      <div className="mt-auto w-full rounded-lg bg-background/70 p-3 text-sm font-medium text-primary shadow-inner">
                        {scene.support}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>
      )
  }