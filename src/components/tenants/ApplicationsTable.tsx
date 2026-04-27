import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  FileText,
  Calendar,
  MapPin,
} from 'lucide-react';
import { TenantApplication, useTenants } from '@/hooks/useTenants';
import { ApplicationStatusBadge } from './TenantStats';

interface ApplicationsTableProps {
  onViewApplication?: (application: TenantApplication) => void;
  onApproveApplication?: (application: TenantApplication) => void;
  onRejectApplication?: (application: TenantApplication) => void;
}

export const ApplicationsTable = ({
  onViewApplication,
  onApproveApplication,
  onRejectApplication,
}: ApplicationsTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { applications, applicationsLoading, updateApplication, isUpdatingApplication } =
    useTenants();

  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      application.tenant?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.tenant?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.tenant?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.property?.title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || application.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApprove = (application: TenantApplication) => {
    updateApplication({
      id: application.id,
      status: 'approved',
      notes: 'Application approved',
    });
    onApproveApplication?.(application);
  };

  const handleReject = (application: TenantApplication) => {
    const reason = window.prompt('Reason for rejection (optional):');
    updateApplication({
      id: application.id,
      status: 'rejected',
      notes: reason || 'Application rejected',
    });
    onRejectApplication?.(application);
  };

  if (applicationsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredApplications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No applications found</p>
            <p className="text-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No tenant applications yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Application Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {application.tenant?.first_name?.[0]}
                            {application.tenant?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {application.tenant?.first_name} {application.tenant?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {application.tenant?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {application.property ? (
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{application.property.title}</div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="max-w-32 truncate">
                              {application.property.address}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Property not found</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{new Date(application.application_date).toLocaleDateString()}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <ApplicationStatusBadge status={application.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {application.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(application)}
                              disabled={isUpdatingApplication}
                              className="border-green-600 text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(application)}
                              disabled={isUpdatingApplication}
                              className="border-red-600 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => onViewApplication?.(application)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Contact Applicant
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              View Documents
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
