import { TESTS, type TestId } from "../../../data/tests";

const TEST_IDS: TestId[] = ["100", "60"];

type AppHeaderProps = {
  activeTestId: TestId;
  onSwitchTest: (testId: TestId) => void;
  historyCount: number;
  onShowHistory: () => void;
};

export function AppHeader({ activeTestId, onSwitchTest, historyCount, onShowHistory }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="app-header__eyebrow">HEXACO-PI-R self-report PoC</p>
        <h1>HEXACO性格テスト</h1>
      </div>
      <div className="app-header__actions">
        <button type="button" className="history-link" onClick={onShowHistory}>
          診断履歴
          <span aria-label={`${historyCount}件`}>{historyCount}</span>
        </button>
        <div className="test-selector" aria-label="テスト種別">
          {TEST_IDS.map((testId) => (
            <button
              key={testId}
              className={testId === activeTestId ? "test-selector__option is-active" : "test-selector__option"}
              type="button"
              onClick={() => onSwitchTest(testId)}
            >
              {TESTS[testId].label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
