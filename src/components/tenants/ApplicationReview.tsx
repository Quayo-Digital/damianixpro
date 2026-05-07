import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { TenantScreening } from './TenantScreening';
import { toast } from 'sonner';
import { Briefcase, CheckCircle, Clock, FileText, Home, Phone, User, XCircle } from 'lucide-react';

interface ApplicationReviewProps {
  application?: any;
  tenantName?: string;
}

export function ApplicationReview({
  application,
  tenantName = 'Applicant',
}: ApplicationReviewProps) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>(
    application?.status || 'pending'
  );
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Example application data
  const applicationData = application || {
    id: '1234',
    property: 'Luxury Apartment, Ikoyi',
    submittedDate: '2025-05-01',
    applicantName: tenantName || 'John Doe',
    email: 'john.doe@example.com',
    phone: '+234 801 234 5678',
    monthlyIncome: '₦450,000',
    occupation: 'Software Engineer',
    currentAddress: '123 Main Street, Ikeja, Lagos',
    moveInDate: '2025-06-01',
    tenancyPeriod: '12 months',
    occupants: 2,
    employmentStatus: 'full-time',
    employerName: 'Tech Company Ltd',
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+234 802 345 6789',
    },
    documents: [
      { name: 'ID Card.pdf', type: 'identification' },
      { name: 'Pay Slip.pdf', type: 'income' },
      { name: 'Address Proof.pdf', type: 'address' },
    ],
    screeningScore: 85,
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      // In a real app, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus('approved');
      toast.success('Applicant approved successfully', {
        description: 'The applicant has been notified via email.',
      });
    } catch (error) {
      toast.error('Failed to approve applicant');
      console.error(error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      // In a real app, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus('rejected');
      toast.success('Application rejected', {
        description: 'The applicant has been notified via email.',
      });
    } catch (error) {
      toast.error('Failed to reject application');
      console.error(error);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Application #{applicationData.id}</CardTitle>
              <CardDescription>
                Submitted on {new Date(applicationData.submittedDate).toLocaleDateString()}
              </CardDescription>
            </div>
            {status === 'pending' ? (
              <Badge variant="outline">Pending Review</Badge>
            ) : status === 'approved' ? (
              <Badge className="bg-primary text-primary-foreground">Approved</Badge>
            ) : (
              <Badge variant="destructive">Rejected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {applicationData.applicantName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-medium">{applicationData.applicantName}</h3>
              <p className="text-muted-foreground">For {applicationData.property}</p>
            </div>
          </div>

          <Tabs defaultValue="application" className="mt-6">
            <TabsList className="mb-6 grid grid-cols-3">
              <TabsTrigger value="application">Application</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="screening">Screening</TabsTrigger>
            </TabsList>

            <TabsContent value="application" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <User className="mr-2 h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Full Name:</dt>
                        <dd className="font-medium">{applicationData.applicantName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Email:</dt>
                        <dd className="font-medium">{applicationData.email}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Phone:</dt>
                        <dd className="font-medium">{applicationData.phone}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Current Address:</dt>
                        <dd className="font-medium">{applicationData.currentAddress}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {/* Rental Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <Home className="mr-2 h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Rental Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Property:</dt>
                        <dd className="font-medium">{applicationData.property}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Move-in Date:</dt>
                        <dd className="font-medium">{applicationData.moveInDate}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Tenancy Period:</dt>
                        <dd className="font-medium">{applicationData.tenancyPeriod}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Occupants:</dt>
                        <dd className="font-medium">{applicationData.occupants}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {/* Employment & Income */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Employment & Income</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Occupation:</dt>
                        <dd className="font-medium">{applicationData.occupation}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Monthly Income:</dt>
                        <dd className="font-medium">{applicationData.monthlyIncome}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Employment Status:</dt>
                        <dd className="font-medium capitalize">
                          {applicationData.employmentStatus}
                        </dd>
                      </div>
                      {applicationData.employerName && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Employer:</dt>
                          <dd className="font-medium">{applicationData.employerName}</dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <Phone className="mr-2 h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Emergency Contact</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Name:</dt>
                        <dd className="font-medium">{applicationData.emergencyContact.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Phone:</dt>
                        <dd className="font-medium">{applicationData.emergencyContact.phone}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uploaded Documents</CardTitle>
                  <CardDescription>Review the applicant's submitted documentation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applicationData.documents.map((doc: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex items-center">
                          <FileText className="mr-3 h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-xs capitalize text-muted-foreground">
                              {doc.type}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="screening">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Screening Results</CardTitle>
                    <CardDescription>
                      Overall screening score and verification results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <div className="mb-2 flex justify-between">
                        <span className="font-medium">Overall Score</span>
                        <span className="font-medium">{applicationData.screeningScore}/100</span>
                      </div>
                      <Progress value={applicationData.screeningScore} className="h-3" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center">
                          <CheckCircle className="mr-3 h-5 w-5 text-primary" />
                          <span>Background Check</span>
                        </div>
                        <Badge className="bg-primary text-primary-foreground">Passed</Badge>
                      </div>

                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center">
                          <CheckCircle className="mr-3 h-5 w-5 text-primary" />
                          <span>Income Verification</span>
                        </div>
                        <Badge className="bg-primary text-primary-foreground">Verified</Badge>
                      </div>

                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center">
                          <Clock className="mr-3 h-5 w-5 text-accent-foreground" />
                          <span>Employment History</span>
                        </div>
                        <Badge variant="outline">Pending</Badge>
                      </div>

                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center">
                          <CheckCircle className="mr-3 h-5 w-5 text-primary" />
                          <span>Identity Verification</span>
                        </div>
                        <Badge className="bg-primary text-primary-foreground">Verified</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <TenantScreening tenantId={'123'} tenantName={applicationData.applicantName} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          {status === 'pending' ? (
            <div className="flex w-full items-center justify-between">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isRejecting || isApproving}
                className="mr-2 flex-1"
              >
                {isRejecting ? 'Rejecting...' : 'Reject Application'}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isRejecting || isApproving}
                className="ml-2 flex-1"
              >
                {isApproving ? 'Approving...' : 'Approve Application'}
              </Button>
            </div>
          ) : status === 'approved' ? (
            <div className="flex w-full items-center justify-center text-center font-medium text-primary">
              <CheckCircle className="mr-2 h-5 w-5" />
              Application approved
            </div>
          ) : (
            <div className="flex w-full items-center justify-center text-center font-medium text-destructive">
              <XCircle className="mr-2 h-5 w-5" />
              Application rejected
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
