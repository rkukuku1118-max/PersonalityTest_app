import { useEffect } from "react";
import { AppHeader } from "./features/assessment/components/AppHeader";
import { DiagnosisScreen } from "./features/assessment/components/DiagnosisScreen";
import { HistoryScreen } from "./features/assessment/components/HistoryScreen";
import { ResultsScreen } from "./features/assessment/components/ResultsScreen";
import { useAssessment } from "./features/assessment/useAssessment";

function App() {
  const assessment = useAssessment();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [assessment.screen, assessment.activeTestId]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        メインコンテンツへ移動
      </a>
      <main className="workspace">
        <AppHeader
          activeTestId={assessment.activeTestId}
          currentScreen={assessment.screen}
          onSwitchTest={assessment.switchTest}
          historyCount={assessment.history.length}
          onShowHistory={assessment.showHistory}
        />
        <div id="main-content" tabIndex={-1}>
          {assessment.screen === "diagnosis" && <DiagnosisScreen assessment={assessment} />}
          {assessment.screen === "results" && <ResultsScreen assessment={assessment} />}
          {assessment.screen === "history" && <HistoryScreen assessment={assessment} />}
          {assessment.screen === "share-error" && (
            <section className="view share-error-view" aria-labelledby="share-error-heading">
              <span className="status-pill">共有リンクエラー</span>
              <h2 id="share-error-heading">
                この共有リンクは無効か、現在のバージョンでは表示できません。
              </h2>
              <p>リンクが途中で切れていないか、共有元にご確認ください。</p>
              <button
                type="button"
                className="button button--primary"
                onClick={assessment.startAssessmentFromShared}
              >
                自分の診断を始める
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
