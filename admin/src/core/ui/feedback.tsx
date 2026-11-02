import type { ReactNode } from 'react';

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-primary bg-danger-soft text-primary-hover',
    success: 'border-success bg-white text-success',
    info: 'border-line bg-surface text-ink',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

type BadgeTone = 'success' | 'warning' | 'neutral' | 'brand';

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  const styles = {
    success: 'bg-white text-success border-success',
    warning: 'bg-white text-warning border-warning',
    neutral: 'bg-surface text-muted border-line',
    brand: 'bg-danger-soft text-primary-hover border-brand',
  }[tone];
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${styles}`}>{children}</span>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions}
    </header>
  );
}

export function LoadingText({ label = 'Cargando…' }: { label?: string }) {
  return (
    <p role="status" className="py-6 text-sm text-muted">
      {label}
    </p>
  );
}
