import { useState } from 'react';
import { MAX_BYTES } from '../domain/parser';
import { Btn, ErrorNotice, Steps, TopBar, useHeadingFocus } from './common';

const PLACEHOLDER = `09/10/26, 18:02 - Sam: could we do 4?
09/10/26, 18:05 - Priya: …`;

export const FORMAT_EXAMPLES = [
  ['WhatsApp (Android style)', '09/10/26, 18:02 - Sam: could we do 4?'],
  ['WhatsApp (iOS style)', '[09/10/26, 18:02:11] Sam: could we do 4?'],
  ['Name and message, no dates', 'Sam: could we do 4?'],
  ['Time in brackets, or ISO date', '[18:02] Sam: could we do 4?\n2026-10-09 18:02 Sam: could we do 4?'],
];

interface Props {
  initialText: string;
  fileName?: string;
  /** Returns an error message to show on S1, or null when the text can continue. */
  onReview: (text: string, source: 'paste' | 'file', fileName?: string) => string | null;
  skipFocus: boolean;
  notice?: string | null;
}

export function Import({ initialText, fileName, onReview, skipFocus, notice }: Props) {
  const [text, setText] = useState(initialText);
  const [source, setSource] = useState<'paste' | 'file'>(fileName ? 'file' : 'paste');
  const [name, setName] = useState<string | undefined>(fileName);
  const [error, setError] = useState<string | null>(null);
  const heading = useHeadingFocus(skipFocus);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError(`That file is ${(file.size / 1048576).toFixed(1)} MB. Relay reads files up to 2 MB. Choose a smaller export or trim it.`);
      return;
    }
    if (!/\.txt$/i.test(file.name) && file.type && !file.type.startsWith('text/')) {
      setError('Choose a plain-text .txt export. This file is not a text file.');
      return;
    }
    const content = await file.text();
    if (content.includes('\u0000') || (content.match(/\uFFFD/g)?.length ?? 0) > 5) {
      setError("We couldn't read that file as text. Choose a .txt export, or paste the chat instead.");
      return;
    }
    setText(content);
    setSource('file');
    setName(file.name);
  }

  const reason = text.trim() ? null : 'Paste or choose a chat to continue.';

  return (
    <>
      <TopBar />
      <main className="sheet" id="main">
        <Steps current={1} />
        <h1 ref={heading} tabIndex={-1} className="headline">
          What did you miss?
        </h1>
        <p className="lede">
          Paste the chat you&apos;ve been away from. Relay finds what&apos;s changed, what&apos;s yours to do, and the messages that say so.
        </p>
        <div className="stack" style={{ marginTop: 'var(--s-5)' }}>
          {notice && (
            <p className="small muted" role="status">
              {notice}
            </p>
          )}
          <label className="field">
            <span>Chat text</span>
            <textarea
              value={text}
              placeholder={PLACEHOLDER}
              spellCheck={false}
              onChange={(e) => {
                setText(e.target.value);
                setSource('paste');
                setName(undefined);
                setError(null);
              }}
            />
          </label>
          {error && <ErrorNotice id="s1-error">{error}</ErrorNotice>}
          <div className="row s1-actions">
            <Btn
              primary
              className="block-sm"
              reason={reason}
              onClick={() => {
                const e = onReview(text, source, name);
                setError(e);
              }}
            >
              Review messages
            </Btn>
            <label className="small">
              Or choose a .txt export{' '}
              <input type="file" accept=".txt,text/plain" onChange={(e) => void onFile(e.target.files?.[0])} />
            </label>
          </div>
          {name && <p className="small muted">Loaded file: {name}</p>}
          <p className="small muted">
            Your chat is processed in this browser. It is not uploaded. The AI model (about 2.2 GB on first use, measured once on one laptop) downloads from its public host. You choose the text and where you stopped reading; Relay cannot see your chat app&apos;s unread state.
          </p>
          <details>
            <summary>Supported formats</summary>
            <p className="small muted">Shapes Relay can read. These are format examples, not sample chats.</p>
            {FORMAT_EXAMPLES.map(([label, ex]) => (
              <div key={label}>
                <p className="small">{label}</p>
                <pre className="mono">{ex}</pre>
              </div>
            ))}
          </details>
        </div>
      </main>
    </>
  );
}
