import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { isOptimizableImage, optimizeImageForUpload } from '@/utils/imageOptimization';

/**
 * Upload documents for a property
 */
export const uploadPropertyDocuments = async (
  propertyId: string,
  files: File[]
): Promise<string[]> => {
  try {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileToUpload = isOptimizableImage(file) ? await optimizeImageForUpload(file) : file;

      // Create a unique filename
      const fileName = `${propertyId}/${uuidv4()}-${fileToUpload.name.replace(/\s/g, '_')}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('property-documents')
        .upload(fileName, fileToUpload);

      if (error) throw error;

      if (data) {
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('property-documents')
          .getPublicUrl(data.path);

        // Store document reference in the documents table
        const { error: docError } = await supabase.from('documents').insert({
          name: fileToUpload.name,
          file_path: data.path,
          file_type: fileToUpload.type,
          file_size: fileToUpload.size,
          property_id: propertyId,
          category: 'property-document',
        });

        if (docError) throw docError;

        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }

    return uploadedUrls;
  } catch (error) {
    console.error('Error uploading property documents:', error);
    throw error;
  }
};

/**
 * Delete documents associated with a property
 */
export const deletePropertyDocuments = async (propertyId: string): Promise<void> => {
  try {
    // Get all documents for this property
    const { data, error } = await supabase
      .from('documents')
      .select('file_path')
      .eq('property_id', propertyId);

    if (error) throw error;

    if (data && data.length > 0) {
      // Delete files from storage
      const filePaths = data.map((doc) => doc.file_path);
      const { error: deleteError } = await supabase.storage
        .from('property-documents')
        .remove(filePaths);

      if (deleteError) throw deleteError;

      // Delete document records
      const { error: recordError } = await supabase
        .from('documents')
        .delete()
        .eq('property_id', propertyId);

      if (recordError) throw recordError;
    }
  } catch (error) {
    console.error('Error deleting property documents:', error);
    throw error;
  }
};
