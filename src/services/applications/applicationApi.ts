
import { supabase } from '@/integrations/supabase/client';
import { RentalApplication, ApplicationDocument, LeaseAgreement, ApplicationFormValues } from './types';
import { toast } from 'sonner';

/**
 * Create a new rental application
 */
export const createApplication = async (
  propertyId: string, 
  applicationData: ApplicationFormValues, 
  documents: File[] = []
): Promise<RentalApplication | null> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to submit an application');
      return null;
    }
    
    // First, create the application record
    const { data, error } = await supabase
      .from('rental_applications')
      .insert({
        property_id: propertyId,
        user_id: user.id,
        ...applicationData
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating application:', error);
      throw error;
    }
    
    const application = data as RentalApplication;
    
    // Then upload any documents if provided
    if (documents.length > 0) {
      await uploadApplicationDocuments(application.id, documents);
    }
    
    return application;
  } catch (error) {
    console.error('Error creating application:', error);
    toast.error('Failed to submit application');
    return null;
  }
};

/**
 * Upload documents for an application
 */
export const uploadApplicationDocuments = async (
  applicationId: string, 
  files: File[]
): Promise<ApplicationDocument[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to upload documents');
      return [];
    }
    
    const uploadedDocuments: ApplicationDocument[] = [];
    
    for (const file of files) {
      // Create a unique filename
      const fileName = `${user.id}/${applicationId}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      
      // Upload to Supabase Storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('application-documents')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Error uploading document:', uploadError);
        continue;
      }
      
      // Create document record
      const { data: documentData, error: docError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: fileData?.path,
          file_type: file.type,
          file_size: file.size,
          category: 'Application',
          user_id: user.id
        })
        .select()
        .single();
      
      if (docError) {
        console.error('Error creating document record:', docError);
        continue;
      }
      
      // Link document to application
      const { data: appDoc, error: appDocError } = await supabase
        .from('application_documents')
        .insert({
          application_id: applicationId,
          document_id: documentData.id,
          document_type: 'supporting_document'
        })
        .select()
        .single();
      
      if (appDocError) {
        console.error('Error linking document to application:', appDocError);
        continue;
      }
      
      uploadedDocuments.push({
        ...appDoc,
        name: documentData.name,
        file_path: documentData.file_path
      } as ApplicationDocument);
    }
    
    return uploadedDocuments;
  } catch (error) {
    console.error('Error uploading application documents:', error);
    return [];
  }
};

/**
 * Get applications by property ID (for property owners/agents)
 */
export const getApplicationsByPropertyId = async (propertyId: string): Promise<RentalApplication[]> => {
  try {
    const { data, error } = await supabase
      .from('rental_applications')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
    
    return data as RentalApplication[];
  } catch (error) {
    console.error('Error fetching applications by property ID:', error);
    return [];
  }
};

/**
 * Get applications for the current user
 */
export const getUserApplications = async (): Promise<RentalApplication[]> => {
  try {
    const { data, error } = await supabase
      .from('rental_applications')
      .select(`
        *,
        properties:property_id (
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }
    
    return data.map(app => ({
      ...app,
      property_name: app.properties?.name
    })) as RentalApplication[];
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return [];
  }
};

/**
 * Get all applications for admin/owner
 */
export const getAllApplications = async (): Promise<RentalApplication[]> => {
  try {
    const { data, error } = await supabase
      .from('rental_applications')
      .select(`
        *,
        properties:property_id (
          name,
          owner_id,
          agent_id
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all applications:', error);
      throw error;
    }
    
    return data.map(app => ({
      ...app,
      property_name: app.properties?.name
    })) as RentalApplication[];
  } catch (error) {
    console.error('Error fetching all applications:', error);
    return [];
  }
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (
  applicationId: string, 
  status: RentalApplication['status'], 
  adminNotes?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('rental_applications')
      .update({ 
        status, 
        admin_notes: adminNotes,
        updated_at: new Date().toISOString() 
      })
      .eq('id', applicationId);
    
    if (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating application status:', error);
    return false;
  }
};

/**
 * Get application details by ID
 */
export const getApplicationById = async (applicationId: string): Promise<RentalApplication | null> => {
  try {
    const { data, error } = await supabase
      .from('rental_applications')
      .select(`
        *,
        properties:property_id (
          id,
          name,
          location,
          price,
          status,
          imageUrl
        )
      `)
      .eq('id', applicationId)
      .single();
    
    if (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
    
    if (!data) return null;
    
    return {
      ...data,
      property_name: data.properties?.name
    } as RentalApplication;
  } catch (error) {
    console.error('Error fetching application by ID:', error);
    return null;
  }
};

/**
 * Get application documents
 */
export const getApplicationDocuments = async (applicationId: string): Promise<ApplicationDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('application_documents')
      .select(`
        *,
        documents:document_id (
          id,
          name,
          file_path,
          file_type,
          file_size
        )
      `)
      .eq('application_id', applicationId);
    
    if (error) {
      console.error('Error fetching application documents:', error);
      throw error;
    }
    
    return data.map(doc => ({
      ...doc,
      name: doc.documents?.name,
      file_path: doc.documents?.file_path
    })) as ApplicationDocument[];
  } catch (error) {
    console.error('Error fetching application documents:', error);
    return [];
  }
};

/**
 * Create a lease agreement from an approved application
 */
export const createLeaseAgreement = async (
  propertyId: string,
  tenantId: string,
  applicationId?: string,
  leaseDetails?: {
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit: number;
  }
): Promise<LeaseAgreement | null> => {
  try {
    const { data, error } = await supabase
      .from('lease_agreements')
      .insert({
        property_id: propertyId,
        tenant_id: tenantId,
        application_id: applicationId,
        start_date: leaseDetails?.startDate,
        end_date: leaseDetails?.endDate,
        monthly_rent: leaseDetails?.monthlyRent,
        security_deposit: leaseDetails?.securityDeposit,
        status: 'draft'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lease agreement:', error);
      throw error;
    }
    
    return data as LeaseAgreement;
  } catch (error) {
    console.error('Error creating lease agreement:', error);
    return null;
  }
};

/**
 * Get lease agreements by property ID
 */
export const getLeasesByPropertyId = async (propertyId: string): Promise<LeaseAgreement[]> => {
  try {
    const { data, error } = await supabase
      .from('lease_agreements')
      .select(`
        *,
        tenants:tenant_id (
          id,
          first_name,
          last_name
        ),
        properties:property_id (
          name
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching lease agreements:', error);
      throw error;
    }
    
    return data.map(lease => ({
      ...lease,
      tenant_name: lease.tenants ? `${lease.tenants.first_name} ${lease.tenants.last_name}` : 'Unknown',
      property_name: lease.properties?.name
    })) as LeaseAgreement[];
  } catch (error) {
    console.error('Error fetching lease agreements by property ID:', error);
    return [];
  }
};

/**
 * Update lease agreement status
 */
export const updateLeaseStatus = async (
  leaseId: string, 
  status: LeaseAgreement['status'],
  documentId?: string,
  signedDate?: string
): Promise<boolean> => {
  try {
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString()
    };
    
    if (documentId) {
      updateData.document_id = documentId;
    }
    
    if (signedDate && status === 'signed') {
      updateData.signed_date = signedDate;
    }
    
    const { error } = await supabase
      .from('lease_agreements')
      .update(updateData)
      .eq('id', leaseId);
    
    if (error) {
      console.error('Error updating lease status:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating lease status:', error);
    return false;
  }
};

/**
 * Get tenant leases
 */
export const getTenantLeases = async (tenantId: string): Promise<LeaseAgreement[]> => {
  try {
    const { data, error } = await supabase
      .from('lease_agreements')
      .select(`
        *,
        properties:property_id (
          name,
          location,
          imageUrl
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tenant leases:', error);
      throw error;
    }
    
    return data.map(lease => ({
      ...lease,
      property_name: lease.properties?.name
    })) as LeaseAgreement[];
  } catch (error) {
    console.error('Error fetching tenant leases:', error);
    return [];
  }
};
