
import { useRef, ChangeEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface FileUploadFieldProps {
  selectedFileName: string;
  setSelectedFileName: (name: string) => void;
  onFileSelected: (file: File) => void;
}

export function FileUploadField({
  selectedFileName,
  setSelectedFileName,
  onFileSelected,
}: FileUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // File size validation (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        e.target.value = '';
        setSelectedFileName("");
        return;
      }
      setSelectedFileName(file.name);
      onFileSelected(file);
    } else {
      setSelectedFileName("");
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="document-file">File</Label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            id="document-file"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
          <div className="border rounded-md px-3 py-2 flex items-center justify-between text-sm">
            <span className="truncate">{selectedFileName || "Select file..."}</span>
            <UploadCloud size={16} className="opacity-70" />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Maximum file size: 10MB
      </p>
    </div>
  );
}
