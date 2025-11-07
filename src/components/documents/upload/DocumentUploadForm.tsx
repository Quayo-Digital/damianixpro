
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import { DocumentCategory } from "@/services/documents";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploadField } from "./FileUploadField";
import { FormFields } from "./FormFields";

interface DocumentUploadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (formData: FormData) => Promise<void>;
  properties?: { id: string; name: string }[];
  defaultCategory?: string;
}

export function DocumentUploadForm({ open, onOpenChange, onUpload, properties, defaultCategory }: DocumentUploadFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [description, setDescription] = useState("");
  const [property, setProperty] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default category when defaultCategory prop changes or component mounts
  useState(() => {
    if (defaultCategory) {
      setCategory(defaultCategory as DocumentCategory);
    }
  });

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    
    // Auto-fill name if empty
    if (!name) {
      setName(file.name.split('.').slice(0, -1).join('.'));
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      toast.error("Document name is required");
      return;
    }
    
    if (!category) {
      toast.error("Category is required");
      return;
    }
    
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("file", selectedFile);
      
      if (property && property !== "none") {
        const selectedProperty = properties?.find(p => p.id === property);
        if (selectedProperty) {
          formData.append("property_id", property);
          formData.append("property_name", selectedProperty.name);
        }
      }
      
      if (tags) {
        formData.append("tags", tags);
      }
      
      await onUpload(formData);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const resetForm = () => {
    setName("");
    setCategory("");
    setDescription("");
    setProperty("");
    setTags("");
    setSelectedFileName("");
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isUploading) {
        resetForm();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document to the property management system.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-4 py-4 px-1">
            <FileUploadField
              selectedFileName={selectedFileName}
              setSelectedFileName={setSelectedFileName}
              onFileSelected={handleFileSelected}
            />
            
            <FormFields
              name={name}
              setName={setName}
              category={category}
              setCategory={setCategory}
              description={description}
              setDescription={setDescription}
              property={property}
              setProperty={setProperty}
              tags={tags}
              setTags={setTags}
              properties={properties}
            />
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
