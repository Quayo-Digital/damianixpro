
import { toast } from '@/components/ui/sonner';
import { formatFileSize } from './documentUtils';

interface ExportConfig {
  filename: string;
  headers: string[];
  data: Record<string, any>[];
  mapper: (item: Record<string, any>) => string[];
}

export const exportToCsv = ({ filename, headers, data, mapper }: ExportConfig): void => {
  try {
    // Create CSV header row
    const headerRow = headers.join(',');
    
    // Map data to CSV rows
    const csvRows = data.map(item => mapper(item).join(','));
    
    // Combine header and rows
    const csvContent = [headerRow, ...csvRows].join('\n');
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Get blob size for toast notification
    const size = blob.size;
    const formattedSize = formatFileSize(size);
    
    // Create a download link and trigger download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success toast
    toast.success(`Downloaded ${filename} (${formattedSize})`);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    toast.error('Failed to download file');
  }
};

export const formatAmountForCsv = (amount: number): string => {
  // Format without currency symbol to make it more usable in spreadsheets
  return amount.toString();
};
