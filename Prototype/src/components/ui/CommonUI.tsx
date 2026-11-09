import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Inbox,
  Info,
  Minus,
  X,
} from 'lucide-react';
import { TrendDirection } from '../../types/academic';

export const TrendBadge: React.FC<{
  status: TrendDirection;
  delta?: number | null;
  size?: 'sm' | 'md';
}> = ({ status, delta, size = 'sm' }) => {
  const paddingClass =
    size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  if (status === 'meningkat') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-lg bg-success-bg text-success border border-success-border font-medium tabular-nums whitespace-nowrap ${paddingClass}`}
      >
        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>
          Meningkat
          {delta !== undefined && delta !== null ? ` (+${delta})` : ''}
        </span>
      </span>
    );
  }

  if (status === 'menurun') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-lg bg-danger-bg text-danger border border-danger-border font-medium tabular-nums whitespace-nowrap ${paddingClass}`}
      >
        <ArrowDownRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>
          Menurun
          {delta !== undefined && delta !== null ? ` (${delta})` : ''}
        </span>
      </span>
    );
  }

  if (status === 'stabil') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-lg bg-secondary text-primary border border-light-blue font-medium tabular-nums whitespace-nowrap ${paddingClass}`}
      >
        <Minus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>
          Stabil
          {delta !== undefined && delta !== null
            ? ` (${delta >= 0 ? `+${delta}` : delta})`
            : ''}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg bg-warning-bg text-warning border border-warning-border font-medium whitespace-nowrap ${paddingClass}`}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Data Belum Cukup</span>
    </span>
  );
};

export const AttentionBadge: React.FC<{
  label: 'Memerlukan Perhatian' | 'Perlu Evaluasi';
}> = ({ label }) => {
  const isHigh = label === 'Memerlukan Perhatian';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap border ${
        isHigh
          ? 'bg-danger-bg text-danger border-danger-border'
          : 'bg-warning-bg text-warning border-warning-border'
      }`}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};

export const SimulationDisclaimerBanner: React.FC<{
  text?: string;
  compact?: boolean;
}> = ({
  text = 'Mode Simulasi Prototype Penelitian: Seluruh data siswa, nilai, dan presensi pada halaman ini merupakan data demonstrasi terintegrasi.',
  compact = false,
}) => {
  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-xl bg-secondary border border-light-blue text-ink ${
        compact ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-xs sm:text-sm'
      }`}
    >
      <Info
        className="w-4 h-4 text-primary shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <p className="text-muted leading-relaxed">{text}</p>
    </div>
  );
};

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, showBack = false, backTo, actions }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
      <div className="flex items-start gap-3 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-surface border border-border text-ink hover:bg-secondary transition-colors shrink-0"
            aria-label="Kembali ke halaman sebelumnya"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-ink leading-snug">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-surface border border-border rounded-2xl p-6 sm:p-8 my-2">
      <div className="w-12 h-12 rounded-2xl bg-secondary text-primary flex items-center justify-center mb-3">
        <Inbox className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="text-sm text-muted mt-1 max-w-md leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-medium transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const BottomSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ isOpen, onClose, title, subtitle, children, footer }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-sheet-title"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full sm:max-w-lg max-h-[90dvh] flex flex-col bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-lg overflow-hidden">
        {/* Mobile grab handle */}
        <div className="w-10 h-1.5 bg-border rounded-full mx-auto mt-2.5 sm:hidden" />

        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-3 pb-3.5 border-b border-border">
          <div className="min-w-0">
            <h2
              id="bottom-sheet-title"
              className="text-base sm:text-lg font-bold text-ink"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 -mt-1 rounded-xl text-muted hover:text-ink hover:bg-secondary transition-colors"
            aria-label="Tutup panel"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {children}
        </div>

        {footer && (
          <div className="px-4 sm:px-5 py-3.5 bg-page border-t border-border safe-bottom">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const FeedbackToast: React.FC<{
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}> = ({ type, message, onClose }) => {
  return (
    <div
      role="status"
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-sm text-sm ${
        type === 'success'
          ? 'bg-success-bg text-success border-success-border'
          : type === 'error'
          ? 'bg-danger-bg text-danger border-danger-border'
          : 'bg-secondary text-primary border-light-blue'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : type === 'error' ? (
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : (
          <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
        )}
        <span className="font-medium leading-snug">{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg hover:bg-surface/60 transition-colors shrink-0"
        aria-label="Tutup pemberitahuan"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};
