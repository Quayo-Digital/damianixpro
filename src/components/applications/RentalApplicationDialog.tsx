
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { createApplication, uploadApplicationDocuments } from '@/services/applications/applicationApi';
import { ApplicationFormValues } from '@/services/applications/types';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Trash2 } from 'lucide-react';

interface RentalApplicationDialogProps {
  propertyId: string;
  propertyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Form schema
const applicationSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  monthly_income: z.coerce.number().optional(),
  current_address: z.string().optional(),
  move_in_date: z.string().optional(),
  tenancy_period: z.coerce.number().default(12),
  num_occupants: z.coerce.number().default(1),
  has_pets: z.boolean().default(false),
  pets_details: z.string().optional(),
  employment_status: z.string().default('full-time'),
  employer_name: z.string().optional(),
  employer_contact: z.string().optional(),
  emergency_contact_name: z.string().min(2, "Emergency contact name is required"),
  emergency_contact_phone: z.string().optional(),
});

export function RentalApplicationDialog({ 
  propertyId, 
  propertyName, 
  open, 
  onOpenChange 
}: RentalApplicationDialogProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Initialize the form
  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      occupation: "",
      monthly_income: undefined,
      current_address: "",
      move_in_date: "",
      tenancy_period: 12,
      num_occupants: 1,
      has_pets: false,
      pets_details: "",
      employment_status: "full-time",
      employer_name: "",
      employer_contact: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    },
  });
  
  // Watch for conditional fields
  const hasPets = form.watch("has_pets");
  const employmentStatus = form.watch("employment_status");
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Add the files to our state
    setUploadedFiles(prevFiles => [...prevFiles, ...Array.from(files)]);
    
    // Reset the input
    e.target.value = '';
    
    toast.success("Documents added", {
      description: `${files.length} document${files.length > 1 ? 's' : ''} ready to upload.`,
    });
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const onSubmit = async (values: z.infer<typeof applicationSchema>) => {
    setIsSubmitting(true);
    try {
      // Submit the application data
      const result = await createApplication(propertyId, values as ApplicationFormValues, uploadedFiles);
      
      if (result) {
        toast.success("Application submitted successfully", {
          description: "We'll review your application and get back to you soon.",
        });
        
        // Close the dialog and reset form
        onOpenChange(false);
        form.reset();
        setUploadedFiles([]);
      } else {
        toast.error("Failed to submit application", {
          description: "Please try again or contact support.",
        });
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Rental</DialogTitle>
          <DialogDescription>
            Complete this application form to apply for {propertyName}.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Current Living & Rental Details */}
            <div>
              <h3 className="text-lg font-medium mb-4">Current Address & Rental Details</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="current_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter your current address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="tenancy_period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenancy Period</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                            <SelectItem value="18">18 months</SelectItem>
                            <SelectItem value="24">24 months</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="move_in_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desired Move-in Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="num_occupants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Occupants</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select number" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="has_pets"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Do you have any pets?</FormLabel>
                        <FormDescription>
                          Some properties may have restrictions on pets
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {hasPets && (
                  <FormField
                    control={form.control}
                    name="pets_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pet Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide details about your pets (type, breed, age, etc.)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Employment & Income */}
            <div>
              <h3 className="text-lg font-medium mb-4">Employment & Income</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your occupation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="monthly_income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Income (₦)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter your monthly income" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="employment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="full-time" />
                            </FormControl>
                            <FormLabel className="font-normal">Full-time</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="part-time" />
                            </FormControl>
                            <FormLabel className="font-normal">Part-time</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="self-employed" />
                            </FormControl>
                            <FormLabel className="font-normal">Self-employed</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="student" />
                            </FormControl>
                            <FormLabel className="font-normal">Student</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="unemployed" />
                            </FormControl>
                            <FormLabel className="font-normal">Unemployed</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="retired" />
                            </FormControl>
                            <FormLabel className="font-normal">Retired</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {(employmentStatus === "full-time" || employmentStatus === "part-time") && (
                  <>
                    <FormField
                      control={form.control}
                      name="employer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employer Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your employer's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="employer_contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employer Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter employer's contact information" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency contact phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Document Upload */}
            <div>
              <h3 className="text-lg font-medium mb-4">Required Documents</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please upload the following documents to support your application:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center p-3 border rounded-md">
                  <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Valid ID (National ID/Passport)</span>
                </div>
                <div className="flex items-center p-3 border rounded-md">
                  <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Proof of Income</span>
                </div>
                <div className="flex items-center p-3 border rounded-md">
                  <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Proof of Address</span>
                </div>
                <div className="flex items-center p-3 border rounded-md">
                  <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Employment Verification</span>
                </div>
              </div>
              
              <div className="border-dashed border-2 rounded-lg p-6 text-center bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">
                  Upload all required documents (PDF, JPG, PNG)
                </p>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="font-medium text-sm">Uploaded Documents</p>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting Application..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
