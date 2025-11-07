
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { getPropertyById, Property } from '@/services/property';
import { applicationSchema, ApplicationFormValues } from '@/components/application/schema';
import PersonalInfoSection from '@/components/application/PersonalInfoSection';
import RentalDetailsSection from '@/components/application/RentalDetailsSection';
import EmploymentIncomeSection from '@/components/application/EmploymentIncomeSection';
import EmergencyContactSection from '@/components/application/EmergencyContactSection';
import DocumentUploadSection from '@/components/application/DocumentUploadSection';
import TermsSection from '@/components/application/TermsSection';

const TenantApplication = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<{id: string, name: string}[]>([]);
  
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      occupation: "",
      monthlyIncome: "",
      currentAddress: "",
      tenancyPeriod: "12",
      moveInDate: "",
      occupants: "1",
      pets: false,
      petsDetails: "",
      employmentStatus: "full-time",
      employerName: "",
      employerContact: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      agreeToTerms: false,
      consentToBackground: false,
    },
  });
  
  const hasPets = form.watch("pets");
  const employmentStatus = form.watch("employmentStatus");
  
  useEffect(() => {
    if (!id) return;
    
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const propertyData = await getPropertyById(id);
        if (propertyData) {
          setProperty(propertyData);
        } else {
          toast.error("Property not found.");
          navigate('/public/properties');
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        toast.error('Failed to load property details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate]);
  
  const onSubmit = async (values: ApplicationFormValues) => {
    setSubmitting(true);
    try {
      // In a real implementation, this would submit to Supabase
      console.log("Form submitted:", values);
      console.log("Documents:", uploadedDocs);
      console.log("Property ID:", id);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Application submitted successfully", {
        description: "We'll review your application and get back to you soon.",
      });
      
      // Redirect after submission
      navigate('/application-success');
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application", {
        description: "Please try again or contact support.",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // This is where you would upload files to Supabase storage in a real app
    // For this demo, we'll just simulate the upload
    
    const newDocs = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      name: file.name
    }));
    
    setUploadedDocs(prev => [...prev, ...newDocs]);
    
    // Reset the input
    e.target.value = '';
    
    toast.success("Documents uploaded", {
      description: `${files.length} document${files.length > 1 ? 's' : ''} uploaded successfully.`,
    });
  };
  
  const removeDocument = (docId: string) => {
    setUploadedDocs(prev => prev.filter(doc => doc.id !== docId));
    toast.success("Document removed");
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <p>Loading property details...</p>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link to={`/public/properties/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Property
            </Link>
          </Button>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Rental Application</CardTitle>
            <CardDescription>
              {property ? `Apply to rent ${property.name} located at ${property.location}` : "Complete the form below to apply for this property"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <PersonalInfoSection control={form.control} />
                <Separator />
                <RentalDetailsSection control={form.control} hasPets={hasPets} />
                <Separator />
                <EmploymentIncomeSection control={form.control} employmentStatus={employmentStatus} />
                <Separator />
                <EmergencyContactSection control={form.control} />
                <Separator />
                <DocumentUploadSection 
                  uploadedDocs={uploadedDocs}
                  handleFileUpload={handleFileUpload}
                  removeDocument={removeDocument}
                />
                <Separator />
                <TermsSection control={form.control} />
                
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Submitting Application..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col items-start border-t px-6 pt-6 pb-4">
            <h4 className="font-medium mb-1">What happens next?</h4>
            <ol className="space-y-2 list-decimal text-sm text-muted-foreground pl-4">
              <li>We'll review your application within 2-3 business days</li>
              <li>Background and reference checks will be conducted</li>
              <li>You'll be notified of the application result by email</li>
              <li>If approved, we'll contact you to schedule a lease signing</li>
            </ol>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default TenantApplication;
