import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

// ---------------------------------------------------------------------------
// 1. TOAST NOTIFICATION HELPER
// ---------------------------------------------------------------------------
export const NotificationToast = {
  success: (message: string, description?: string) => 
    toast.success(message, { description }),
  error: (message: string, description?: string) => 
    toast.error(message, { description }),
  info: (message: string, description?: string) => 
    toast.info(message, { description }),
  warning: (message: string, description?: string) => 
    toast.warning(message, { description }),
};

// ---------------------------------------------------------------------------
// 2. BANNER NOTIFICATION COMPONENT
// ---------------------------------------------------------------------------
export interface NotificationBannerProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function NotificationBanner({ 
  type = 'info', 
  title, 
  description, 
  dismissible = false, 
  onDismiss,
  className = '' 
}: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Reset visibility when the description or title changes
  React.useEffect(() => {
    setIsVisible(true);
  }, [title, description]);

  if (!isVisible) return null;

  const config = {
    success: { icon: CheckCircle2, bg: 'bg-success/10', border: 'border-success/20', text: 'text-success' },
    error: { icon: AlertCircle, bg: 'bg-danger/10', border: 'border-danger/20', text: 'text-danger' },
    warning: { icon: AlertTriangle, bg: 'bg-warning/10', border: 'border-warning/20', text: 'text-warning' },
    info: { icon: Info, bg: 'bg-brand-500/10', border: 'border-brand-500/20', text: 'text-brand-400' },
  }[type];

  const Icon = config.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${config.bg} ${config.border} ${className} animate-in fade-in slide-in-from-top-2 duration-300`}>
      <Icon className={`w-5 h-5 shrink-0 ${config.text} mt-0.5`} />
      <div className="flex-1 min-w-0">
        <h5 className={`text-sm font-semibold ${config.text}`}>{title}</h5>
        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
      </div>
      {dismissible && (
        <button 
          onClick={handleDismiss}
          className="shrink-0 text-text-secondary hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. MODAL NOTIFICATION COMPONENT
// ---------------------------------------------------------------------------
export interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  type?: 'default' | 'danger' | 'warning' | 'success';
}

export function NotificationModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  type = 'default'
}: NotificationModalProps) {
  
  const iconConfig = {
    default: null,
    danger: <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mb-4"><AlertCircle className="w-6 h-6 text-danger" /></div>,
    warning: <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6 text-warning" /></div>,
    success: <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4"><CheckCircle2 className="w-6 h-6 text-success" /></div>,
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card-base border-border-subtle shadow-2xl">
        <DialogHeader>
          {iconConfig[type]}
          <DialogTitle className="text-xl font-display font-bold text-white">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-text-secondary mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {children && (
          <div className="py-4 text-sm text-text-secondary">
            {children}
          </div>
        )}

        {footer && (
          <DialogFooter className="mt-4">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
