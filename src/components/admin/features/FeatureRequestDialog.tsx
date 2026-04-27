import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FeatureRequestForm } from './FeatureRequestForm';
import { Plus } from 'lucide-react';
import { MaintenanceRequest } from '@/components/communication/maintenance/maintenance-data';

interface FeatureRequestDialogProps {
  onSuccess?: () => void;
}

export function FeatureRequestDialog({ onSuccess }: FeatureRequestDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSuccess = (newRequest: MaintenanceRequest) => {
    if (onSuccess) {
      onSuccess();
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Feature Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>New Feature Request</DialogTitle>
        </DialogHeader>
        <FeatureRequestForm onClose={handleClose} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
