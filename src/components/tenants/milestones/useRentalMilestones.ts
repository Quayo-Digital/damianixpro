import { useState, useEffect, useMemo } from 'react';
import { toast } from '@/components/ui/sonner';
import {
  fetchMilestones,
  updateMilestoneNotificationSent,
  checkAndSyncMilestones,
} from '@/services/tenants/milestoneApi';
import { Milestone, MilestoneFilterType } from './types';

export function useRentalMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<MilestoneFilterType>('all');

  const loadMilestones = async () => {
    setIsLoading(true);
    try {
      const fetchedMilestones = await fetchMilestones();
      setMilestones(fetchedMilestones);
    } catch (error) {
      console.error('Error loading milestones:', error);
      toast.error('Failed to load rental milestones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMilestones();
  }, []);

  const handleCheckMilestones = async () => {
    try {
      toast.loading('Checking for upcoming milestones...');
      await checkAndSyncMilestones();
      await loadMilestones();
      toast.success('Milestone check completed');
    } catch (error) {
      console.error('Error checking milestones:', error);
      toast.error('Failed to check milestones');
    }
  };

  const handleSendNotification = async (milestoneId: string) => {
    try {
      toast.loading('Sending notification...');
      const updatedMilestone = await updateMilestoneNotificationSent(milestoneId);
      setMilestones((prev) => prev.map((m) => (m.id === milestoneId ? updatedMilestone : m)));
      toast.success('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const filteredMilestones = useMemo(
    () => (filter === 'all' ? milestones : milestones.filter((m) => m.status === filter)),
    [filter, milestones]
  );

  return {
    isLoading,
    filter,
    setFilter,
    handleCheckMilestones,
    handleSendNotification,
    filteredMilestones,
  };
}
