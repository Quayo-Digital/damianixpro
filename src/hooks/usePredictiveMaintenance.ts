// Predictive Maintenance React Hook

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import {
  PredictiveAlert,
  MaintenanceSchedule,
  MaintenanceInsight,
  MaintenanceAnalytics,
  EquipmentData,
  MaintenanceRecord,
  PropertyMaintenanceProfile,
  PredictiveMaintenanceSettings,
  MaintenanceFilters,
  MaintenanceSortOptions
} from '@/types/predictiveMaintenance';
import { PredictiveMaintenanceService } from '@/services/ai/predictiveMaintenance';

interface UsePredictiveMaintenanceOptions {
  propertyId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const usePredictiveMaintenance = (options: UsePredictiveMaintenanceOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { propertyId, autoRefresh = true, refreshInterval = 300000 } = options; // 5 minutes default

  const [filters, setFilters] = useState<MaintenanceFilters>({});
  const [sortOptions, setSortOptions] = useState<MaintenanceSortOptions>({
    field: 'predicted_failure_date',
    direction: 'asc'
  });

  // Fetch predictive alerts
  const {
    data: alerts = [],
    isLoading: isLoadingAlerts,
    error: alertsError,
    refetch: refetchAlerts
  } = useQuery({
    queryKey: ['predictive-alerts', propertyId, user?.id, filters, sortOptions],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('predictive_alerts')
        .select('*');

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        // Get user's properties first
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);
        
        if (properties && properties.length > 0) {
          const propertyIds = properties.map(p => p.id);
          query = query.in('property_id', propertyIds);
        }
      }

      // Apply filters
      if (filters.categories?.length) {
        query = query.in('category', filters.categories);
      }
      if (filters.priorities?.length) {
        query = query.in('priority', filters.priorities);
      }
      if (filters.risk_levels?.length) {
        query = query.in('risk_level', filters.risk_levels);
      }
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.date_range) {
        query = query
          .gte('predicted_failure_date', filters.date_range.start)
          .lte('predicted_failure_date', filters.date_range.end);
      }

      // Apply sorting
      query = query.order(sortOptions.field, { ascending: sortOptions.direction === 'asc' });

      const { data, error } = await query;
      if (error) throw error;
      
      return data as PredictiveAlert[];
    },
    enabled: !!user?.id,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 60000 // 1 minute
  });

  // Fetch maintenance schedule
  const {
    data: schedule = [],
    isLoading: isLoadingSchedule,
    refetch: refetchSchedule
  } = useQuery({
    queryKey: ['maintenance-schedule', propertyId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('is_active', true);

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);
        
        if (properties && properties.length > 0) {
          const propertyIds = properties.map(p => p.id);
          query = query.in('property_id', propertyIds);
        }
      }

      const { data, error } = await query.order('next_due', { ascending: true });
      if (error) throw error;
      
      return data as MaintenanceSchedule[];
    },
    enabled: !!user?.id,
    refetchInterval: autoRefresh ? refreshInterval : false
  });

  // Fetch equipment data
  const {
    data: equipment = [],
    isLoading: isLoadingEquipment
  } = useQuery({
    queryKey: ['equipment-data', propertyId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('equipment_data')
        .select(`
          *,
          maintenance_history:maintenance_records(*),
          sensor_data:sensor_readings(*)
        `);

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);
        
        if (properties && properties.length > 0) {
          const propertyIds = properties.map(p => p.id);
          query = query.in('property_id', propertyIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data as EquipmentData[];
    },
    enabled: !!user?.id
  });

  // Fetch maintenance insights
  const {
    data: insights = [],
    isLoading: isLoadingInsights
  } = useQuery({
    queryKey: ['maintenance-insights', propertyId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('maintenance_insights')
        .select('*');

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);
        
        if (properties && properties.length > 0) {
          const propertyIds = properties.map(p => p.id);
          query = query.in('property_id', propertyIds);
        }
      }

      const { data, error } = await query.order('impact_score', { ascending: false });
      if (error) throw error;
      
      return data as MaintenanceInsight[];
    },
    enabled: !!user?.id,
    refetchInterval: autoRefresh ? refreshInterval * 2 : false // Less frequent updates
  });

  // Fetch analytics
  const {
    data: analytics,
    isLoading: isLoadingAnalytics
  } = useQuery({
    queryKey: ['maintenance-analytics', propertyId, user?.id],
    queryFn: async () => {
      if (!alerts.length || !equipment.length) return null;
      
      // Get maintenance history
      const { data: history } = await supabase
        .from('maintenance_records')
        .select('*')
        .in('property_id', propertyId ? [propertyId] : alerts.map(a => a.property_id));

      return PredictiveMaintenanceService.calculateAnalytics(
        alerts,
        history || [],
        equipment
      );
    },
    enabled: !!user?.id && alerts.length > 0 && equipment.length > 0
  });

  // Generate new predictions
  const generatePredictionsMutation = useMutation({
    mutationFn: async (targetPropertyId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get property data
      const { data: propertyEquipment } = await supabase
        .from('equipment_data')
        .select(`
          *,
          maintenance_history:maintenance_records(*),
          sensor_data:sensor_readings(*)
        `)
        .eq('property_id', targetPropertyId);

      const { data: maintenanceHistory } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('property_id', targetPropertyId);

      const { data: propertyProfile } = await supabase
        .from('property_maintenance_profiles')
        .select('*')
        .eq('property_id', targetPropertyId)
        .single();

      if (!propertyEquipment || !propertyProfile) {
        throw new Error('Property data not found');
      }

      // Generate predictions
      const newAlerts = await PredictiveMaintenanceService.generatePredictiveAlerts(
        targetPropertyId,
        propertyEquipment,
        maintenanceHistory || [],
        propertyProfile
      );

      // Save new alerts to database
      if (newAlerts.length > 0) {
        const { error } = await supabase
          .from('predictive_alerts')
          .upsert(newAlerts, { onConflict: 'id' });

        if (error) throw error;
      }

      return newAlerts;
    },
    onSuccess: (newAlerts) => {
      queryClient.invalidateQueries({ queryKey: ['predictive-alerts'] });
      toast.success(`Generated ${newAlerts.length} new predictive alerts`);
    },
    onError: (error: any) => {
      toast.error(`Failed to generate predictions: ${error.message}`);
    }
  });

  // Update alert status
  const updateAlertMutation = useMutation({
    mutationFn: async ({ alertId, status, notes }: { 
      alertId: string; 
      status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
      notes?: string;
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.resolved_at = new Date().toISOString();
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('predictive_alerts')
        .update(updateData)
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictive-alerts'] });
      toast.success('Alert updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update alert: ${error.message}`);
    }
  });

  // Schedule maintenance
  const scheduleMaintenanceMutation = useMutation({
    mutationFn: async (scheduleData: Partial<MaintenanceSchedule>) => {
      const { error } = await supabase
        .from('maintenance_schedules')
        .insert({
          ...scheduleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedule'] });
      toast.success('Maintenance scheduled successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to schedule maintenance: ${error.message}`);
    }
  });

  // Update equipment condition
  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ 
      equipmentId, 
      condition, 
      notes 
    }: { 
      equipmentId: string; 
      condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('equipment_data')
        .update({
          current_condition: condition,
          updated_at: new Date().toISOString(),
          ...(notes && { notes })
        })
        .eq('id', equipmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-data'] });
      queryClient.invalidateQueries({ queryKey: ['predictive-alerts'] });
      toast.success('Equipment condition updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update equipment: ${error.message}`);
    }
  });

  // Utility functions
  const getAlertsByPriority = useCallback((priority: 'critical' | 'high' | 'medium' | 'low') => {
    return alerts.filter(alert => alert.priority === priority);
  }, [alerts]);

  const getAlertsByCategory = useCallback((category: string) => {
    return alerts.filter(alert => alert.category === category);
  }, [alerts]);

  const getUpcomingMaintenance = useCallback((days: number = 30) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return schedule.filter(item => {
      const dueDate = new Date(item.next_due);
      return dueDate <= futureDate;
    });
  }, [schedule]);

  const getTotalPredictedSavings = useCallback(() => {
    return alerts.reduce((total, alert) => total + alert.potential_savings, 0);
  }, [alerts]);

  const getCriticalAlertsCount = useCallback(() => {
    return alerts.filter(alert => alert.priority === 'critical').length;
  }, [alerts]);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      refetchAlerts(),
      refetchSchedule(),
      queryClient.invalidateQueries({ queryKey: ['equipment-data'] }),
      queryClient.invalidateQueries({ queryKey: ['maintenance-insights'] }),
      queryClient.invalidateQueries({ queryKey: ['maintenance-analytics'] })
    ]);
  }, [refetchAlerts, refetchSchedule, queryClient]);

  return {
    // Data
    alerts,
    schedule,
    equipment,
    insights,
    analytics,
    
    // Loading states
    isLoading: isLoadingAlerts || isLoadingSchedule || isLoadingEquipment || isLoadingInsights,
    isLoadingAlerts,
    isLoadingSchedule,
    isLoadingEquipment,
    isLoadingInsights,
    isLoadingAnalytics,
    
    // Error states
    error: alertsError,
    
    // Mutations
    generatePredictions: generatePredictionsMutation.mutate,
    isGeneratingPredictions: generatePredictionsMutation.isPending,
    updateAlert: updateAlertMutation.mutate,
    isUpdatingAlert: updateAlertMutation.isPending,
    scheduleMaintenance: scheduleMaintenanceMutation.mutate,
    isSchedulingMaintenance: scheduleMaintenanceMutation.isPending,
    updateEquipment: updateEquipmentMutation.mutate,
    isUpdatingEquipment: updateEquipmentMutation.isPending,
    
    // Filters and sorting
    filters,
    setFilters,
    sortOptions,
    setSortOptions,
    
    // Utility functions
    getAlertsByPriority,
    getAlertsByCategory,
    getUpcomingMaintenance,
    getTotalPredictedSavings,
    getCriticalAlertsCount,
    refreshAllData
  };
};

// Specialized hooks for specific use cases
export const usePropertyMaintenance = (propertyId: string) => {
  return usePredictiveMaintenance({ propertyId, autoRefresh: true });
};

export const useMaintenanceAlerts = (options: UsePredictiveMaintenanceOptions = {}) => {
  const { alerts, isLoadingAlerts, getAlertsByPriority, getCriticalAlertsCount } = usePredictiveMaintenance(options);
  
  return {
    alerts,
    isLoading: isLoadingAlerts,
    criticalAlerts: getAlertsByPriority('critical'),
    highPriorityAlerts: getAlertsByPriority('high'),
    criticalCount: getCriticalAlertsCount()
  };
};

export const useMaintenanceSchedule = (propertyId?: string) => {
  const { schedule, isLoadingSchedule, getUpcomingMaintenance } = usePredictiveMaintenance({ propertyId });
  
  return {
    schedule,
    isLoading: isLoadingSchedule,
    upcomingMaintenance: getUpcomingMaintenance(),
    overdueMaintenance: schedule.filter(item => new Date(item.next_due) < new Date())
  };
};
