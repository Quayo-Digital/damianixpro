
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from 'lucide-react';
import { MaintenanceRequestForm } from './MaintenanceRequestForm';
import { MaintenanceRequest } from './maintenance-data';

interface MaintenanceRequestDialogProps {
  onSuccess?: (newRequest: MaintenanceRequest) => void;
}

export function MaintenanceRequestDialog({ onSuccess }: MaintenanceRequestDialogProps) {
  const [open, setOpen] = useState(false);
  
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
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>New Maintenance Request</DialogTitle>
          <DialogDescription>
            Submit a request for any maintenance issues in your property.
          </DialogDescription>
        </DialogHeader>
        <MaintenanceRequestForm onClose={handleClose} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
