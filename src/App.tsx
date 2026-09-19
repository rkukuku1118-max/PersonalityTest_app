import { useEffect } from "react";
import { AppHeader } from "./features/assessment/components/AppHeader";
import { DiagnosisScreen } from "./features/assessment/components/DiagnosisScreen";
import { ResultsScreen } from "./features/assessment/components/ResultsScreen";
import { useAssessment } from "./features/assessment/useAssessment";

function App() {
  const assessment = useAssessment();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [assessment.screen, assessment.activeTestId]);

  return (
    <main className="app-shell">
      <section className="workspace">
        <AppHeader activeTestId={assessment.activeTestId} onSwitchTest={assessment.switchTest} />
        {assessment.screen === "diagnosis" ? (
          <DiagnosisScreen assessment={assessment} />
        ) : (
          <ResultsScreen assessment={assessment} />
        )}
      </section>
    </main>
  );
}

export default App;
