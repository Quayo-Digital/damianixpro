import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { PropertyFormValues } from '@/services/property/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import { Phone, Briefcase, Star, User, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { profileFullName } from '@/lib/profileDisplayName';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specializations?: string[];
  working_areas?: string[];
  years_of_experience?: number;
  rating?: number;
  total_reviews?: number;
  properties_managed?: number;
  bio?: string;
}

interface PropertyAgentAssignmentProps {
  form: UseFormReturn<PropertyFormValues>;
  propertyId?: string; // For existing properties
  onAgentAssigned?: (agentId: string) => void; // Callback when agent is assigned
}

export function PropertyAgentAssignment({
  form,
  propertyId,
  onAgentAssigned,
}: PropertyAgentAssignmentProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { user } = useAuthSession();
  const { toast } = useToast();

  const selectedAgentId = form.watch('agent_id');
  const commissionRate = form.watch('agent_commission_rate');

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);

      try {
        console.log('🔍 Fetching agents from database...');

        // SIMPLIFIED APPROACH: Single query path
        // Step 1: Get all users with 'agent' role from user_roles table
        const { data: agentRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'agent');

        if (rolesError) {
          console.error('❌ Error fetching agent roles:', rolesError);
          setAgents([]);
          return;
        }

        if (!agentRoles || agentRoles.length === 0) {
          console.log('ℹ️ No agents found in user_roles table');
          console.log('💡 Tip: Agents need to complete onboarding to appear here');
          setAgents([]);
          return;
        }

        const agentIds = agentRoles.map((role) => role.user_id);
        console.log(`✅ Found ${agentIds.length} agent(s) in user_roles:`, agentIds);

        // Step 2: Fetch profiles for these agent IDs
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, bio')
          .in('id', agentIds);

        if (profilesError) {
          console.error('❌ Error fetching agent profiles:', profilesError);
          console.error('❌ Full error details:', JSON.stringify(profilesError, null, 2));
          console.error('❌ Agent IDs that were queried:', agentIds);
          setAgents([]);
          return;
        }

        if (!profiles || profiles.length === 0) {
          console.log('ℹ️ No profiles found for agent IDs:', agentIds);
          console.log('💡 This might be due to RLS policies blocking the query');
          console.log(
            '💡 Tip: Check if the profiles table RLS policy allows owners to view agent profiles'
          );
          setAgents([]);
          return;
        }

        console.log(`✅ Found ${profiles.length} agent profile(s)`);

        // Step 3: Fetch additional agent data from agents table (optional - may fail due to RLS)
        const { data: agentsData, error: agentsError } = await supabase
          .from('agents')
          .select(
            'user_id, specializations, working_areas, years_of_experience, rating, total_reviews, properties_managed, status'
          )
          .in('user_id', agentIds);

        if (agentsError) {
          console.warn(
            '⚠️ Could not fetch additional agent data (RLS may be blocking):',
            agentsError.message
          );
          // Continue without agent data - we'll use profile data only
        }

        // Step 4: Combine profile and agent data
        const agentsMap = new Map((agentsData || []).map((agent) => [agent.user_id, agent]));

        const formattedAgents: Agent[] = profiles.map((profile) => {
          const agentData = agentsMap.get(profile.id);
          return {
            id: profile.id,
            name: profileFullName(profile) || 'Unnamed Agent',
            email: profile.email || 'No email',
            phone: profile.phone || undefined,
            specializations: agentData?.specializations || undefined,
            working_areas: agentData?.working_areas || undefined,
            years_of_experience: agentData?.years_of_experience || undefined,
            rating: agentData?.rating ? Number(agentData.rating) : undefined,
            total_reviews: agentData?.total_reviews || undefined,
            properties_managed: agentData?.properties_managed || undefined,
            bio: (profile as any).bio || undefined,
          };
        });

        console.log(
          `✅ Successfully loaded ${formattedAgents.length} agent(s):`,
          formattedAgents.map((a) => a.name)
        );
        setAgents(formattedAgents);
      } catch (error) {
        console.error('❌ Unexpected error fetching agents:', error);
        setAgents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Update selected agent when agent_id changes
  useEffect(() => {
    if (
      selectedAgentId &&
      selectedAgentId !== 'none' &&
      selectedAgentId !== 'loading' &&
      selectedAgentId !== 'no-agents'
    ) {
      const agent = agents.find((a) => a.id === selectedAgentId);
      setSelectedAgent(agent || null);
    } else {
      setSelectedAgent(null);
    }
  }, [selectedAgentId, agents]);

  const handleAssignAgent = async () => {
    if (!selectedAgentId || selectedAgentId === 'none') {
      toast({
        title: 'No Agent Selected',
        description: 'Please select an agent first.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to assign an agent.',
        variant: 'destructive',
      });
      return;
    }

    setIsAssigning(true);

    // Show immediate feedback
    toast({
      title: 'Assigning Agent...',
      description: 'Please wait while we assign the agent and send notifications.',
    });

    try {
      // Get property name from form
      const propertyName = form.getValues('name') || 'New Property';

      // Get owner details
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', user.id)
        .single();

      const ownerName =
        (ownerProfile && profileFullName(ownerProfile)) || user.email || 'Property Owner';
      const ownerEmail = ownerProfile?.email || user.email || '';
      const ownerPhone = ownerProfile?.phone || undefined;

      // If propertyId exists, update the property's agent_id
      if (propertyId) {
        const { error: updateError } = await supabase
          .from('properties')
          .update({ agent_id: selectedAgentId })
          .eq('id', propertyId);

        if (updateError) {
          throw updateError;
        }
      }

      // Send notification to agent
      const { sendAgentAssignmentNotification } = await import('@/services/notifications/agent');
      const notificationResult = await sendAgentAssignmentNotification({
        agentId: selectedAgentId,
        propertyId: propertyId || 'new', // Use 'new' for properties being created
        propertyName: propertyName,
        ownerId: user.id,
        ownerName: ownerName,
        ownerEmail: ownerEmail,
        ownerPhone: ownerPhone,
        commissionRate: commissionRate || '0.03',
      });

      if (notificationResult.success) {
        toast({
          title: 'Agent Assigned Successfully',
          description: `${selectedAgent?.name || 'Agent'} has been notified of the assignment.`,
        });

        // Call the callback if provided
        if (onAgentAssigned) {
          onAgentAssigned(selectedAgentId);
        }
      } else {
        throw new Error('Failed to send notification to agent');
      }
    } catch (error: any) {
      console.error('Error assigning agent:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign agent. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assign Agent</CardTitle>
        <CardDescription>
          Select an agent to manage this property. The agent will be notified with your contact
          details and commission rate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="agent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select an Agent</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === 'none') {
                    setSelectedAgent(null);
                  }
                }}
                value={field.value || ''}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None (Manage yourself)</SelectItem>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading agents...
                    </SelectItem>
                  ) : agents.length === 0 ? (
                    <SelectItem value="no-agents" disabled>
                      No agents found in database
                    </SelectItem>
                  ) : (
                    agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Agent Details Display */}
        {selectedAgent && selectedAgentId !== 'none' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="flex items-center gap-2 text-lg font-semibold">
                    <User className="h-5 w-5" />
                    {selectedAgent.name}
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedAgent.email}</p>
                </div>
                {selectedAgent.rating !== undefined && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{selectedAgent.rating.toFixed(1)}</span>
                    {selectedAgent.total_reviews !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({selectedAgent.total_reviews} reviews)
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                {selectedAgent.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedAgent.phone}</span>
                  </div>
                )}
                {selectedAgent.years_of_experience !== undefined && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedAgent.years_of_experience} years experience</span>
                  </div>
                )}
                {selectedAgent.properties_managed !== undefined && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedAgent.properties_managed} properties managed</span>
                  </div>
                )}
              </div>

              {selectedAgent.specializations && selectedAgent.specializations.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedAgent.working_areas && selectedAgent.working_areas.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Working Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.working_areas.map((area, index) => (
                      <Badge key={index} variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedAgent.bio && (
                <div>
                  <p className="mb-1 text-sm font-medium">About</p>
                  <p className="text-sm text-muted-foreground">{selectedAgent.bio}</p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={handleAssignAgent}
                  disabled={isAssigning}
                  className="w-full"
                  variant={isAssigning ? 'default' : 'default'}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning Agent...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Assign Agent
                    </>
                  )}
                </Button>
                {isAssigning && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing assignment and sending notification...</span>
                  </div>
                )}
                {!isAssigning && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Agent will receive a notification with property details and commission rate (
                    {((parseFloat(commissionRate || '0.03') || 0.03) * 100).toFixed(2)}%)
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
