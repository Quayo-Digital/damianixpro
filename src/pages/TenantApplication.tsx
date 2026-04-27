import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  const [uploadedDocs, setUploadedDocs] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      validId: '',
      occupation: '',
      monthlyIncome: '',
      currentAddress: '',
      tenancyPeriod: '12',
      moveInDate: '',
      occupants: '1',
      pets: false,
      petsDetails: '',
      employmentStatus: 'full-time',
      employerName: '',
      employerContact: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      agreeToTerms: false,
      consentToBackground: false,
    },
  });

  const hasPets = form.watch('pets');
  const employmentStatus = form.watch('employmentStatus');

  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      setLoading(true);
      try {
        const propertyData = await getPropertyById(id);
        if (propertyData) {
          setProperty(propertyData);
        } else {
          toast.error('Property not found.');
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
      console.log('Form submitted:', values);
      console.log('Documents:', uploadedDocs);
      console.log('Property ID:', id);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success('Application submitted successfully', {
        description: "We'll review your application and get back to you soon.",
      });

      // Redirect after submission
      navigate('/tenant/dashboard');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application', {
        description: 'Please try again or contact support.',
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

    const newDocs = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 11),
      name: file.name,
    }));

    setUploadedDocs((prev) => [...prev, ...newDocs]);

    // Reset the input
    e.target.value = '';

    toast.success('Documents uploaded', {
      description: `${files.length} document${files.length > 1 ? 's' : ''} uploaded successfully.`,
    });
  };

  const removeDocument = (docId: string) => {
    setUploadedDocs((prev) => prev.filter((doc) => doc.id !== docId));
    toast.success('Document removed');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Loading property details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-6">
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
              {property
                ? `Apply to rent ${property.name} located at ${property.location}`
                : 'Complete the form below to apply for this property'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Open one section at a time — complete in order, or expand all as you go.
                </p>
                <Accordion
                  type="multiple"
                  defaultValue={['personal']}
                  className="w-full rounded-lg border border-border bg-card/30"
                >
                  <AccordionItem value="personal">
                    <AccordionTrigger className="px-4 text-left hover:no-underline">
                      <span className="font-medium">1 · Personal details</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-border p-4 pt-4">
                      <PersonalInfoSection control={form.control} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="rental">
                    <AccordionTrigger className="px-4 text-left hover:no-underline">
                      <span className="font-medium">2 · Rental & move-in</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-border p-4 pt-4">
                      <RentalDetailsSection control={form.control} hasPets={hasPets} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="employment">
                    <AccordionTrigger className="px-4 text-left hover:no-underline">
                      <span className="font-medium">3 · Employment & income</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-border p-4 pt-4">
                      <EmploymentIncomeSection
                        control={form.control}
                        employmentStatus={employmentStatus}
                      />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="emergency">
                    <AccordionTrigger className="px-4 text-left hover:no-underline">
                      <span className="font-medium">4 · Emergency contact</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-border p-4 pt-4">
                      <EmergencyContactSection control={form.control} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="documents">
                    <AccordionTrigger className="px-4 text-left hover:no-underline">
                      <span className="font-medium">5 · Documents</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-border p-4 pt-4">
                      <DocumentUploadSection
                        uploadedDocs={uploadedDocs}
                        handleFileUpload={handleFileUpload}
                        removeDocument={removeDocument}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <TermsSection control={form.control} />
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={submitting} size="lg">
                    {submitting ? 'Submitting Application...' : 'Submit application'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col items-start border-t px-6 pb-4 pt-6">
            <h4 className="mb-1 font-medium">What happens next?</h4>
            <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
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
