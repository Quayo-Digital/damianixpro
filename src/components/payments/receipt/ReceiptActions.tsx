import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReceiptActionsProps {
  onPrint: () => void;
  onDownload: () => void;
  showBackButton?: boolean;
}

export const ReceiptActions: React.FC<ReceiptActionsProps> = ({
  onPrint,
  onDownload,
  showBackButton = true,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      {showBackButton && (
        <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
      )}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onPrint} size="sm" className="flex items-center gap-2">
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button
          variant="default"
          onClick={onDownload}
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" /> Download
        </Button>
      </div>
    </div>
  );
};
