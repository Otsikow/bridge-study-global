import UserFeedback from "@/components/analytics/UserFeedback";
import { SEO } from "@/components/SEO";

export default function FeedbackPage() {
  return (
    <>
      <SEO
        title="Feedback - Global Education Gateway"
        description="Share your feedback to help us improve the Global Education Gateway platform. We value your input on our services for students, agents, and universities."
        keywords="feedback, platform improvement, user suggestions, contact us, student recruitment platform feedback"
      />
      <UserFeedback />
    </>
  );
}
