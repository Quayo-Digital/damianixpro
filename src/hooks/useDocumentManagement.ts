
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { 
  Document, 
  fetchDocuments, 
  uploadDocument, 
  deleteDocument, 
  downloadDocument 
} from '@/services/documents';

export function useDocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [searchQuery, selectedCategory, selectedProperty, documents]);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching documents from Supabase...");
      const data = await fetchDocuments();
      console.log("Documents fetched:", data);
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents. Please try again later.');
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];
    
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(lowerCaseQuery) || 
        doc.description?.toLowerCase().includes(lowerCaseQuery) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
      );
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }
    
    if (selectedProperty && selectedProperty !== 'all') {
      filtered = filtered.filter(doc => doc.property_id === selectedProperty);
    }
    
    setFilteredDocuments(filtered);
  };

  const handleUpload = async (formData: FormData): Promise<void> => {
    try {
      const newDocument = await uploadDocument(formData);
      if (newDocument) {
        setDocuments([newDocument, ...documents]);
        toast.success('Document uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  const handleDelete = async (id: string): Promise<string> => {
    return id; // Just return the ID, actual deletion is handled separately
  };

  const confirmDelete = async (id: string): Promise<void> => {
    try {
      const success = await deleteDocument(id);
      if (success) {
        setDocuments(documents.filter(doc => doc.id !== id));
        toast.success('Document deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = (document: Document): void => {
    downloadDocument(document);
  };

  return {
    documents,
    filteredDocuments,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedProperty,
    setSelectedProperty,
    isLoading,
    error,
    loadDocuments,
    handleUpload,
    handleDelete,
    confirmDelete,
    handleDownload
  };
}
