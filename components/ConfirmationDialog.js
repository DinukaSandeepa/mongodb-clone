'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Loader2, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ConfirmationDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  variant = "destructive",
  icon: Icon = AlertTriangle,
  details = null,
  requiresTyping = false,
  confirmationText = "",
  isLoading = false
}) {
  const [typedConfirmation, setTypedConfirmation] = useState('');
  
  const handleConfirm = () => {
    if (requiresTyping && typedConfirmation !== confirmationText) {
      return;
    }
    onConfirm();
  };

  const handleClose = () => {
    setTypedConfirmation('');
    onOpenChange(false);
  };

  const isConfirmDisabled = requiresTyping ? 
    typedConfirmation !== confirmationText || isLoading : 
    isLoading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          buttonVariant: 'destructive'
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          buttonVariant: 'default'
        };
      default:
        return {
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          buttonVariant: 'default'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${styles.iconColor}`}>
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {details && (
          <div className={`p-4 border rounded-lg ${styles.bgColor}`}>
            {typeof details === 'string' ? (
              <p className={`font-medium ${styles.textColor}`}>{details}</p>
            ) : (
              details
            )}
          </div>
        )}

        {requiresTyping && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Type <Badge variant="outline" className="mx-1 font-mono">{confirmationText}</Badge> to confirm:
            </label>
            <input
              type="text"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder={`Type "${confirmationText}" here`}
              disabled={isLoading}
            />
          </div>
        )}
        
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            {cancelText}
          </Button>
          <Button 
            variant={styles.buttonVariant}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}