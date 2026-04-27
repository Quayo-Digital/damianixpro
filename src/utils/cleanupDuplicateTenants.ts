// Database Cleanup Utility for Duplicate Tenant Records
// This utility removes duplicate tenant records to fix PGRST116 console errors

import { supabase } from '@/integrations/supabase/client';

interface TenantRecord {
  id: string;
  user_id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
}

interface CleanupResult {
  success: boolean;
  duplicatesFound: number;
  duplicatesRemoved: number;
  errors: string[];
  message: string;
}

export async function cleanupDuplicateTenants(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: false,
    duplicatesFound: 0,
    duplicatesRemoved: 0,
    errors: [],
    message: '',
  };

  try {
    console.log('🔍 Starting duplicate tenant cleanup...');

    // Step 1: Fetch all tenant records
    const { data: allTenants, error: fetchError } = await supabase
      .from('tenants')
      .select('id, user_id, created_at, first_name, last_name, email, phone, status')
      .order('user_id', { ascending: true })
      .order('created_at', { ascending: false });

    if (fetchError) {
      result.errors.push(`Failed to fetch tenant records: ${fetchError.message}`);
      return result;
    }

    if (!allTenants || allTenants.length === 0) {
      result.message = 'No tenant records found';
      result.success = true;
      return result;
    }

    console.log(`📊 Found ${allTenants.length} total tenant records`);

    // Step 2: Identify duplicates by user_id
    const userIdGroups = new Map<string, TenantRecord[]>();

    allTenants.forEach((tenant) => {
      if (!tenant.user_id) return;

      if (!userIdGroups.has(tenant.user_id)) {
        userIdGroups.set(tenant.user_id, []);
      }
      userIdGroups.get(tenant.user_id)!.push(tenant);
    });

    // Step 3: Find user_ids with multiple records
    const duplicateGroups = Array.from(userIdGroups.entries()).filter(
      ([_, records]) => records.length > 1
    );

    result.duplicatesFound = duplicateGroups.length;

    if (duplicateGroups.length === 0) {
      result.message = 'No duplicate tenant records found';
      result.success = true;
      return result;
    }

    console.log(`🔍 Found ${duplicateGroups.length} user_ids with duplicate tenant records`);

    // Step 4: Remove duplicates, keeping the most recent record
    const recordsToDelete: string[] = [];

    duplicateGroups.forEach(([userId, records]) => {
      console.log(`👥 User ${userId} has ${records.length} tenant records`);

      // Sort by created_at descending, then by id descending to get the most recent
      records.sort((a, b) => {
        const dateCompare = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.id.localeCompare(a.id);
      });

      // Keep the first (most recent) record, mark others for deletion
      const [keepRecord, ...deleteRecords] = records;
      console.log(`✅ Keeping record ${keepRecord.id} (${keepRecord.created_at})`);

      deleteRecords.forEach((record) => {
        console.log(`❌ Marking for deletion: ${record.id} (${record.created_at})`);
        recordsToDelete.push(record.id);
      });
    });

    // Step 5: Delete duplicate records in batches
    if (recordsToDelete.length > 0) {
      console.log(`🗑️ Deleting ${recordsToDelete.length} duplicate records...`);

      // Delete in batches of 10 to avoid overwhelming the database
      const batchSize = 10;
      let deletedCount = 0;

      for (let i = 0; i < recordsToDelete.length; i += batchSize) {
        const batch = recordsToDelete.slice(i, i + batchSize);

        const { error: deleteError } = await supabase.from('tenants').delete().in('id', batch);

        if (deleteError) {
          result.errors.push(`Failed to delete batch ${i / batchSize + 1}: ${deleteError.message}`);
          console.error(`❌ Error deleting batch:`, deleteError);
        } else {
          deletedCount += batch.length;
          console.log(`✅ Deleted batch ${i / batchSize + 1} (${batch.length} records)`);
        }
      }

      result.duplicatesRemoved = deletedCount;
    }

    // Step 6: Verify cleanup
    const { data: remainingTenants, error: verifyError } = await supabase
      .from('tenants')
      .select('user_id')
      .not('user_id', 'is', null);

    if (verifyError) {
      result.errors.push(`Failed to verify cleanup: ${verifyError.message}`);
    } else {
      const remainingUserIds = new Set(remainingTenants?.map((t) => t.user_id) || []);
      const remainingDuplicates = remainingTenants?.length - remainingUserIds.size;

      if (remainingDuplicates > 0) {
        result.errors.push(`Still have ${remainingDuplicates} duplicate records after cleanup`);
      } else {
        console.log('✅ Cleanup verification successful - no duplicates remain');
      }
    }

    // Step 7: Generate result message
    if (result.errors.length === 0) {
      result.success = true;
      result.message = `Successfully cleaned up ${result.duplicatesRemoved} duplicate tenant records. Console errors should be resolved.`;
    } else {
      result.message = `Partial cleanup completed. Removed ${result.duplicatesRemoved} records but encountered ${result.errors.length} errors.`;
    }

    console.log('🎉 Duplicate tenant cleanup completed!');
    console.log(
      `📊 Summary: ${result.duplicatesFound} duplicates found, ${result.duplicatesRemoved} removed`
    );

    return result;
  } catch (error) {
    result.errors.push(
      `Unexpected error during cleanup: ${error instanceof Error ? error.message : String(error)}`
    );
    result.message = 'Cleanup failed due to unexpected error';
    console.error('❌ Cleanup failed:', error);
    return result;
  }
}

// Utility function to check for duplicate tenant records
export async function checkForDuplicateTenants(): Promise<{
  hasDuplicates: boolean;
  duplicateCount: number;
  totalTenants: number;
}> {
  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('user_id')
      .not('user_id', 'is', null);

    if (error) {
      console.error('Error checking for duplicates:', error);
      return { hasDuplicates: false, duplicateCount: 0, totalTenants: 0 };
    }

    const userIdCounts = new Map<string, number>();
    tenants?.forEach((tenant) => {
      const count = userIdCounts.get(tenant.user_id) || 0;
      userIdCounts.set(tenant.user_id, count + 1);
    });

    const duplicateUserIds = Array.from(userIdCounts.entries()).filter(([_, count]) => count > 1);

    return {
      hasDuplicates: duplicateUserIds.length > 0,
      duplicateCount: duplicateUserIds.length,
      totalTenants: tenants?.length || 0,
    };
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return { hasDuplicates: false, duplicateCount: 0, totalTenants: 0 };
  }
}
