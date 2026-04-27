import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface MaintenanceTaskFieldsProps {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
}

export function MaintenanceTaskFields({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
}: MaintenanceTaskFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Maintenance Task</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter maintenance task title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe the maintenance task in detail"
          rows={3}
        />
      </div>
    </>
  );
}
