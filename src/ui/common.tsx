import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

/** Focus the screen heading after a step change (not on first load). */
export function useHeadingFocus(skip = false) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!skip) ref.current?.focus();
  }, [skip]);
  return ref;
}

interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  small?: boolean;
  link?: boolean;
  /** When set the control is disabled, stays focusable, and shows this written reason. */
  reason?: string | null;
  className?: string;
  type?: 'button' | 'submit';
  'aria-label'?: string;
}

/** Disabled-but-focusable button whose visible reason is associated with aria-describedby. */
export function Btn({ children, onClick, primary, small, link, reason, className = '', type = 'button', ...rest }: BtnProps) {
  const id = useId();
  const disabled = !!reason;
  return (
    <>
      <button
        type={type}
        className={`btn ${primary ? 'primary' : ''} ${small ? 'small' : ''} ${link ? 'link' : ''} ${className}`}
        aria-disabled={disabled || undefined}
        aria-describedby={disabled ? id : undefined}
        aria-label={rest['aria-label']}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.();
        }}
      >
        {children}
      </button>
      {disabled && (
        <span id={id} className="reason">
          {reason}
        </span>
      )}
    </>
  );
}

export function ErrorNotice({ children, action, id }: { children: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="notice" role="alert" id={id}>
      <AlertTriangle size={20} strokeWidth={1.5} aria-hidden="true" />
      <div>
        {children}
        {action}
      </div>
    </div>
  );
}

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const names = ['Paste', 'Check', 'Catch up'];
  return (
    <ol className="steps" aria-label="Progress">
      {names.map((n, i) => (
        <li key={n} aria-current={i + 1 === current ? 'step' : undefined}>
          {i + 1} {n}
        </li>
      ))}
    </ol>
  );
}

export function TopBar({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`topbar ${wide ? 'wide' : ''}`}>
      <span className="wordmark">relay<span className="signal-dot" aria-hidden="true" /></span>
      <span className="small muted">ON DEVICE / NO ACCOUNT</span>
    </div>
  );
}
