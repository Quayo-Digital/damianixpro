import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MaintenanceRequestForm } from './request-form/MaintenanceRequestForm';
import { Plus } from 'lucide-react';
import { MaintenanceRequest } from '@/components/communication/maintenance/maintenance-data';

interface MaintenanceRequestDialogProps {
  onSuccess?: (newRequest: MaintenanceRequest) => void;
}

export function MaintenanceRequestDialog({ onSuccess }: MaintenanceRequestDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSuccess = (newRequest: MaintenanceRequest) => {
    if (onSuccess) {
      onSuccess(newRequest);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Maintenance Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>New Maintenance Request</DialogTitle>
          <DialogDescription>
            Submit a new maintenance request for your property. Include photos and detailed
            description to help us assist you quickly.
          </DialogDescription>
        </DialogHeader>
        <MaintenanceRequestForm onClose={handleClose} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
