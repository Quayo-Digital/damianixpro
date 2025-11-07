import { supabase } from '@/integrations/supabase/client';
import { 
  CompanyProfile, 
  CompanyTeamMember, 
  CompanyDocument, 
  UserCompanyProfile,
  CompanyProfileFormValues,
  TeamMemberFormValues,
  CompanyDocumentFormValues
} from '@/types/company';

export class CompanyService {
  // Company Profile Management
  static async createCompanyProfile(data: CompanyProfileFormValues): Promise<CompanyProfile> {
    const { data: result, error } = await supabase
      .from('company_profiles')
      .insert({
        ...data,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async updateCompanyProfile(id: string, data: Partial<CompanyProfileFormValues>): Promise<CompanyProfile> {
    const { data: result, error } = await supabase
      .from('company_profiles')
      .update({
        ...data,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async getCompanyProfile(id: string): Promise<CompanyProfile | null> {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getUserCompanyProfile(userId?: string): Promise<UserCompanyProfile | null> {
    const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return null;

    const { data, error } = await supabase
      .rpc('get_user_company_profile', { user_uuid: currentUserId })
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getCompanyProfiles(filters?: {
    company_type?: string;
    verification_status?: string;
    state?: string;
    search?: string;
  }): Promise<CompanyProfile[]> {
    let query = supabase
      .from('company_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.company_type) {
      query = query.eq('company_type', filters.company_type);
    }

    if (filters?.verification_status) {
      query = query.eq('verification_status', filters.verification_status);
    }

    if (filters?.state) {
      query = query.eq('state', filters.state);
    }

    if (filters?.search) {
      query = query.textSearch('company_name', filters.search);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async deleteCompanyProfile(id: string): Promise<void> {
    const { error } = await supabase
      .from('company_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Team Member Management
  static async addTeamMember(companyId: string, data: TeamMemberFormValues): Promise<CompanyTeamMember> {
    const { data: result, error } = await supabase
      .from('company_team_members')
      .insert({
        company_id: companyId,
        ...data
      })
      .select(`
        *,
        user:user_id (
          id,
          email,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        )
      `)
      .single();

    if (error) throw error;
    return result;
  }

  static async updateTeamMember(id: string, data: Partial<TeamMemberFormValues>): Promise<CompanyTeamMember> {
    const { data: result, error } = await supabase
      .from('company_team_members')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        user:user_id (
          id,
          email,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        )
      `)
      .single();

    if (error) throw error;
    return result;
  }

  static async getTeamMembers(companyId: string): Promise<CompanyTeamMember[]> {
    const { data, error } = await supabase
      .from('company_team_members')
      .select(`
        *,
        user:user_id (
          id,
          email,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async removeTeamMember(id: string): Promise<void> {
    const { error } = await supabase
      .from('company_team_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async updateTeamMemberStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<void> {
    const { error } = await supabase
      .from('company_team_members')
      .update({ 
        status,
        leave_date: status === 'INACTIVE' ? new Date().toISOString() : null
      })
      .eq('id', id);

    if (error) throw error;
  }

  // Document Management
  static async uploadDocument(companyId: string, data: CompanyDocumentFormValues): Promise<CompanyDocument> {
    const { data: result, error } = await supabase
      .from('company_documents')
      .insert({
        company_id: companyId,
        ...data,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async updateDocument(id: string, data: Partial<CompanyDocumentFormValues>): Promise<CompanyDocument> {
    const { data: result, error } = await supabase
      .from('company_documents')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async getCompanyDocuments(companyId: string): Promise<CompanyDocument[]> {
    const { data, error } = await supabase
      .from('company_documents')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('company_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async verifyDocument(
    id: string, 
    status: 'VERIFIED' | 'REJECTED', 
    notes?: string
  ): Promise<CompanyDocument> {
    const { data: result, error } = await supabase
      .from('company_documents')
      .update({
        verification_status: status,
        verification_date: new Date().toISOString(),
        verified_by: (await supabase.auth.getUser()).data.user?.id,
        verification_notes: notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Company Verification
  static async verifyCompany(
    id: string, 
    status: 'VERIFIED' | 'REJECTED', 
    notes?: string
  ): Promise<CompanyProfile> {
    const { data: result, error } = await supabase
      .from('company_profiles')
      .update({
        verification_status: status,
        verification_date: new Date().toISOString(),
        verified_by: (await supabase.auth.getUser()).data.user?.id,
        verification_notes: notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // File Upload Helper
  static async uploadFile(file: File, bucket: string, path: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // Analytics and Reporting
  static async getCompanyStats(companyId: string): Promise<{
    totalProperties: number;
    totalTransactions: number;
    totalTeamMembers: number;
    documentsCount: number;
    verificationStatus: string;
    monthlyRevenue?: number;
  }> {
    // This would integrate with your existing analytics
    // For now, returning mock data structure
    return {
      totalProperties: 0,
      totalTransactions: 0,
      totalTeamMembers: 0,
      documentsCount: 0,
      verificationStatus: 'PENDING',
      monthlyRevenue: 0
    };
  }

  // Search and Discovery
  static async searchCompanies(query: string, filters?: {
    company_type?: string;
    state?: string;
    verification_status?: string;
  }): Promise<CompanyProfile[]> {
    let searchQuery = supabase
      .from('company_profiles')
      .select('*')
      .textSearch('company_name', query);

    if (filters?.company_type) {
      searchQuery = searchQuery.eq('company_type', filters.company_type);
    }

    if (filters?.state) {
      searchQuery = searchQuery.eq('state', filters.state);
    }

    if (filters?.verification_status) {
      searchQuery = searchQuery.eq('verification_status', filters.verification_status);
    }

    const { data, error } = await searchQuery;
    if (error) throw error;
    return data || [];
  }

  // Notification Management
  static async updateNotificationPreferences(
    companyId: string, 
    preferences: Record<string, boolean>
  ): Promise<void> {
    const { error } = await supabase
      .from('company_profiles')
      .update({
        notification_preferences: preferences,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', companyId);

    if (error) throw error;
  }

  // Business Hours Management
  static async updateBusinessHours(
    companyId: string, 
    businessHours: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('company_profiles')
      .update({
        business_hours: businessHours,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', companyId);

    if (error) throw error;
  }
}
