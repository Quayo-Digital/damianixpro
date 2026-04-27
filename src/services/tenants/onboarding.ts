import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getTemplateById } from '@/utils/communicationTemplates';

export interface OnboardingStatus {
  id: string;
  tenant_id: string;
  welcome_sent: boolean;
  lease_generated: boolean;
  lease_sent: boolean;
  lease_signed: boolean;
  move_in_instructions_sent: boolean;
  completed: boolean;
  lease_document_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaseDocument {
  id: string;
  tenant_id: string;
  property_id: string;
  document_id: string;
  status: 'draft' | 'sent' | 'signed' | 'expired';
  sent_date?: string;
  signed_date?: string;
  expire_date?: string;
  created_at: string;
  updated_at: string;
}

export const initializeOnboarding = async (
  tenantId: string,
  propertyId: string
): Promise<boolean> => {
  try {
    // Check if onboarding record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('tenant_onboarding')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (existingRecord) {
      console.log('Onboarding record already exists for tenant:', tenantId);
      return true;
    }

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned
      throw checkError;
    }

    // Create onboarding record if it doesn't exist
    const { error } = await supabase.from('tenant_onboarding').insert({
      tenant_id: tenantId,
      welcome_sent: false,
      lease_generated: false,
      lease_sent: false,
      lease_signed: false,
      move_in_instructions_sent: false,
      completed: false,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error initializing tenant onboarding:', error);
    toast.error('Failed to initialize tenant onboarding process');
    return false;
  }
};

export const getOnboardingStatus = async (tenantId: string): Promise<OnboardingStatus | null> => {
  try {
    const { data, error } = await supabase
      .from('tenant_onboarding')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, initialize onboarding
        await initializeOnboarding(tenantId, '');
        const { data: newData, error: newError } = await supabase
          .from('tenant_onboarding')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();

        if (newError) throw newError;
        return newData as OnboardingStatus;
      }
      throw error;
    }

    return data as OnboardingStatus;
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return null;
  }
};

export const updateOnboardingStatus = async (
  tenantId: string,
  updates: Partial<OnboardingStatus>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tenant_onboarding')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    toast.error('Failed to update tenant onboarding status');
    return false;
  }
};

export const generateLeaseDocument = async (
  tenantId: string,
  propertyId: string,
  leaseData: any
): Promise<string | null> => {
  try {
    // In a real implementation, this would generate a PDF using a template library
    // For now, we'll simulate the document creation by creating a record

    // First, create an entry in the documents table
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        name: `Lease Agreement - ${new Date().toLocaleDateString()}`,
        description: 'Tenant lease agreement document',
        file_path: `leases/${tenantId}-${propertyId}-${Date.now()}.pdf`,
        file_type: 'application/pdf',
        file_size: 1024000, // Simulated 1MB file
        category: 'Legal',
        property_id: propertyId,
        tenant_id: tenantId,
        tags: ['lease', 'contract', 'legal'],
      })
      .select()
      .single();

    if (docError) throw docError;

    // Next, create a lease document record linking to this document
    const { data: leaseData, error: leaseError } = await supabase
      .from('lease_documents')
      .insert({
        tenant_id: tenantId,
        property_id: propertyId,
        document_id: docData.id,
        status: 'draft',
        expire_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      })
      .select()
      .single();

    if (leaseError) throw leaseError;

    // Update the onboarding status
    await updateOnboardingStatus(tenantId, {
      lease_generated: true,
      lease_document_id: leaseData.id,
    });

    toast.success('Lease document generated successfully');
    return docData.id;
  } catch (error) {
    console.error('Error generating lease document:', error);
    toast.error('Failed to generate lease document');
    return null;
  }
};

export const sendLeaseForSigning = async (
  tenantId: string,
  documentId: string
): Promise<boolean> => {
  try {
    // In a real implementation, this would send an email via a service like SendGrid
    // For now, we'll just simulate sending by updating statuses

    // Get tenant information
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError) throw tenantError;

    // Get property information
    const { data: propertyTenant, error: ptError } = await supabase
      .from('property_tenants')
      .select('property_id')
      .eq('tenant_id', tenantId)
      .single();

    if (ptError) throw ptError;

    // Get property name
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('name')
      .eq('id', propertyTenant.property_id)
      .single();

    if (propError) throw propError;

    // Update lease document status
    const { error: updateError } = await supabase
      .from('lease_documents')
      .update({
        status: 'sent',
        sent_date: new Date().toISOString(),
      })
      .eq('document_id', documentId);

    if (updateError) throw updateError;

    // Update onboarding status
    await updateOnboardingStatus(tenantId, {
      lease_sent: true,
    });

    // In a real implementation, send actual email here
    console.log('Sending lease document email to:', tenant.email);

    toast.success('Lease sent for signing');
    return true;
  } catch (error) {
    console.error('Error sending lease for signing:', error);
    toast.error('Failed to send lease for signing');
    return false;
  }
};

export const recordLeaseSigned = async (tenantId: string, documentId: string): Promise<boolean> => {
  try {
    // Update lease document status
    const { error: updateError } = await supabase
      .from('lease_documents')
      .update({
        status: 'signed',
        signed_date: new Date().toISOString(),
      })
      .eq('document_id', documentId);

    if (updateError) throw updateError;

    // Update onboarding status
    await updateOnboardingStatus(tenantId, {
      lease_signed: true,
    });

    toast.success('Lease signing recorded successfully');
    return true;
  } catch (error) {
    console.error('Error recording lease signing:', error);
    toast.error('Failed to record lease signing');
    return false;
  }
};

export const sendMoveInInstructions = async (
  tenantId: string,
  propertyId: string
): Promise<boolean> => {
  try {
    // In a real implementation, this would send an email
    // For now, we'll just update the onboarding status
    await updateOnboardingStatus(tenantId, {
      move_in_instructions_sent: true,
    });

    toast.success('Move-in instructions sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending move-in instructions:', error);
    toast.error('Failed to send move-in instructions');
    return false;
  }
};

export const completeOnboarding = async (tenantId: string): Promise<boolean> => {
  try {
    await updateOnboardingStatus(tenantId, {
      completed: true,
    });

    toast.success('Tenant onboarding completed');
    return true;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    toast.error('Failed to complete tenant onboarding');
    return false;
  }
};

// Function to check if important milestones are approaching
export const checkRentalMilestones = async (): Promise<void> => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const thirtyDayDate = thirtyDaysFromNow.toISOString().split('T')[0];

    // Check for lease expirations in the next 30 days
    const { data: expiringLeases, error: leaseError } = await supabase
      .from('property_tenants')
      .select('*, tenants(*)')
      .lte('end_date', thirtyDayDate)
      .gt('end_date', today.toISOString().split('T')[0]);

    if (leaseError) throw leaseError;

    // Process the expiring leases (in a real app, this would trigger notifications)
    if (expiringLeases && expiringLeases.length > 0) {
      console.log('Found expiring leases:', expiringLeases.length);
      // Here you would send notifications for each expiring lease
    }

    // Similar checks could be implemented for other milestones
  } catch (error) {
    console.error('Error checking rental milestones:', error);
  }
};
