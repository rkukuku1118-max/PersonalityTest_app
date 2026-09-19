import { TESTS, type TestId } from "../../../data/tests";

const TEST_IDS: TestId[] = ["100", "60"];

type AppHeaderProps = {
  activeTestId: TestId;
  onSwitchTest: (testId: TestId) => void;
};

export function AppHeader({ activeTestId, onSwitchTest }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="app-header__eyebrow">HEXACO-PI-R self-report PoC</p>
        <h1>HEXACO性格テスト</h1>
      </div>
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
    </header>
  );
}
