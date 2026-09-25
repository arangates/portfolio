import { PageHeader } from "@/components/page-header";
import EvaluationSection from "@/components/evaluation-section";

export default function IntelligencePage() {
  return (
    <div className="@container/main">
      <PageHeader
        title="Proactive Intelligence"
        description="AI-driven financial evaluation and cross-domain alerts"
      />
      <div className="px-4 lg:px-6 mt-6">
        <EvaluationSection />
      </div>
    </div>
  );
}
