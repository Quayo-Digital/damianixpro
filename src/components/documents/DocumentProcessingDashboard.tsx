// Document Processing Dashboard Component

import React, { useState, useCallback } from 'react';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { useAuthSession } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Upload,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  Shield,
  TrendingUp,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { DocumentType, DocumentStatus, DocumentMetadata } from '@/types/documentProcessing';

interface DocumentProcessingDashboardProps {
  propertyId?: string;
}

export function DocumentProcessingDashboard({ propertyId }: DocumentProcessingDashboardProps) {
  const { user } = useAuthSession();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [documentTypeFilter, setDocumentTypeFilter] = useState<DocumentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);

  const {
    documents,
    analytics,
    uploadProgress,
    processingStatus,
    documentsLoading,
    analyticsLoading,
    isUploading,
    uploadDocument,
    updateDocument,
    deleteDocument,
    reprocessDocument,
    getDocumentDetails,
    getPendingDocuments,
    getHighRiskDocuments,
  } = useDocumentProcessing({
    userId: user?.id,
    propertyId,
    filters: {
      document_types: documentTypeFilter !== 'all' ? [documentTypeFilter] : undefined,
      statuses: statusFilter !== 'all' ? [statusFilter] : undefined,
    },
  });

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (!user?.id || !files.length) return;

      Array.from(files).forEach((file) => {
        uploadDocument({
          file,
          userId: user.id,
          propertyId,
        });
      });

      setSelectedFiles(null);
    },
    [user?.id, propertyId, uploadDocument]
  );

  const handleDocumentAction = useCallback(
    async (action: 'view' | 'delete' | 'reprocess', documentId: string) => {
      switch (action) {
        case 'view': {
          const details = await getDocumentDetails(documentId);
          setSelectedDocument(details);
          break;
        }
        case 'delete':
          if (confirm('Are you sure you want to delete this document?')) {
            deleteDocument(documentId);
          }
          break;
        case 'reprocess':
          reprocessDocument(documentId);
          break;
      }
    },
    [getDocumentDetails, deleteDocument, reprocessDocument]
  );

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'processed':
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 animate-spin text-blue-500" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const variants = {
      processed: 'default',
      verified: 'default',
      processing: 'secondary',
      rejected: 'destructive',
      uploaded: 'outline',
    } as const;

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8)
      return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
    if (confidence >= 0.6)
      return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low Confidence</Badge>;
  };

  const pendingDocuments = getPendingDocuments();
  const highRiskDocuments = getHighRiskDocuments();

  if (documentsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Processing</h2>
          <p className="text-gray-600">AI-powered document analysis and management</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold">{analytics.total_documents}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {Math.round(analytics.processing_metrics.success_rate * 100)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold">{pendingDocuments.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Risk</p>
                  <p className="text-2xl font-bold">{highRiskDocuments.length}</p>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(uploadProgress).map(([docId, progress]) => (
                <div key={docId} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Document {docId.slice(-8)}</span>
                    <span>{processingStatus[docId] || 'Processing...'}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Label>Filters:</Label>
                </div>
                <Select
                  value={documentTypeFilter}
                  onValueChange={(value) => setDocumentTypeFilter(value as DocumentType | 'all')}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Document Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lease_agreement">Lease Agreement</SelectItem>
                    <SelectItem value="id_card">ID Card</SelectItem>
                    <SelectItem value="bank_statement">Bank Statement</SelectItem>
                    <SelectItem value="pay_slip">Pay Slip</SelectItem>
                    <SelectItem value="utility_bill">Utility Bill</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as DocumentStatus | 'all')}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <div className="grid gap-4">
            {documents.map((document) => (
              <Card key={document.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(document.status)}
                      <div>
                        <h3 className="font-medium">{document.original_filename}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{document.document_type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{new Date(document.upload_date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{Math.round(document.file_size / 1024)} KB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(document.status)}
                      {getConfidenceBadge(document.confidence_score)}

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDocumentAction('view', document.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDocumentAction('reprocess', document.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDocumentAction('delete', document.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {document.confidence_score < 0.5 && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-700">
                          Low confidence score - manual review recommended
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {documents.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">No documents found</h3>
                  <p className="mb-4 text-gray-600">
                    Upload your first document to get started with AI-powered processing
                  </p>
                  <Button onClick={() => document.getElementById('file-upload')?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid gap-6">
              {/* Processing Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Processing Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(analytics.processing_metrics.success_rate * 100)}%
                      </p>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {analytics.processing_metrics.average_processing_time_ms}ms
                      </p>
                      <p className="text-sm text-gray-600">Avg Processing Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {Math.round(analytics.processing_metrics.manual_review_rate * 100)}%
                      </p>
                      <p className="text-sm text-gray-600">Manual Review Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {Math.round(analytics.processing_metrics.fraud_detection_rate * 100)}%
                      </p>
                      <p className="text-sm text-gray-600">Fraud Detection Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Efficiency Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Efficiency Gains</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(analytics.efficiency_metrics.automation_rate * 100)}%
                      </p>
                      <p className="text-sm text-gray-600">Automation Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {analytics.efficiency_metrics.time_saved_hours}h
                      </p>
                      <p className="text-sm text-gray-600">Time Saved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        ₦{analytics.efficiency_metrics.cost_savings.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Cost Savings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {analytics.efficiency_metrics.error_reduction_percentage}%
                      </p>
                      <p className="text-sm text-gray-600">Error Reduction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
              <CardDescription>
                Document compliance with Nigerian regulations and standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
                    <div>
                      <h3 className="font-medium">Overall Compliance Rate</h3>
                      <p className="text-sm text-gray-600">
                        Documents meeting regulatory requirements
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(analytics.compliance_metrics.compliance_rate * 100)}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Common Violations</h4>
                    {analytics.compliance_metrics.common_violations.map((violation, index) => (
                      <div key={index} className="flex items-center gap-2 rounded bg-yellow-50 p-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{violation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Settings</CardTitle>
              <CardDescription>
                Configure document processing preferences and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Minimum Confidence Threshold</Label>
                  <Input type="number" min="0" max="1" step="0.1" defaultValue="0.7" />
                </div>
                <div>
                  <Label>Auto-approve Above Confidence</Label>
                  <Input type="number" min="0" max="1" step="0.1" defaultValue="0.9" />
                </div>
                <div>
                  <Label>Default Retention Period (days)</Label>
                  <Input type="number" min="1" defaultValue="2555" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
