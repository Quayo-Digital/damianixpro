import { supabase } from '@/integrations/supabase/client';
import {
  enrichRowsWithPropertiesAndTenants,
  fetchLeaseRows,
  normalizeLeaseAgreementStatus,
} from '@/services/leases/enrichLeaseAgreements';
import {
  RentalApplication,
  ApplicationDocument,
  LeaseAgreement,
  ApplicationFormValues,
} from './types';
import type { Property } from '@/services/property/types';
import { toast } from 'sonner';
import { demoProperties } from '@/data/demoProperties';
import { fetchProperties } from '@/services/property/api/queries';
import {
  canApproveRentalApplication,
  canSubmitRentalApplication,
} from '@/services/property/leaseSummary';

const UUID_V4_OR_V1_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Seeded by migration `20260418123000_demo_application_anchor_property.sql` for demo listing applications. */
export const DEMO_APPLICATION_ANCHOR_PROPERTY_ID = 'c0ffee00-0000-4000-8000-000000000001';

const normalizeText = (value?: string | null): string => (value || '').trim().toLowerCase();

const getDemoPropertyHints = (propertyId: string) => {
  const demo = demoProperties.find((p) => p.id === propertyId);
  if (!demo) return null;
  return {
    location: normalizeText(demo.location),
    type: normalizeText(demo.type),
    name: normalizeText(demo.name),
  };
};

type ResolvedPropertyMapping = {
  id: string;
  debug?: {
    source: 'live' | 'demo-mapped' | 'demo-anchor';
    score?: number;
    notes?: string[];
  };
};

const mapFetchedPropertyToScoreRow = (p: Property) => {
  const loc = (p.location || '').trim();
  const parts = loc
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const city = parts[0] || '';
  const state = parts.length > 1 ? parts[parts.length - 1] : city;
  return {
    id: p.id,
    name: p.name || '',
    address: p.address || '',
    city,
    state,
    location: loc,
    status: normalizeText(p.status),
    created_at: p.created_at,
  };
};

const resolveApplicationPropertyId = async (
  propertyId: string
): Promise<ResolvedPropertyMapping | null> => {
  if (UUID_V4_OR_V1_REGEX.test(propertyId)) {
    const { data, error } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .maybeSingle();

    if (error) {
      console.error('Error verifying property id:', error);
      return null;
    }
    if (!data?.id) {
      console.warn('No property row visible for id (missing or RLS):', propertyId);
      return null;
    }
    return { id: data.id, debug: { source: 'live' } };
  }

  // Demo listing IDs are local strings (e.g. demo-prop-abuja-1). Map them to the closest real property.
  // Use the same fetch path as /public/properties so tenant RLS + status rules match what users can see.
  if (propertyId.startsWith('demo-prop-')) {
    const demoHints = getDemoPropertyHints(propertyId);
    let rows: ReturnType<typeof mapFetchedPropertyToScoreRow>[] = [];

    try {
      const fetched = await fetchProperties();
      const availableOnly = fetched.filter((p) => normalizeText(p.status) === 'available');
      rows = availableOnly.map(mapFetchedPropertyToScoreRow);
    } catch (e) {
      console.error('Error resolving demo property ID:', e);
      return null;
    }

    if (!rows.length) {
      const { data: anchor, error: anchorErr } = await supabase
        .from('properties')
        .select('id')
        .eq('id', DEMO_APPLICATION_ANCHOR_PROPERTY_ID)
        .maybeSingle();

      if (anchorErr) {
        console.warn('Demo anchor lookup failed:', anchorErr);
        return null;
      }
      if (anchor?.id) {
        return {
          id: anchor.id,
          debug: {
            source: 'demo-anchor',
            notes: ['fallback:seeded-demo-anchor'],
          },
        };
      }
      return null;
    }

    const best = rows
      .map((row) => {
        let score = 0;
        const notes: string[] = [];
        const city = normalizeText(row.city);
        const state = normalizeText(row.state);
        const address = normalizeText(row.address);
        const name = normalizeText(row.name);
        const locCombined = normalizeText(
          [row.city, row.state, row.location].filter(Boolean).join(' ')
        );
        const status = row.status;

        if (status === 'available') {
          score += 8;
          notes.push('status:available');
        }

        if (demoHints?.location) {
          if (city === demoHints.location || state === demoHints.location) {
            score += 30;
            notes.push(`location:exact(${demoHints.location})`);
          } else if (
            city.includes(demoHints.location) ||
            state.includes(demoHints.location) ||
            address.includes(demoHints.location) ||
            locCombined.includes(demoHints.location)
          ) {
            score += 18;
            notes.push(`location:partial(${demoHints.location})`);
          }
        }

        if (demoHints?.type) {
          if (demoHints.type === 'commercial') {
            if (name.includes('office') || name.includes('commercial') || name.includes('shop')) {
              score += 16;
              notes.push('type:commercial-keyword');
            }
          }
          if (demoHints.type === 'residential') {
            if (
              name.includes('residential') ||
              name.includes('apartment') ||
              name.includes('duplex') ||
              name.includes('villa')
            ) {
              score += 16;
              notes.push('type:residential-keyword');
            }
          }
        }

        if (
          demoHints?.name &&
          name &&
          demoHints.name.split(' ').some((w) => w.length > 4 && name.includes(w))
        ) {
          score += 8;
          notes.push('name:token-match');
        }

        if (row.created_at) {
          score += 1;
          notes.push('freshness:tiebreak');
        }

        return { id: row.id, score, notes };
      })
      .sort((a, b) => b.score - a.score)[0];

    if (!best?.id) return null;

    return {
      id: best.id,
      debug: {
        source: 'demo-mapped',
        score: best.score,
        notes: best.notes,
      },
    };
  }

  return null;
};

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('You must be logged in to submit an application');
      return null;
    }

    const resolved = await resolveApplicationPropertyId(propertyId);
    if (!resolved) {
      const isDemoListing = propertyId.startsWith('demo-prop-');
      toast.error('Unable to submit application for this listing', {
        description: isDemoListing
          ? 'Push the latest Supabase migrations (includes a demo “anchor” property), or add any available property, or apply from Browse properties.'
          : 'No property was found for this ID, or your account cannot read it. Open a listing from Browse properties and try again.',
      });
      return null;
    }

    if (
      import.meta.env.DEV &&
      (resolved.debug?.source === 'demo-mapped' || resolved.debug?.source === 'demo-anchor')
    ) {
      const summary =
        resolved.debug?.source === 'demo-anchor'
          ? `Demo listing attached to seeded anchor property ${resolved.id}`
          : `Mapped demo listing to property ${resolved.id} (score: ${resolved.debug?.score ?? 0})`;
      const notes = (resolved.debug?.notes || []).join(', ');
      console.debug('[QA] Demo property mapping', {
        demo_property_id: propertyId,
        mapped_property_id: resolved.id,
        score: resolved.debug?.score,
        notes: resolved.debug?.notes,
        source: resolved.debug?.source,
      });
      toast.info('QA: Demo listing mapped', {
        description: notes ? `${summary}. ${notes}` : summary,
      });
    }

    const { valid_id: _validId, ...rest } = applicationData as Record<string, unknown>;
    const unitIdRaw =
      rest.unit_id != null && String(rest.unit_id).trim() !== '' ? String(rest.unit_id) : null;
    const leaseGate = await canSubmitRentalApplication(resolved.id, unitIdRaw);
    if (!leaseGate.ok) {
      toast.error(leaseGate.message || 'This property is not available to lease.');
      return null;
    }

    // Prepare row: only columns on `rental_applications` (no spread — avoids unknown keys / 404 table drift)
    const insertRow = {
      property_id: resolved.id,
      user_id: user.id,
      first_name: String(rest.first_name ?? ''),
      last_name: String(rest.last_name ?? ''),
      email: String(rest.email ?? ''),
      phone: rest.phone != null && rest.phone !== '' ? String(rest.phone) : null,
      monthly_income:
        rest.monthly_income != null && rest.monthly_income !== ''
          ? Number(rest.monthly_income)
          : null,
      occupation:
        rest.occupation != null && rest.occupation !== '' ? String(rest.occupation) : null,
      current_address:
        rest.current_address != null && rest.current_address !== ''
          ? String(rest.current_address)
          : null,
      move_in_date:
        rest.move_in_date != null && rest.move_in_date !== '' ? String(rest.move_in_date) : null,
      tenancy_period: Number(rest.tenancy_period ?? 12) || 12,
      num_occupants: Number(rest.num_occupants ?? 1) || 1,
      has_pets: Boolean(rest.has_pets),
      pets_details:
        rest.pets_details != null && rest.pets_details !== '' ? String(rest.pets_details) : null,
      employment_status:
        rest.employment_status != null && rest.employment_status !== ''
          ? String(rest.employment_status)
          : 'full-time',
      employer_name:
        rest.employer_name != null && rest.employer_name !== '' ? String(rest.employer_name) : null,
      employer_contact:
        rest.employer_contact != null && rest.employer_contact !== ''
          ? String(rest.employer_contact)
          : null,
      emergency_contact_name: String(rest.emergency_contact_name ?? ''),
      emergency_contact_phone:
        rest.emergency_contact_phone != null && rest.emergency_contact_phone !== ''
          ? String(rest.emergency_contact_phone)
          : null,
      status: 'pending' as const,
    };

    const { data, error } = await supabase
      .from('rental_applications')
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      console.error('Application data sent:', insertRow);
      console.error('Original application data:', applicationData);
      const msg = String(error.message ?? '');
      toast.error(
        /404|not found|schema cache|Could not find the table/i.test(msg)
          ? 'Rental applications table is missing. Apply the Supabase migration `20260322000000_rental_applications.sql` (or push migrations).'
          : msg || 'Failed to create application'
      );
      return null;
    }

    const application = data as RentalApplication;

    // Then upload any documents if provided
    if (documents.length > 0) {
      await uploadApplicationDocuments(application.id, documents);
    }

    // Note: valid_id is collected in the form but not stored in rental_applications table
    // It can be stored as a document or in a separate field if needed

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('You must be logged in to upload documents');
      return [];
    }

    const uploadedDocuments: ApplicationDocument[] = [];

    const { isOptimizableImage, optimizeImageForUpload } =
      await import('@/utils/imageOptimization');

    for (const file of files) {
      const fileToUpload = isOptimizableImage(file) ? await optimizeImageForUpload(file) : file;

      // Create a unique filename
      const fileName = `${user.id}/${applicationId}/${Date.now()}-${fileToUpload.name.replace(/\s/g, '_')}`;

      // Upload to Supabase Storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('application-documents')
        .upload(fileName, fileToUpload);

      if (uploadError) {
        console.error('Error uploading document:', uploadError);
        continue;
      }

      // Create document record
      const { data: documentData, error: docError } = await supabase
        .from('documents')
        .insert({
          name: fileToUpload.name,
          file_path: fileData?.path,
          file_type: fileToUpload.type,
          file_size: fileToUpload.size,
          category: 'Application',
          user_id: user.id,
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
          document_type: 'supporting_document',
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
        file_path: documentData.file_path,
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
export const getApplicationsByPropertyId = async (
  propertyId: string
): Promise<RentalApplication[]> => {
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('rental_applications')
      .select(
        `
        *,
        properties (
          name
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }

    return (data ?? []).map((app) => ({
      ...app,
      property_name: app.properties?.name,
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
      .select(
        `
        *,
        properties (
          name,
          owner_id,
          agent_id
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all applications:', error);
      throw error;
    }

    return data.map((app) => ({
      ...app,
      property_name: app.properties?.name,
    })) as RentalApplication[];
  } catch (error) {
    console.error('Error fetching all applications:', error);
    return [];
  }
};

/**
 * Idempotent in-app notification for the applicant after status changes.
 * Covers DB trigger gaps (RLS, missing migration, NOT NULL message column).
 */
async function ensureRentalApplicationStatusNotification(
  applicationId: string,
  status: RentalApplication['status']
): Promise<void> {
  if (!['approved', 'rejected', 'more_info'].includes(status)) return;

  const { data: app, error: fetchError } = await supabase
    .from('rental_applications')
    .select(
      `
      user_id,
      property_id,
      properties ( name )
    `
    )
    .eq('id', applicationId)
    .single();

  if (fetchError || !app?.user_id) {
    return;
  }

  const props = app.properties as { name?: string | null } | null | undefined;
  const pname = props?.name ?? null;
  const propertyLabel = pname ? `"${pname}"` : 'this property';

  const title =
    status === 'approved'
      ? 'Application approved'
      : status === 'rejected'
        ? 'Application not approved'
        : 'More information needed';

  const description =
    status === 'approved'
      ? `Your rental application for ${propertyLabel} was approved. Open Payments to complete rent or deposit.`
      : status === 'rejected'
        ? `Your rental application for ${propertyLabel} was not approved.`
        : `The property manager needs more information for your application${pname ? ` for "${pname}".` : '.'}`;

  const isApproved = status === 'approved';

  const { data: candidates } = await supabase
    .from('notifications')
    .select('id, metadata')
    .eq('user_id', app.user_id)
    .order('created_at', { ascending: false })
    .limit(40);

  const already =
    candidates?.some((n) => {
      const m = n.metadata as { application_id?: string; status?: string } | null | undefined;
      return m?.application_id === applicationId && m?.status === status;
    }) ?? false;

  if (already) return;

  const { error: insertError } = await supabase.from('notifications').insert({
    user_id: app.user_id,
    type: isApproved ? 'payment' : 'general',
    title,
    description,
    message: description,
    link: isApproved ? '/tenant/dashboard?tab=payments' : '/tenant/dashboard',
    metadata: {
      application_id: applicationId,
      property_id: app.property_id,
      status,
      ...(isApproved ? { primary_action: 'payment' as const } : {}),
    },
    is_read: false,
  });

  if (insertError) {
    console.warn('ensureRentalApplicationStatusNotification:', insertError.message);
  }
}

/**
 * Update application status
 */
export const updateApplicationStatus = async (
  applicationId: string,
  status: RentalApplication['status'],
  adminNotes?: string
): Promise<boolean> => {
  try {
    if (status === 'approved') {
      const { data: appRow, error: fetchErr } = await supabase
        .from('rental_applications')
        .select('property_id, unit_id')
        .eq('id', applicationId)
        .maybeSingle();

      if (fetchErr) {
        console.error('Error loading application for approval gate:', fetchErr);
      } else if (appRow?.property_id) {
        const gate = await canApproveRentalApplication(
          appRow.property_id,
          appRow.unit_id != null ? String(appRow.unit_id) : null
        );
        if (!gate.ok) {
          toast.error(gate.message || 'Cannot approve: property or unit is already leased.');
          return false;
        }
      }
    }

    const { error } = await supabase
      .from('rental_applications')
      .update({
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Error updating application status:', error);
      throw error;
    }

    await ensureRentalApplicationStatusNotification(applicationId, status);

    return true;
  } catch (error) {
    console.error('Error updating application status:', error);
    return false;
  }
};

/**
 * Get application details by ID
 */
export const getApplicationById = async (
  applicationId: string
): Promise<RentalApplication | null> => {
  try {
    const { data, error } = await supabase
      .from('rental_applications')
      .select(
        `
        *,
        properties (
          id,
          name,
          location,
          price,
          status,
          imageUrl
        )
      `
      )
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      property_name: data.properties?.name,
    } as RentalApplication;
  } catch (error) {
    console.error('Error fetching application by ID:', error);
    return null;
  }
};

/**
 * Get application documents
 */
export const getApplicationDocuments = async (
  applicationId: string
): Promise<ApplicationDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('application_documents')
      .select(
        `
        *,
        documents (
          id,
          name,
          file_path,
          file_type,
          file_size
        )
      `
      )
      .eq('application_id', applicationId);

    if (error) {
      console.error('Error fetching application documents:', error);
      throw error;
    }

    return data.map((doc) => ({
      ...doc,
      name: doc.documents?.name,
      file_path: doc.documents?.file_path,
      file_type: doc.documents?.file_type,
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
        status: 'draft',
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
    const { rows: data } = await fetchLeaseRows({ propertyId });

    if (!data?.length) return [];

    const enriched = await enrichRowsWithPropertiesAndTenants(data, {
      propertyColumns: 'id, name',
      tenantColumns: 'id, first_name, last_name',
    });

    return enriched.map((lease) => ({
      ...lease,
      tenant_name: lease.tenants
        ? `${lease.tenants.first_name ?? ''} ${lease.tenants.last_name ?? ''}`.trim() || 'Unknown'
        : 'Unknown',
      property_name: lease.properties?.name as string | undefined,
      status: normalizeLeaseAgreementStatus(lease.status),
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
      updated_at: new Date().toISOString(),
    };

    if (documentId) {
      updateData.document_id = documentId;
    }

    if (signedDate && status === 'signed') {
      updateData.signed_date = signedDate;
    }

    const { error } = await supabase.from('lease_agreements').update(updateData).eq('id', leaseId);

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
    const { rows: data } = await fetchLeaseRows({ tenantId });

    if (!data?.length) return [];

    const enriched = await enrichRowsWithPropertiesAndTenants(data, {
      propertyColumns: 'id, name, address, city, state, shortlet_details',
      tenantColumns: 'id, first_name, last_name',
    });

    return enriched.map((lease) => ({
      ...lease,
      property_name: lease.properties?.name as string | undefined,
      status: normalizeLeaseAgreementStatus(lease.status),
    })) as LeaseAgreement[];
  } catch (error) {
    console.error('Error fetching tenant leases:', error);
    return [];
  }
};
