import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Document, DocumentCategory } from './documentTypes';
import { v4 as uuidv4 } from 'uuid';

// Helper to get storage URL for a file
const getFileUrl = async (path: string): Promise<string> => {
  try {
    // Try to get a signed URL first (works for private buckets)
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
      console.warn('Failed to create signed URL, falling back to public URL:', error);
      // Fallback to public URL
      const { data: publicData } = supabase.storage.from('documents').getPublicUrl(path);
      return publicData.publicUrl;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting file URL:', error);
    // Final fallback to public URL
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    return data.publicUrl;
  }
};

export const fetchDocuments = async (): Promise<Document[]> => {
  try {
    // Fetch documents from Supabase database
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format documents with file URLs
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => ({
        id: doc.id,
        name: doc.name,
        description: doc.description || '',
        file_path: await getFileUrl(doc.file_path),
        file_type: doc.file_type,
        file_size: doc.file_size,
        property_id: doc.property_id,
        category: doc.category,
        tags: [], // Not stored in current documents table
        upload_date: doc.created_at, // Use created_at as upload_date
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      }))
    );

    return documentsWithUrls;
  } catch (error) {
    console.error('Error fetching documents:', error);
    toast.error('Failed to load documents');
    return [];
  }
};

export const uploadDocument = async (formData: FormData): Promise<Document | null> => {
  try {
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value, typeof value);
    }

    const file = formData.get('file') as File;
    const category = formData.get('category') as DocumentCategory;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const property_id = formData.get('property_id') as string;
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map((tag) => tag.trim()) : undefined;

    console.log('Extracted file object:', {
      file,
      isFile: file instanceof File,
      isBlob: file instanceof Blob,
      constructor: file?.constructor?.name,
      type: typeof file,
    });

    // Validate file
    if (!file || !(file instanceof File)) {
      console.error('Invalid file object:', file);
      throw new Error('No valid file provided');
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      category,
    });

    // Optimize image files before upload
    let fileToUpload = file;
    const { isOptimizableImage, optimizeImageForUpload } =
      await import('@/utils/imageOptimization');
    if (isOptimizableImage(file)) {
      fileToUpload = await optimizeImageForUpload(file);
    }

    // Get current user first (needed for file path and database)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Create unique file path with user ID for storage RLS compliance
    const fileExt = fileToUpload.name.split('.').pop();
    const filePath = `${user.id}/${category.toLowerCase()}/${uuidv4()}.${fileExt}`;

    console.log('File path for storage:', filePath);

    // Try to read file as ArrayBuffer to verify it's a valid file
    try {
      const arrayBuffer = await fileToUpload.arrayBuffer();
      console.log('File ArrayBuffer size:', arrayBuffer.byteLength);
    } catch (bufferError) {
      console.error('Error reading file as ArrayBuffer:', bufferError);
      throw new Error('File is not readable');
    }

    console.log('Attempting Supabase storage upload...');
    console.log('Storage bucket: documents');
    console.log('Upload options:', {
      contentType: fileToUpload.type,
      upsert: false,
    });

    // Upload file to Supabase storage with explicit options
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileToUpload, {
        contentType: fileToUpload.type,
        upsert: false,
      });

    console.log('Upload result:', { data: uploadData, error: uploadError });

    if (uploadError) {
      console.error('Storage upload error details:', {
        message: uploadError.message,
        fullError: uploadError,
      });
      throw uploadError;
    }

    // Create document record in the database using documents table
    const { data, error: insertError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        name: name,
        description: description,
        file_path: filePath,
        file_type: fileToUpload.type,
        file_size: fileToUpload.size,
        property_id: property_id || null,
        category: category,
      })
      .select()
      .single();

    if (insertError) {
      // Delete the file if database insert fails
      await supabase.storage.from('documents').remove([filePath]);
      throw insertError;
    }

    // Add public URL to the returned document
    const publicFileUrl = await getFileUrl(data.file_path);
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      file_path: publicFileUrl,
      file_type: data.file_type,
      file_size: data.file_size,
      property_id: data.property_id,
      category: data.category,
      tags: [], // Not stored in current documents table
      upload_date: data.created_at, // Use created_at as upload_date
      created_at: data.created_at,
      // updated_at removed as it's not in Document type
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    toast.error('Failed to upload document');
    return null;
  }
};

export const deleteDocument = async (id: string): Promise<boolean> => {
  try {
    // First get the document to find the file path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from database first
    const { error: deleteError } = await supabase.from('documents').delete().eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Delete file from storage
    if (document?.file_path) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
        // Don't throw here as the database record is already deleted
      }
    }

    toast.success('Document deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    toast.error('Failed to delete document');
    return false;
  }
};

export const downloadDocument = async (document: Document): Promise<void> => {
  try {
    // Get a fresh signed URL for download
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path.split('/').pop() || document.file_path, 3600);

    if (error) {
      console.error('Error creating signed URL:', error);
      // Fallback to existing file_path
      window.open(document.file_path, '_blank');
    } else {
      // Create a temporary link element to trigger download
      const link = window.document.createElement('a');
      link.href = data.signedUrl;
      link.download = document.name || 'document';
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }

    toast.success(`Downloading "${document.name}"`);
  } catch (error) {
    console.error('Error downloading document:', error);
    toast.error('Failed to download document');
  }
};
