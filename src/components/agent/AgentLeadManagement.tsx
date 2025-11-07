import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Star
} from 'lucide-react';
import { AgentLead } from '@/hooks/useEnhancedAgentData';

interface AgentLeadManagementProps {
  leads: AgentLead[];
  onUpdateLeadStatus: (leadId: string, status: string, notes?: string) => void;
  onAddNewLead: (leadData: Partial<AgentLead>) => void;
}

const AgentLeadManagement: React.FC<AgentLeadManagementProps> = ({
  leads,
  onUpdateLeadStatus,
  onAddNewLead
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<AgentLead | null>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newLeadData, setNewLeadData] = useState<Partial<AgentLead>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-purple-100 text-purple-800';
      case 'viewing_scheduled':
        return 'bg-orange-100 text-orange-800';
      case 'offer_made':
        return 'bg-indigo-100 text-indigo-800';
      case 'negotiating':
        return 'bg-pink-100 text-pink-800';
      case 'closed_won':
        return 'bg-green-100 text-green-800';
      case 'closed_lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProbabilityIcon = (probability: number) => {
    if (probability >= 75) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (probability >= 50) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    if (probability >= 25) return <TrendingUp className="h-4 w-4 text-orange-600" />;
    return <TrendingUp className="h-4 w-4 text-red-600" />;
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.preferred_location && lead.preferred_location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAddLead = () => {
    if (newLeadData.client_name && newLeadData.client_email && newLeadData.client_phone) {
      onAddNewLead(newLeadData);
      setNewLeadData({});
      setIsAddLeadOpen(false);
    }
  };

  const handleStatusUpdate = (leadId: string, newStatus: string) => {
    onUpdateLeadStatus(leadId, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
          <p className="text-gray-600">Track and manage your property leads</p>
        </div>
        
        <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add New Lead</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={newLeadData.client_name || ''}
                  onChange={(e) => setNewLeadData({...newLeadData, client_name: e.target.value})}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label htmlFor="client_email">Email *</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={newLeadData.client_email || ''}
                  onChange={(e) => setNewLeadData({...newLeadData, client_email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="client_phone">Phone *</Label>
                <Input
                  id="client_phone"
                  value={newLeadData.client_phone || ''}
                  onChange={(e) => setNewLeadData({...newLeadData, client_phone: e.target.value})}
                  placeholder="+234 XXX XXX XXXX"
                />
              </div>
              <div>
                <Label htmlFor="lead_source">Lead Source</Label>
                <Select value={newLeadData.lead_source || ''} onValueChange={(value) => setNewLeadData({...newLeadData, lead_source: value as any})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget_min">Budget Min (₦)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={newLeadData.budget_min || ''}
                  onChange={(e) => setNewLeadData({...newLeadData, budget_min: parseInt(e.target.value)})}
                  placeholder="Minimum budget"
                />
              </div>
              <div>
                <Label htmlFor="budget_max">Budget Max (₦)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={newLeadData.budget_max || ''}
                  onChange={(e) => setNewLeadData({...newLeadData, budget_max: parseInt(e.target.value)})}
                  placeholder="Maximum budget"
                />
              </div>
              <div>
                <Label htmlFor="preferred_location">Preferred Location</Label>
                <Input
                  id="preferred_location"
                  value={newLeadData.preferred_location || ''}
                  onChange={(e) => setNewLeadData({...newLeadData, preferred_location: e.target.value})}
                  placeholder="e.g., Lekki Phase 1"
                />
              </div>
              <div>
                <Label htmlFor="property_type">Property Type</Label>
                <Input
                  id="property_type"
                  value={newLeadData.property_type || ''}
                  onChange={(e) => setNewLeadData({...newLeadData, property_type: e.target.value})}
                  placeholder="e.g., 3-bedroom apartment"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newLeadData.notes || ''}
                  onChange={(e) => setNewLeadData({...newLeadData, notes: e.target.value})}
                  placeholder="Additional notes about the lead"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddLeadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLead}>
                Add Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search leads by name, email, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="viewing_scheduled">Viewing Scheduled</SelectItem>
                <SelectItem value="offer_made">Offer Made</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="closed_won">Closed Won</SelectItem>
                <SelectItem value="closed_lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{lead.client_name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getPriorityColor(lead.priority)}>
                      {lead.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getProbabilityIcon(lead.conversion_probability || 0)}
                  <span className="text-sm font-medium">{lead.conversion_probability || 0}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{lead.client_email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{lead.client_phone}</span>
                </div>
                {lead.preferred_location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{lead.preferred_location}</span>
                  </div>
                )}
                {lead.property_type && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{lead.property_type}</span>
                  </div>
                )}
              </div>

              {(lead.budget_min || lead.budget_max) && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {lead.budget_min && lead.budget_max 
                      ? `${formatCurrency(lead.budget_min)} - ${formatCurrency(lead.budget_max)}`
                      : lead.budget_min 
                        ? `From ${formatCurrency(lead.budget_min)}`
                        : `Up to ${formatCurrency(lead.budget_max || 0)}`
                    }
                  </span>
                </div>
              )}

              {lead.estimated_commission && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm font-medium text-green-800">Est. Commission</span>
                  <span className="text-sm font-bold text-green-900">
                    {formatCurrency(lead.estimated_commission)}
                  </span>
                </div>
              )}

              {lead.next_follow_up_date && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span className="text-gray-600">
                    Follow up: {new Date(lead.next_follow_up_date).toLocaleDateString('en-NG')}
                  </span>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedLead(lead)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Select onValueChange={(value) => handleStatusUpdate(lead.id, value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacted">Mark Contacted</SelectItem>
                    <SelectItem value="qualified">Mark Qualified</SelectItem>
                    <SelectItem value="viewing_scheduled">Schedule Viewing</SelectItem>
                    <SelectItem value="offer_made">Offer Made</SelectItem>
                    <SelectItem value="negotiating">Negotiating</SelectItem>
                    <SelectItem value="closed_won">Close Won</SelectItem>
                    <SelectItem value="closed_lost">Close Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters to see more leads.'
                : 'Start by adding your first lead to begin tracking potential clients.'}
            </p>
            <Button onClick={() => setIsAddLeadOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Lead
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{selectedLead.client_name}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={`${getStatusColor(selectedLead.status)} mt-1`}>
                    {selectedLead.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Priority</Label>
                  <Badge className={`${getPriorityColor(selectedLead.priority)} mt-1`}>
                    {selectedLead.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{selectedLead.client_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-sm">{selectedLead.client_phone}</p>
                </div>
              </div>

              {selectedLead.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedLead.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Close
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Lead
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AgentLeadManagement;
