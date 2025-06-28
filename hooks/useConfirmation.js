'use client';

import { useState } from 'react';
import { getSetting } from '@/lib/settings';

export function useConfirmation() {
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'destructive',
    icon: null,
    details: null,
    requiresTyping: false,
    confirmationText: '',
    onConfirm: () => {},
    isLoading: false
  });

  const showConfirmation = (options) => {
    const requireConfirmation = getSetting('requireConfirmation');
    
    // If confirmations are disabled, execute immediately
    if (!requireConfirmation) {
      options.onConfirm();
      return;
    }

    setConfirmationState({
      isOpen: true,
      title: options.title || 'Confirm Action',
      description: options.description || 'Are you sure you want to proceed?',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'destructive',
      icon: options.icon,
      details: options.details,
      requiresTyping: options.requiresTyping || false,
      confirmationText: options.confirmationText || '',
      onConfirm: options.onConfirm,
      isLoading: false
    });
  };

  const handleConfirm = async () => {
    setConfirmationState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await confirmationState.onConfirm();
      setConfirmationState(prev => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (error) {
      console.error('Confirmation action failed:', error);
      setConfirmationState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancel = () => {
    setConfirmationState(prev => ({ ...prev, isOpen: false, isLoading: false }));
  };

  return {
    confirmationState,
    showConfirmation,
    handleConfirm,
    handleCancel
  };
}