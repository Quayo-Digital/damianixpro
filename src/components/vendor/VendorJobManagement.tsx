import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

interface VendorJob {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  property_id: string;
  property_address?: string;
  estimated_cost: number;
  actual_cost?: number;
  scheduled_date?: string;
  completed_date?: string;
  customer_rating?: number;
  customer_feedback?: string;
  created_at: string;
  updated_at: string;
}

interface VendorJobManagementProps {
  jobs: VendorJob[];
  onUpdateJobStatus: (jobId: string, status: string, notes?: string) => Promise<void>;
  onUpdateJobCost: (jobId: string, actualCost: number) => Promise<void>;
  isLoading?: boolean;
}

export const VendorJobManagement: React.FC<VendorJobManagementProps> = ({
  jobs,
  onUpdateJobStatus,
  onUpdateJobCost,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<VendorJob | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [actualCost, setActualCost] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'scheduled':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityVariant = (priority: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [jobs, searchTerm, statusFilter, priorityFilter]);

  const jobsByStatus = useMemo(() => {
    return {
      scheduled: filteredJobs.filter(job => job.status === 'scheduled'),
      in_progress: filteredJobs.filter(job => job.status === 'in_progress'),
      completed: filteredJobs.filter(job => job.status === 'completed'),
      cancelled: filteredJobs.filter(job => job.status === 'cancelled')
    };
  }, [filteredJobs]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedJob) return;
    
    try {
      await onUpdateJobStatus(selectedJob.id, newStatus, updateNotes);
      setIsUpdateDialogOpen(false);
      setUpdateNotes('');
      setSelectedJob(null);
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const handleCostUpdate = async () => {
    if (!selectedJob || !actualCost) return;
    
    try {
      await onUpdateJobCost(selectedJob.id, parseFloat(actualCost));
      setActualCost('');
    } catch (error) {
      console.error('Failed to update job cost:', error);
    }
  };

  const JobCard = ({ job }: { job: VendorJob }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {job.category}
              </Badge>
              <Badge variant={getPriorityVariant(job.priority)} className="text-xs">
                {job.priority.toUpperCase()}
              </Badge>
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon(job.status)}
            <Badge variant={getStatusVariant(job.status)} className="text-xs">
              {job.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {job.description}
        </p>
        
        <div className="space-y-2">
          {job.property_address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{job.property_address}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-600">
              {formatCurrency(job.estimated_cost)}
            </span>
            {job.actual_cost && job.actual_cost !== job.estimated_cost && (
              <span className="text-muted-foreground">
                (Actual: {formatCurrency(job.actual_cost)})
              </span>
            )}
          </div>
          
          {job.scheduled_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Scheduled: {format(new Date(job.scheduled_date), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
          
          {job.customer_rating && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{job.customer_rating.toFixed(1)}</span>
              {job.customer_feedback && (
                <span className="text-muted-foreground truncate">
                  "{job.customer_feedback}"
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{job.title}</DialogTitle>
                <DialogDescription>
                  Job details and information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm text-muted-foreground">{job.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <Badge variant={getPriorityVariant(job.priority)} className="text-xs">
                      {job.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(job.status)}
                      <span className="text-sm">{job.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Estimated Cost</Label>
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(job.estimated_cost)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{job.description}</p>
                </div>
                
                {job.property_address && (
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm text-muted-foreground mt-1">{job.property_address}</p>
                  </div>
                )}
                
                {job.customer_feedback && (
                  <div>
                    <Label className="text-sm font-medium">Customer Feedback</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{job.customer_rating?.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">"{job.customer_feedback}"</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {job.status !== 'completed' && job.status !== 'cancelled' && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
                setSelectedJob(job);
                setIsUpdateDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Update
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Management</CardTitle>
          <CardDescription>Loading your jobs...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Management
          </CardTitle>
          <CardDescription>
            Manage your assigned jobs, update status, and track progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                All ({filteredJobs.length})
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                Scheduled ({jobsByStatus.scheduled.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                Active ({jobsByStatus.in_progress.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({jobsByStatus.completed.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({jobsByStatus.cancelled.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No jobs found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </TabsContent>

            {Object.entries(jobsByStatus).map(([status, statusJobs]) => (
              <TabsContent key={status} value={status} className="space-y-4">
                {statusJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No {status.replace('_', ' ')} jobs found.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {statusJobs.map(job => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Update Job Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Job Status</DialogTitle>
            <DialogDescription>
              Update the status of "{selectedJob?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select onValueChange={(value) => handleStatusUpdate(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {selectedJob?.status === 'scheduled' && (
                    <SelectItem value="in_progress">Start Job</SelectItem>
                  )}
                  {selectedJob?.status === 'in_progress' && (
                    <SelectItem value="completed">Mark Complete</SelectItem>
                  )}
                  {selectedJob?.status !== 'cancelled' && (
                    <SelectItem value="cancelled">Cancel Job</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status update..."
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
              />
            </div>

            {selectedJob?.status === 'in_progress' && (
              <div>
                <Label htmlFor="actualCost">Actual Cost (Optional)</Label>
                <Input
                  id="actualCost"
                  type="number"
                  placeholder="Enter actual cost"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                />
                {actualCost && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCostUpdate}
                    className="mt-2"
                  >
                    Update Cost
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
