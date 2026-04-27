import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MaintenanceScheduleForm } from './MaintenanceScheduleForm';

interface Vendor {
  id: string;
  name: string;
  specialization: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
}

interface AddScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleCreated: () => void;
  vendors: Vendor[];
}

export function AddScheduleDialog({
  open,
  onOpenChange,
  onScheduleCreated,
  vendors,
}: AddScheduleDialogProps) {
  const handleSubmit = (formData: any) => {
    // In a real app, save this to database
    console.log(formData);

    // Reset form and close dialog
    onScheduleCreated();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
          <DialogDescription>
            Schedule a maintenance task with a vendor. Select the vendor, date, and task details.
          </DialogDescription>
        </DialogHeader>
        <MaintenanceScheduleForm
          vendors={vendors}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
