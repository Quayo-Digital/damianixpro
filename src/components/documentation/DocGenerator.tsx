import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, FileText, BookOpen, Users, HomeIcon, Settings, FileSearch } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocPreview } from './DocPreview';
import { generatePDF } from '@/services/documentation/pdfGenerator';
import { toast } from 'sonner';

export function DocGenerator() {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [selectedGuide, setSelectedGuide] = useState('complete');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await generatePDF(selectedRole, selectedGuide);
      toast.success('Documentation has been generated and downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate documentation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Documentation Overview Card */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              System Documentation
            </CardTitle>
            <CardDescription>
              Access comprehensive guides and tutorials for DamianixPro platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Browse through role-specific documentation or feature guides to help you navigate and
              use the platform effectively. Each guide is available for preview or download as a
              PDF.
            </p>
          </CardContent>
        </Card>

        {/* Documentation Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation Options</CardTitle>
            <CardDescription>Select the documentation you need</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin/Super Admin</SelectItem>
                  <SelectItem value="owner">Property Owner</SelectItem>
                  <SelectItem value="agent">Agent/Property Manager</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="vendor">Vendor/Service Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Guide Type</label>
              <Select value={selectedGuide} onValueChange={setSelectedGuide}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Guide Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">Complete Guide</SelectItem>
                  <SelectItem value="quickstart">Quick Start Guide</SelectItem>
                  <SelectItem value="properties">Property Management</SelectItem>
                  <SelectItem value="tenants">Tenant Management</SelectItem>
                  <SelectItem value="finance">Financial Management</SelectItem>
                  <SelectItem value="maintenance">Maintenance Management</SelectItem>
                  <SelectItem value="documents">Document Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGeneratePDF} className="w-full" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Documentation
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Documentation Preview */}
        <Card className="md:col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Documentation Preview</CardTitle>
            <CardDescription>Preview selected documentation</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[400px]">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-4 grid grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sections">Sections</TabsTrigger>
                <TabsTrigger value="toc">Table of Contents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <DocPreview role={selectedRole} guide={selectedGuide} type="overview" />
              </TabsContent>

              <TabsContent value="sections" className="space-y-4">
                <DocPreview role={selectedRole} guide={selectedGuide} type="sections" />
              </TabsContent>

              <TabsContent value="toc" className="space-y-4">
                <DocPreview role={selectedRole} guide={selectedGuide} type="toc" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Documentation Features */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4 text-primary" />
              Role-Based Guides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Documentation tailored to specific user roles with permissions and responsibility
              details.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSearch className="h-4 w-4 text-primary" />
              Feature-Specific Manuals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Detailed guides on each system feature with step-by-step instructions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-4 w-4 text-primary" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced setup and configuration instructions for administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
