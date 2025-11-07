// React Hook for Intelligent Document Processing

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IntelligentDocumentProcessor } from '@/services/ai/documentProcessing';
import {
  DocumentMetadata,
  DocumentExtraction,
  DocumentClassification,
  DocumentValidation,
  DocumentFilters,
  DocumentSortOptions,
  DocumentAnalytics,
  DocumentType,
  DocumentStatus,
  DocumentProcessingResponse
} from '@/types/documentProcessing';

interface UseDocumentProcessingOptions {
  userId?: string;
  propertyId?: string;
  autoRefresh?: boolean;
  filters?: DocumentFilters;
}

export function useDocumentProcessing(options: UseDocumentProcessingOptions = {}) {
  const { userId, propertyId, autoRefresh = true, filters } = options;
  const queryClient = useQueryClient();
  
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({});

  // Fetch documents with filters
  const {
    data: documents = [],
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments
  } = useQuery({
    queryKey: ['documents', userId, propertyId, filters],
    queryFn: async () => {
      let query = supabase
        .from('document_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      if (filters?.document_types?.length) {
        query = query.in('document_type', filters.document_types);
      }

      if (filters?.statuses?.length) {
        query = query.in('status', filters.statuses);
      }

      if (filters?.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentMetadata[];
    },
    enabled: !!userId || !!propertyId
  });

  // Fetch document analytics
  const {
    data: analytics,
    isLoading: analyticsLoading
  } = useQuery({
    queryKey: ['document-analytics', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_metadata')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return IntelligentDocumentProcessor.generateAnalytics(data);
    },
    enabled: !!userId
  });

  // Upload and process document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({
      file,
      userId,
      propertyId,
      documentType
    }: {
      file: File;
      userId: string;
      propertyId?: string;
      documentType?: DocumentType;
    }) => {
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update upload progress
      setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));
      setProcessingStatus(prev => ({ ...prev, [documentId]: 'Uploading...' }));

      try {
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${documentId}.${fileExt}`;
        // Fix: User ID must be first folder for RLS policy compliance
        const filePath = `${userId}/documents/${fileName}`;

        console.log('DocumentProcessing upload - File path:', filePath);
        console.log('DocumentProcessing upload - File details:', {
          name: file.name,
          type: file.type,
          size: file.size
        });

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        setUploadProgress(prev => ({ ...prev, [documentId]: 50 }));
        setProcessingStatus(prev => ({ ...prev, [documentId]: 'Processing...' }));

        // Process document with AI
        const result = await IntelligentDocumentProcessor.processDocument(
          file,
          userId,
          propertyId
        );

        // Save metadata to database
        const { error: metadataError } = await supabase
          .from('document_metadata')
          .insert({
            ...result.metadata,
            file_path: filePath,
            document_type: documentType || result.classification.predicted_type
          });

        if (metadataError) throw metadataError;

        // Save extraction data
        const { error: extractionError } = await supabase
          .from('document_extractions')
          .insert(result.extraction);

        if (extractionError) throw extractionError;

        // Save classification data
        const { error: classificationError } = await supabase
          .from('document_classifications')
          .insert(result.classification);

        if (classificationError) throw classificationError;

        // Save validation data
        const { error: validationError } = await supabase
          .from('document_validations')
          .insert(result.validation);

        if (validationError) throw validationError;

        setUploadProgress(prev => ({ ...prev, [documentId]: 100 }));
        setProcessingStatus(prev => ({ ...prev, [documentId]: 'Completed' }));

        return result;
      } catch (error) {
        setProcessingStatus(prev => ({ ...prev, [documentId]: 'Failed' }));
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-analytics'] });
    }
  });

  // Update document status mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({
      documentId,
      updates
    }: {
      documentId: string;
      updates: Partial<DocumentMetadata>;
    }) => {
      const { error } = await supabase
        .from('document_metadata')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // Get document metadata to find file path
      const { data: document, error: fetchError } = await supabase
        .from('document_metadata')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Delete file from storage
      if (document.file_path) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([document.file_path]);

        if (storageError) throw storageError;
      }

      // Delete related records
      await Promise.all([
        supabase.from('document_validations').delete().eq('document_id', documentId),
        supabase.from('document_classifications').delete().eq('document_id', documentId),
        supabase.from('document_extractions').delete().eq('document_id', documentId),
        supabase.from('document_metadata').delete().eq('id', documentId)
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-analytics'] });
    }
  });

  // Reprocess document mutation
  const reprocessDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // Get document file and reprocess
      const { data: document, error } = await supabase
        .from('document_metadata')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (downloadError) throw downloadError;

      // Convert blob to file
      const file = new File([fileData], document.original_filename, {
        type: document.file_type
      });

      // Reprocess with AI
      const result = await IntelligentDocumentProcessor.processDocument(
        file,
        document.user_id,
        document.property_id
      );

      // Update all related records
      await Promise.all([
        supabase.from('document_metadata').update({
          document_type: result.classification.predicted_type,
          status: result.validation.overall_status === 'passed' ? 'processed' : 'needs_review',
          confidence_score: result.classification.confidence_score,
          updated_at: new Date().toISOString()
        }).eq('id', documentId),
        
        supabase.from('document_extractions').upsert(result.extraction),
        supabase.from('document_classifications').upsert(result.classification),
        supabase.from('document_validations').upsert(result.validation)
      ]);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  // Get document details with all related data
  const getDocumentDetails = useCallback(async (documentId: string) => {
    const { data, error } = await supabase
      .from('document_metadata')
      .select(`
        *,
        document_extractions(*),
        document_classifications(*),
        document_validations(*)
      `)
      .eq('id', documentId)
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Filter and sort documents
  const filteredDocuments = documents.filter(doc => {
    if (filters?.needs_review && doc.status !== 'needs_review') return false;
    if (filters?.has_fraud_alerts && !doc.confidence_score || doc.confidence_score > 0.7) return false;
    if (filters?.confidence_range) {
      const { min, max } = filters.confidence_range;
      if (doc.confidence_score < min || doc.confidence_score > max) return false;
    }
    return true;
  });

  // Utility functions
  const getDocumentsByType = useCallback((type: DocumentType) => {
    return documents.filter(doc => doc.document_type === type);
  }, [documents]);

  const getDocumentsByStatus = useCallback((status: DocumentStatus) => {
    return documents.filter(doc => doc.status === status);
  }, [documents]);

  const getPendingDocuments = useCallback(() => {
    return documents.filter(doc => 
      ['uploaded', 'processing', 'needs_review'].includes(doc.status)
    );
  }, [documents]);

  const getHighRiskDocuments = useCallback(() => {
    return documents.filter(doc => doc.confidence_score < 0.5);
  }, [documents]);

  // Real-time updates
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const channel = supabase
      .channel('document_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_metadata',
          filter: `user_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, autoRefresh, queryClient]);

  return {
    // Data
    documents: filteredDocuments,
    analytics,
    uploadProgress,
    processingStatus,

    // Loading states
    documentsLoading,
    analyticsLoading,
    isUploading: uploadDocumentMutation.isPending,
    isUpdating: updateDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
    isReprocessing: reprocessDocumentMutation.isPending,

    // Errors
    documentsError,
    uploadError: uploadDocumentMutation.error,
    updateError: updateDocumentMutation.error,
    deleteError: deleteDocumentMutation.error,

    // Actions
    uploadDocument: uploadDocumentMutation.mutate,
    updateDocument: updateDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
    reprocessDocument: reprocessDocumentMutation.mutate,
    refetchDocuments,
    getDocumentDetails,

    // Utility functions
    getDocumentsByType,
    getDocumentsByStatus,
    getPendingDocuments,
    getHighRiskDocuments,

    // Clear progress tracking
    clearProgress: useCallback((documentId: string) => {
      setUploadProgress(prev => {
        const { [documentId]: _, ...rest } = prev;
        return rest;
      });
      setProcessingStatus(prev => {
        const { [documentId]: _, ...rest } = prev;
        return rest;
      });
    }, [])
  };
}
