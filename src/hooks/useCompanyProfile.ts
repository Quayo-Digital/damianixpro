import { useState, useEffect } from 'react';
import { useAuthSession } from '@/contexts/auth';
import { CompanyService } from '@/services/companyService';
import {
  CompanyProfile,
  CompanyTeamMember,
  CompanyDocument,
  UserCompanyProfile,
  CompanyProfileFormValues,
  TeamMemberFormValues,
  CompanyDocumentFormValues,
} from '@/types/company';
import { toast } from 'sonner';

export const useCompanyProfile = () => {
  const { user } = useAuthSession();
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [userCompanyProfile, setUserCompanyProfile] = useState<UserCompanyProfile | null>(null);
  const [teamMembers, setTeamMembers] = useState<CompanyTeamMember[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's company profile
  const loadUserCompanyProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const profile = await CompanyService.getUserCompanyProfile(user.id);
      setUserCompanyProfile(profile);

      if (profile?.company_id) {
        await loadCompanyProfile(profile.company_id);
      }
    } catch (err) {
      console.error('Error loading user company profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load company profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Load full company profile
  const loadCompanyProfile = async (companyId: string) => {
    try {
      const [profile, members, docs] = await Promise.all([
        CompanyService.getCompanyProfile(companyId),
        CompanyService.getTeamMembers(companyId),
        CompanyService.getCompanyDocuments(companyId),
      ]);

      setCompanyProfile(profile);
      setTeamMembers(members);
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading company profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load company data');
    }
  };

  // Create company profile
  const createCompanyProfile = async (
    data: CompanyProfileFormValues
  ): Promise<CompanyProfile | null> => {
    try {
      setIsLoading(true);
      const newProfile = await CompanyService.createCompanyProfile(data);
      setCompanyProfile(newProfile);

      // Update user company profile
      await loadUserCompanyProfile();

      toast.success('Company profile created successfully!');
      return newProfile;
    } catch (err) {
      console.error('Error creating company profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create company profile';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update company profile
  const updateCompanyProfile = async (
    data: Partial<CompanyProfileFormValues>
  ): Promise<boolean> => {
    if (!companyProfile?.id) return false;

    try {
      setIsLoading(true);
      const updatedProfile = await CompanyService.updateCompanyProfile(companyProfile.id, data);
      setCompanyProfile(updatedProfile);
      toast.success('Company profile updated successfully!');
      return true;
    } catch (err) {
      console.error('Error updating company profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update company profile';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Team member management
  const addTeamMember = async (data: TeamMemberFormValues): Promise<boolean> => {
    if (!companyProfile?.id) return false;

    try {
      const newMember = await CompanyService.addTeamMember(companyProfile.id, data);
      setTeamMembers((prev) => [newMember, ...prev]);
      toast.success('Team member added successfully!');
      return true;
    } catch (err) {
      console.error('Error adding team member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add team member';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const updateTeamMember = async (
    id: string,
    data: Partial<TeamMemberFormValues>
  ): Promise<boolean> => {
    try {
      const updatedMember = await CompanyService.updateTeamMember(id, data);
      setTeamMembers((prev) => prev.map((member) => (member.id === id ? updatedMember : member)));
      toast.success('Team member updated successfully!');
      return true;
    } catch (err) {
      console.error('Error updating team member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team member';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const removeTeamMember = async (id: string): Promise<boolean> => {
    try {
      await CompanyService.removeTeamMember(id);
      setTeamMembers((prev) => prev.filter((member) => member.id !== id));
      toast.success('Team member removed successfully!');
      return true;
    } catch (err) {
      console.error('Error removing team member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove team member';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const updateTeamMemberStatus = async (
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  ): Promise<boolean> => {
    try {
      await CompanyService.updateTeamMemberStatus(id, status);
      setTeamMembers((prev) =>
        prev.map((member) => (member.id === id ? { ...member, status } : member))
      );
      toast.success(`Team member status updated to ${status.toLowerCase()}!`);
      return true;
    } catch (err) {
      console.error('Error updating team member status:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update team member status';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  // Document management
  const uploadDocument = async (data: CompanyDocumentFormValues): Promise<boolean> => {
    if (!companyProfile?.id) return false;

    try {
      const newDocument = await CompanyService.uploadDocument(companyProfile.id, data);
      setDocuments((prev) => [newDocument, ...prev]);
      toast.success('Document uploaded successfully!');
      return true;
    } catch (err) {
      console.error('Error uploading document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const updateDocument = async (
    id: string,
    data: Partial<CompanyDocumentFormValues>
  ): Promise<boolean> => {
    try {
      const updatedDocument = await CompanyService.updateDocument(id, data);
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? updatedDocument : doc)));
      toast.success('Document updated successfully!');
      return true;
    } catch (err) {
      console.error('Error updating document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update document';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      await CompanyService.deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success('Document deleted successfully!');
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  // File upload helper
  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    try {
      const url = await CompanyService.uploadFile(file, bucket, path);
      return url;
    } catch (err) {
      console.error('Error uploading file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  };

  // Verification functions (admin only)
  const verifyCompany = async (
    status: 'VERIFIED' | 'REJECTED',
    notes?: string
  ): Promise<boolean> => {
    if (!companyProfile?.id) return false;

    try {
      const updatedProfile = await CompanyService.verifyCompany(companyProfile.id, status, notes);
      setCompanyProfile(updatedProfile);
      toast.success(`Company ${status.toLowerCase()} successfully!`);
      return true;
    } catch (err) {
      console.error('Error verifying company:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify company';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const verifyDocument = async (
    id: string,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string
  ): Promise<boolean> => {
    try {
      const updatedDocument = await CompanyService.verifyDocument(id, status, notes);
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? updatedDocument : doc)));
      toast.success(`Document ${status.toLowerCase()} successfully!`);
      return true;
    } catch (err) {
      console.error('Error verifying document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify document';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  // Settings management
  const updateNotificationPreferences = async (
    preferences: Record<string, boolean>
  ): Promise<boolean> => {
    if (!companyProfile?.id) return false;

    try {
      await CompanyService.updateNotificationPreferences(companyProfile.id, preferences);
      setCompanyProfile((prev) =>
        prev
          ? {
              ...prev,
              notification_preferences: { ...prev.notification_preferences, ...preferences },
            }
          : null
      );
      toast.success('Notification preferences updated!');
      return true;
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const updateBusinessHours = async (businessHours: Record<string, any>): Promise<boolean> => {
    if (!companyProfile?.id) return false;

    try {
      await CompanyService.updateBusinessHours(companyProfile.id, businessHours);
      setCompanyProfile((prev) =>
        prev
          ? {
              ...prev,
              business_hours: businessHours,
            }
          : null
      );
      toast.success('Business hours updated!');
      return true;
    } catch (err) {
      console.error('Error updating business hours:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update business hours';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  // Utility functions
  const hasCompanyProfile = (): boolean => {
    return !!userCompanyProfile?.company_id;
  };

  const isCompanyOwner = (): boolean => {
    return userCompanyProfile?.is_owner || false;
  };

  const canManageCompany = (): boolean => {
    return isCompanyOwner() || userCompanyProfile?.access_level === 'ADMIN';
  };

  const canManageTeam = (): boolean => {
    return canManageCompany() || userCompanyProfile?.access_level === 'MANAGER';
  };

  const getCompanyStats = () => {
    if (!companyProfile) return null;

    return {
      totalProperties: companyProfile.total_properties_managed,
      totalTransactions: companyProfile.total_transactions_completed,
      averageRating: companyProfile.average_rating,
      totalReviews: companyProfile.total_reviews,
      teamMembersCount: teamMembers.length,
      documentsCount: documents.length,
      verificationStatus: companyProfile.verification_status,
      subscriptionStatus: companyProfile.subscription_status,
    };
  };

  // Load data on mount and user change
  useEffect(() => {
    if (user?.id) {
      loadUserCompanyProfile();
    } else {
      setCompanyProfile(null);
      setUserCompanyProfile(null);
      setTeamMembers([]);
      setDocuments([]);
      setIsLoading(false);
    }
  }, [user?.id]);

  return {
    // State
    companyProfile,
    userCompanyProfile,
    teamMembers,
    documents,
    isLoading,
    error,

    // Company Profile Actions
    createCompanyProfile,
    updateCompanyProfile,
    loadCompanyProfile,
    loadUserCompanyProfile,

    // Team Management
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    updateTeamMemberStatus,

    // Document Management
    uploadDocument,
    updateDocument,
    deleteDocument,
    uploadFile,

    // Verification (Admin)
    verifyCompany,
    verifyDocument,

    // Settings
    updateNotificationPreferences,
    updateBusinessHours,

    // Utilities
    hasCompanyProfile,
    isCompanyOwner,
    canManageCompany,
    canManageTeam,
    getCompanyStats,

    // Clear error
    clearError: () => setError(null),
  };
};
