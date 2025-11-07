
import { useState, useEffect } from 'react';
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PropertyFormValues } from "@/services/property/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface PropertyAgentAssignmentProps {
  form: UseFormReturn<PropertyFormValues>;
}

export function PropertyAgentAssignment({ form }: PropertyAgentAssignmentProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      
      try {
        console.log('Fetching agents from database...');
        
        // Fetch user_ids for users with the 'agent' role
        const { data: agentRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'agent');

        console.log('Agent roles query result:', { agentRoles, rolesError });

        if (rolesError) {
          console.error('Error fetching agent roles:', rolesError);
          throw rolesError;
        }
        
        const agentIds = agentRoles?.map(role => role.user_id) || [];
        console.log('Found agent IDs:', agentIds);

        if (agentIds.length > 0) {
          // Fetch profiles for the agent user_ids
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', agentIds);
          
          console.log('Profiles query result:', { profiles, profilesError });
          
          if (profilesError) {
            console.error('Error fetching agent profiles:', profilesError);
            throw profilesError;
          }

          if (profiles && profiles.length > 0) {
            const formattedAgents: Agent[] = profiles.map(profile => ({
              id: profile.id,
              name: profile.full_name || 'Unnamed Agent',
              email: profile.email || 'No email',
            }));
            console.log('Formatted agents:', formattedAgents);
            setAgents(formattedAgents);
          } else {
            console.log('No agent profiles found');
            setAgents([]);
          }
        } else {
          console.log('No users with agent role found');
          setAgents([]);
        }
        
      } catch (error) {
        console.error('Error fetching agents:', error);
        setAgents([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAgents();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assign Agent</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="agent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned Agent</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value} 
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
      </CardContent>
    </Card>
  );
}
