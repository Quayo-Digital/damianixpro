import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Hammer
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

export function TenantMaintenanceSupport() {
  const { maintenanceRequests, stats, analytics, loading, error } = useEnhancedTenantData();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [requestFilter, setRequestFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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

  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesFilter = requestFilter === 'all' || request.status === requestFilter;
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'plumbing': return <Droplets className="h-4 w-4" />;
      case 'electrical': return <Zap className="h-4 w-4" />;
      case 'hvac': return <Wind className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'pest_control': return <Bug className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.maintenanceRequestsSubmitted}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
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
              <div className="p-3 bg-green-100 rounded-full">
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
              <div className="p-3 bg-purple-100 rounded-full">
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
              <div className="p-3 bg-yellow-100 rounded-full">
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
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => setNewRequestOpen(true)}
            >
              <Droplets className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Plumbing</span>
              <span className="text-xs text-gray-500">Leaks, clogs, etc.</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => setNewRequestOpen(true)}
            >
              <Zap className="h-6 w-6 text-yellow-600" />
              <span className="font-medium">Electrical</span>
              <span className="text-xs text-gray-500">Outlets, lights, etc.</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => setNewRequestOpen(true)}
            >
              <Wind className="h-6 w-6 text-green-600" />
              <span className="font-medium">HVAC</span>
              <span className="text-xs text-gray-500">AC, heating, etc.</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div className="space-y-4">
                <h4 className="font-medium">Requests by Category</h4>
                <div className="space-y-3">
                  {analytics.maintenanceMetrics.categoryBreakdown.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(category.category)}
                        <div>
                          <div className="font-medium capitalize">{category.category.replace('_', ' ')}</div>
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
                      <div className="flex justify-between items-center">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {analytics.maintenanceMetrics.requestFrequency.toFixed(1)}
                </div>
                <p className="text-xs text-gray-600">Requests per Month</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {analytics.maintenanceMetrics.averageResolutionTime.toFixed(1)}
                </div>
                <p className="text-xs text-gray-600">Days to Resolution</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={requestFilter} onValueChange={setRequestFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
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
                      <div className="text-sm text-gray-500 truncate max-w-48">
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
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        {new Date(request.submitted_date).toLocaleDateString('en-NG')}
                      </div>
                      {request.scheduled_date && (
                        <div className="text-xs text-gray-500">
                          Scheduled: {new Date(request.scheduled_date).toLocaleDateString('en-NG')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No maintenance requests found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Maintenance Request</DialogTitle>
            <DialogDescription>
              Describe the issue you're experiencing and we'll get it resolved quickly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="appliances">Appliances</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="pest_control">Pest Control</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="title">Issue Title</Label>
              <Input placeholder="Brief description of the issue" />
            </div>
            
            <div>
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea 
                placeholder="Please provide as much detail as possible about the issue, including when it started and any relevant circumstances."
                rows={4}
              />
            </div>
            
            <div>
              <Label>Photos (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload photos or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Photos help us understand the issue better
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
              <Button variant="outline" onClick={() => setNewRequestOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getCategoryIcon(selectedRequest.category)}
                <span>{selectedRequest.title}</span>
              </DialogTitle>
              <DialogDescription>
                Request ID: {selectedRequest.id}
              </DialogDescription>
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
                    {new Date(selectedRequest.submitted_date).toLocaleDateString('en-NG')}
                  </p>
                </div>
                {selectedRequest.scheduled_date && (
                  <div>
                    <Label className="text-sm text-gray-600">Scheduled</Label>
                    <p className="font-medium">
                      {new Date(selectedRequest.scheduled_date).toLocaleDateString('en-NG')}
                    </p>
                  </div>
                )}
                {selectedRequest.completed_date && (
                  <div>
                    <Label className="text-sm text-gray-600">Completed</Label>
                    <p className="font-medium">
                      {new Date(selectedRequest.completed_date).toLocaleDateString('en-NG')}
                    </p>
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
                      <p className="font-medium">{formatCurrency(selectedRequest.estimated_cost)}</p>
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
                  <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {/* Satisfaction Rating */}
              {selectedRequest.tenant_satisfaction && (
                <div>
                  <Label className="text-sm text-gray-600">Your Rating</Label>
                  <div className="flex items-center space-x-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${
                          i < selectedRequest.tenant_satisfaction 
                            ? 'text-yellow-400 fill-current' 
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
                {selectedRequest.status === 'completed' && !selectedRequest.tenant_satisfaction && (
                  <Button variant="outline" className="flex-1">
                    <Star className="h-4 w-4 mr-2" />
                    Rate Service
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
