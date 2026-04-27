import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MaintenanceRequestForm } from '@/components/maintenance/request-form/MaintenanceRequestForm';
import { MaintenanceRequest } from '@/components/communication/maintenance/maintenance-data';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Calendar,
  DollarSign,
  User,
  Phone,
  MessageSquare,
  Camera,
  Filter,
  Search,
  Eye,
  TrendingUp,
  BarChart3,
  Zap,
  Droplets,
  Wind,
  Shield,
  Bug,
  Hammer,
} from 'lucide-react';
import { useEnhancedTenantData } from '@/hooks/useEnhancedTenantData';

// Nigerian currency formatter
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Safe date formatter with fallback
const formatDate = (dateString: string | null | undefined, fallback?: string): string => {
  if (!dateString) {
    return fallback || 'Not available';
  }

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return fallback || 'Invalid date';
  }

  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function TenantMaintenanceSupport() {
  const { maintenanceRequests, stats, analytics, loading, error } = useEnhancedTenantData();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [requestFilter, setRequestFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleRequestSuccess = (newRequest: MaintenanceRequest) => {
    setNewRequestOpen(false);
    toast({
      title: 'Request Submitted',
      description: 'Your maintenance request has been submitted successfully.',
    });
    // The component will automatically refetch via React Query in useEnhancedTenantData
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-8 w-1/2 rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats || !analytics) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading maintenance data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredRequests = maintenanceRequests.filter((request) => {
    const matchesFilter = requestFilter === 'all' || request.status === requestFilter;
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'plumbing':
        return <Droplets className="h-4 w-4" />;
      case 'electrical':
        return <Zap className="h-4 w-4" />;
      case 'hvac':
        return <Wind className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'pest_control':
        return <Bug className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.maintenanceRequestsSubmitted}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.maintenanceRequestsCompleted}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageMaintenanceResponseTime}
                </p>
                <p className="text-sm text-gray-500">days</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.tenantSatisfactionScore.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500">out of 5.0</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Maintenance Actions</span>
            <Button onClick={() => setNewRequestOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center space-y-2 p-4"
              onClick={() => setNewRequestOpen(true)}
            >
              <Droplets className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Plumbing</span>
              <span className="text-xs text-gray-500">Leaks, clogs, etc.</span>
            </Button>

            <Button
              variant="outline"
              className="flex h-auto flex-col items-center space-y-2 p-4"
              onClick={() => setNewRequestOpen(true)}
            >
              <Zap className="h-6 w-6 text-yellow-600" />
              <span className="font-medium">Electrical</span>
              <span className="text-xs text-gray-500">Outlets, lights, etc.</span>
            </Button>

            <Button
              variant="outline"
              className="flex h-auto flex-col items-center space-y-2 p-4"
              onClick={() => setNewRequestOpen(true)}
            >
              <Wind className="h-6 w-6 text-green-600" />
              <span className="font-medium">HVAC</span>
              <span className="text-xs text-gray-500">AC, heating, etc.</span>
            </Button>

            <Button
              variant="outline"
              className="flex h-auto flex-col items-center space-y-2 p-4"
              onClick={() => setNewRequestOpen(true)}
            >
              <Hammer className="h-6 w-6 text-gray-600" />
              <span className="font-medium">Other</span>
              <span className="text-xs text-gray-500">General repairs</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Analytics */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Maintenance Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Category Breakdown */}
              <div className="space-y-4">
                <h4 className="font-medium">Requests by Category</h4>
                <div className="space-y-3">
                  {analytics.maintenanceMetrics.categoryBreakdown.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                    >
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(category.category)}
                        <div>
                          <div className="font-medium capitalize">
                            {category.category.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-gray-500">{category.count} requests</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(category.averageCost)}</div>
                        <div className="text-sm text-gray-500">avg cost</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Satisfaction by Category */}
              <div className="space-y-4">
                <h4 className="font-medium">Satisfaction by Category</h4>
                <div className="space-y-3">
                  {analytics.maintenanceMetrics.satisfactionByCategory.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {category.category.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-600">
                          {category.satisfaction.toFixed(1)}/5.0
                        </span>
                      </div>
                      <Progress value={(category.satisfaction / 5) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-blue-600">
                  {analytics.maintenanceMetrics.requestFrequency.toFixed(1)}
                </div>
                <p className="text-xs text-gray-600">Requests per Month</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-green-600">
                  {analytics.maintenanceMetrics.averageResolutionTime.toFixed(1)}
                </div>
                <p className="text-xs text-gray-600">Days to Resolution</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-yellow-600">
                  {stats.tenantSatisfactionScore.toFixed(1)}
                </div>
                <p className="text-xs text-gray-600">Overall Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Maintenance Requests</span>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
              <Select value={requestFilter} onValueChange={setRequestFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.title}</div>
                      <div className="max-w-48 truncate text-sm text-gray-500">
                        {request.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(request.category)}
                      <span className="capitalize">{request.category.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        {formatDate(request.submitted_date || request.created_at)}
                      </div>
                      {request.scheduled_date && (
                        <div className="text-xs text-gray-500">
                          Scheduled: {formatDate(request.scheduled_date)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('View Details clicked for request:', request);
                        console.log('Setting selectedRequest to:', request);
                        setSelectedRequest(request);
                        console.log('selectedRequest should now be:', request);
                      }}
                      type="button"
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRequests.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No maintenance requests found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>New Maintenance Request</DialogTitle>
            <DialogDescription>
              Submit a new maintenance request for your property. Include photos and detailed
              description to help us assist you quickly.
            </DialogDescription>
          </DialogHeader>
          <MaintenanceRequestForm
            onClose={() => setNewRequestOpen(false)}
            onSuccess={handleRequestSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => {
          console.log('Dialog onOpenChange:', open, 'selectedRequest:', selectedRequest);
          if (!open) {
            setSelectedRequest(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          {selectedRequest ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  {getCategoryIcon(selectedRequest.category)}
                  <span>{selectedRequest.title}</span>
                </DialogTitle>
                <DialogDescription>Request ID: {selectedRequest.id}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="flex items-center space-x-4">
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(selectedRequest.priority)}>
                    {selectedRequest.priority} priority
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedRequest.category.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm text-gray-600">Description</Label>
                  <p className="mt-1 text-sm">{selectedRequest.description}</p>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Submitted</Label>
                    <p className="font-medium">
                      {formatDate(selectedRequest.submitted_date || selectedRequest.created_at)}
                    </p>
                  </div>
                  {selectedRequest.scheduled_date && (
                    <div>
                      <Label className="text-sm text-gray-600">Scheduled</Label>
                      <p className="font-medium">{formatDate(selectedRequest.scheduled_date)}</p>
                    </div>
                  )}
                  {selectedRequest.completed_date && (
                    <div>
                      <Label className="text-sm text-gray-600">Completed</Label>
                      <p className="font-medium">{formatDate(selectedRequest.completed_date)}</p>
                    </div>
                  )}
                </div>

                {/* Vendor and Cost Info */}
                {(selectedRequest.vendor_assigned || selectedRequest.estimated_cost) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRequest.vendor_assigned && (
                      <div>
                        <Label className="text-sm text-gray-600">Assigned Vendor</Label>
                        <p className="font-medium">{selectedRequest.vendor_assigned}</p>
                      </div>
                    )}
                    {selectedRequest.estimated_cost && (
                      <div>
                        <Label className="text-sm text-gray-600">Estimated Cost</Label>
                        <p className="font-medium">
                          {formatCurrency(selectedRequest.estimated_cost)}
                        </p>
                        {selectedRequest.actual_cost && (
                          <p className="text-sm text-gray-500">
                            Actual: {formatCurrency(selectedRequest.actual_cost)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selectedRequest.notes && (
                  <div>
                    <Label className="text-sm text-gray-600">Notes</Label>
                    <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm">
                      {selectedRequest.notes}
                    </p>
                  </div>
                )}

                {/* Satisfaction Rating */}
                {selectedRequest.tenant_satisfaction && (
                  <div>
                    <Label className="text-sm text-gray-600">Your Rating</Label>
                    <div className="mt-1 flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < selectedRequest.tenant_satisfaction
                              ? 'fill-current text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        ({selectedRequest.tenant_satisfaction}/5)
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  {selectedRequest.status === 'completed' &&
                    !selectedRequest.tenant_satisfaction && (
                      <Button variant="outline" className="flex-1">
                        <Star className="mr-2 h-4 w-4" />
                        Rate Service
                      </Button>
                    )}
                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500">No request selected</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
