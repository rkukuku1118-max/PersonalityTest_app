import { useEffect, useMemo, useState } from "react";
import type { TestId } from "../../../data/tests";
import { createShareUrl } from "../shareUrl";
import type { DomainScore } from "../types";

type ShareLinkDialogProps = {
  testId: TestId;
  scores: DomainScore[];
  onClose: () => void;
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement("textarea");
    try {
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textArea.remove();
    }
  }
}

export function ShareLinkDialog({ testId, scores, onClose }: ShareLinkDialogProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const shareUrl = useMemo(() => {
    try {
      return { value: createShareUrl(window.location.href, testId, scores), error: null };
    } catch (error) {
      return {
        value: "",
        error: error instanceof Error ? error.message : "共有リンクを作成できませんでした。",
      };
    }
  }, [scores, testId]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function copyShareUrl() {
    if (!shareUrl.value) return;
    setCopyState((await copyText(shareUrl.value)) ? "copied" : "failed");
  }

  return (
    <div className="share-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="share-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="share-dialog__header">
          <div>
            <span>共有前の確認</span>
            <h3 id="share-dialog-heading">共有リンクを作る</h3>
          </div>
          <button
            type="button"
            className="share-dialog__close"
            onClick={onClose}
            aria-label="閉じる"
            autoFocus
          >
            ×
          </button>
        </div>

        <div className="share-dialog__notice">
          <p>
            このリンクには、あなたの性格因子と下位尺度のスコアが含まれます。質問への回答や氏名は含まれません。
          </p>
          <p>親しい人との個人チャットなどでの共有におすすめです。</p>
          <p>
            リンクを知っている人は結果を閲覧できるため、共有先をご確認のうえ、ご自身の判断でご利用ください。
          </p>
        </div>

        {shareUrl.error ? (
          <p className="share-dialog__error" role="alert">
            {shareUrl.error}
          </p>
        ) : (
          <label className="share-dialog__url">
            <span>作成される共有リンク</span>
            <input type="text" readOnly value={shareUrl.value} onFocus={(event) => event.currentTarget.select()} />
          </label>
        )}

        <div className="share-dialog__actions">
          <button type="button" className="button button--secondary" onClick={onClose}>
            キャンセル
          </button>
          <button
            type="button"
            className="button button--primary"
            disabled={!shareUrl.value}
            onClick={copyShareUrl}
          >
            共有リンクをコピー
          </button>
        </div>

        <div className="share-dialog__status" aria-live="polite">
          {copyState === "copied" && (
            <p>共有リンクをコピーしました。共有先をご確認のうえご利用ください。</p>
          )}
          {copyState === "failed" && (
            <p className="share-dialog__error" role="alert">
              コピーできませんでした。上のリンクを選択してコピーしてください。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
