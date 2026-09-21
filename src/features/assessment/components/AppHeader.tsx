import { TESTS, type TestId } from "../../../data/tests";
import type { AssessmentScreen } from "../types";

const TEST_IDS: TestId[] = ["100", "60"];

type AppHeaderProps = {
  activeTestId: TestId;
  currentScreen: AssessmentScreen;
  onSwitchTest: (testId: TestId) => void;
  historyCount: number;
  onShowHistory: () => void;
};

export function AppHeader({
  activeTestId,
  currentScreen,
  onSwitchTest,
  historyCount,
  onShowHistory,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-brand">
        <span className="app-brand__mark" aria-hidden="true">
          H
        </span>
        <div>
          <p className="app-header__eyebrow">HEXACO-PI-R self-report</p>
          <h1>HEXACO性格テスト</h1>
          <p className="app-header__tagline">自分の傾向を、数字とことばで見つける</p>
        </div>
      </div>
      <div className="app-header__actions">
        <button
          type="button"
          className={`history-link${currentScreen === "history" ? " is-active" : ""}`}
          onClick={onShowHistory}
          aria-current={currentScreen === "history" ? "page" : undefined}
        >
          診断履歴
          <span aria-label={`${historyCount}件の履歴`}>{historyCount}</span>
        </button>
        <div className="test-selector" aria-label="テスト種別">
          {TEST_IDS.map((testId) => (
            <button
              key={testId}
              className={testId === activeTestId ? "test-selector__option is-active" : "test-selector__option"}
              type="button"
              onClick={() => onSwitchTest(testId)}
              aria-pressed={testId === activeTestId && currentScreen !== "history"}
            >
              {TESTS[testId].label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
