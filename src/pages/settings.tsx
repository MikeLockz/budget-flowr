import React, { useState } from 'react';
import { CheckCircle, Settings, Trash2, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { db } from '../lib/db';
import { queryClient } from '../lib/query-client';
import { useAppStore } from '../store/app-store';

// Modal components
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  actions?: React.ReactNode;
}

interface ConfirmationModalProps extends ModalProps {
  onConfirm: () => void;
}

// Base Modal component
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  actions
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">{title}</h2>
        <p className="mb-6 text-muted-foreground">{message}</p>
        {actions}
      </div>
    </div>
  );
};

// Confirmation Modal component
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      message={message}
      actions={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </div>
      }
    />
  );
};

// Success Modal component
const SuccessModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      message={message}
      actions={
        <div className="flex justify-center">
          <Button variant="default" onClick={onClose} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            OK
          </Button>
        </div>
      }
    />
  );
};

// Error Modal component
const ErrorModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      message={message}
      actions={
        <div className="flex justify-center">
          <Button variant="destructive" onClick={onClose}>
            <XCircle className="mr-2 h-4 w-4" />
            OK
          </Button>
        </div>
      }
    />
  );
};

export const SettingsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const clearAllNotifications = useAppStore((state) => state.clearAllNotifications);
  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openSuccessModal = () => setIsSuccessModalOpen(true);
  const closeSuccessModal = () => setIsSuccessModalOpen(false);
  const openErrorModal = () => setIsErrorModalOpen(true);
  const closeErrorModal = () => setIsErrorModalOpen(false);
  
  // Function to delete all user data
  const deleteAllData = async () => {
    try {
      // Clear IndexedDB data
      await db.transactions.clear();
      await db.categories.clear();
      await db.accounts.clear();
      await db.assets.clear();
      await db.sinkingFunds.clear();
      await db.fieldMappings.clear();
      await db.imports.clear();
      
      // Clear React Query cache
      queryClient.clear();
      
      // Clear app store notifications
      clearAllNotifications();
      
      // Clear localStorage (for persistent Zustand state)
      localStorage.removeItem('budget-flowr-storage');
      
      // Close confirmation modal
      closeModal();
      
      // Show success modal
      openSuccessModal();
      
      // Set timeout to reload after viewing the success message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error deleting data:', error);
      closeModal();
      openErrorModal();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application preferences and account settings.
          </p>
        </div>
        <Settings className="h-10 w-10 text-muted-foreground" />
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        
        <div className="space-y-4">
          <div className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Delete All Data</h3>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all your data, including transactions, categories, and settings.
                </p>
              </div>
              <Button variant="destructive" onClick={openModal}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Data
              </Button>
            </div>
          </div>
          
          {/* You can add more settings sections here */}
        </div>
      </Card>
      
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={deleteAllData}
        title="Delete All Data"
        message="Are you sure you want to delete all your data? This action cannot be undone."
      />
      
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={closeSuccessModal}
        title="Success"
        message="All data has been successfully deleted. The page will refresh momentarily."
      />
      
      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={closeErrorModal}
        title="Error"
        message="There was a problem deleting your data. Please try again."
      />
    </div>
  );
};

export default SettingsPage;