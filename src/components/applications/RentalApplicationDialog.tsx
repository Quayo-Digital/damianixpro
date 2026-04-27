import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAuthSession } from '@/contexts/auth';
import { useEnhancedTenantData } from '@/hooks/useEnhancedTenantData';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { createApplication } from '@/services/applications/applicationApi';
import { ApplicationFormValues } from '@/services/applications/types';
import { fetchPropertyUnitsLeaseStatus } from '@/services/property/leaseSummary';
import type { PropertyUnitOption } from '@/services/property/types';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface RentalApplicationDialogProps {
  propertyId: string;
  propertyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Form schema
const applicationSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  valid_id: z.string().min(5, 'Valid ID number is required (National ID/Passport)'),
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
  emergency_contact_name: z.string().min(2, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().optional(),
  unit_id: z.string().optional(),
});

export function RentalApplicationDialog({
  propertyId,
  propertyName,
  open,
  onOpenChange,
}: RentalApplicationDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const { profile } = useEnhancedTenantData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [propertyUnits, setPropertyUnits] = useState<PropertyUnitOption[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  /** 1 = you & contact, 2 = home & work, 3 = documents */
  const [wizardStep, setWizardStep] = useState(1);

  useEffect(() => {
    if (open) setWizardStep(1);
  }, [open]);

  const uuidPropertyId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(propertyId);

  // Initialize the form
  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      valid_id: '',
      occupation: '',
      monthly_income: undefined,
      current_address: '',
      move_in_date: '',
      tenancy_period: 12,
      num_occupants: 1,
      has_pets: false,
      pets_details: '',
      employment_status: 'full-time',
      employer_name: '',
      employer_contact: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      unit_id: '',
    },
  });

  // Auto-populate form fields when dialog opens or tenant data is available
  useEffect(() => {
    if (open && (profile || user)) {
      // Get first name and last name from tenant profile
      const firstName = profile?.first_name || '';
      const lastName = profile?.last_name || '';

      // Get email from user or tenant profile
      const email = user?.email || profile?.email || '';

      // Get phone from tenant profile
      const phone = profile?.phone || '';

      // Auto-populate fields if they have values
      // Only populate if the field is currently empty to avoid overwriting user input
      const currentValues = form.getValues();

      if (firstName && (!currentValues.first_name || currentValues.first_name === '')) {
        form.setValue('first_name', firstName, { shouldValidate: false });
      }
      if (lastName && (!currentValues.last_name || currentValues.last_name === '')) {
        form.setValue('last_name', lastName, { shouldValidate: false });
      }
      if (email && (!currentValues.email || currentValues.email === '')) {
        form.setValue('email', email, { shouldValidate: false });
      }
      if (phone && (!currentValues.phone || currentValues.phone === '')) {
        form.setValue('phone', phone, { shouldValidate: false });
      }
    }
  }, [open, profile, user, form]);

  useEffect(() => {
    if (!open || !uuidPropertyId) {
      setPropertyUnits([]);
      return;
    }
    let cancelled = false;
    setUnitsLoading(true);
    fetchPropertyUnitsLeaseStatus(propertyId)
      .then((rows) => {
        if (!cancelled) setPropertyUnits(rows);
      })
      .finally(() => {
        if (!cancelled) setUnitsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, propertyId, uuidPropertyId]);

  useEffect(() => {
    if (propertyUnits.length === 1 && !propertyUnits[0].isLeased) {
      form.setValue('unit_id', propertyUnits[0].unitId, { shouldValidate: false });
    }
  }, [propertyUnits, form]);

  // Watch for conditional fields
  const hasPets = form.watch('has_pets');
  const employmentStatus = form.watch('employment_status');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Add the files to our state
    setUploadedFiles((prevFiles) => [...prevFiles, ...Array.from(files)]);

    // Reset the input
    e.target.value = '';

    toast.success('Documents added', {
      description: `${files.length} document${files.length > 1 ? 's' : ''} ready to upload.`,
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: z.infer<typeof applicationSchema>) => {
    if (propertyUnits.length > 1) {
      const vacant = propertyUnits.filter((u) => !u.isLeased);
      if (vacant.length === 0) {
        toast.error('All units in this listing are already leased.');
        return;
      }
      if (!values.unit_id || String(values.unit_id).trim() === '') {
        toast.error('Select the unit you are applying for.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: ApplicationFormValues = {
        ...(values as ApplicationFormValues),
        unit_id: values.unit_id?.trim() || undefined,
      };
      const result = await createApplication(propertyId, payload, uploadedFiles);

      if (result) {
        toast.success('Application submitted successfully', {
          description: "We'll review your application and get back to you soon.",
        });
        void queryClient.invalidateQueries({ queryKey: ['tenant-applications', 'mine'] });

        // Close the dialog and reset form
        onOpenChange(false);
        // Reset form to default values (will be auto-populated when dialog opens again)
        form.reset();
        setUploadedFiles([]);
        navigate('/tenant/dashboard', { replace: true });
      }
      // Errors (incl. missing DB table) are toasted inside createApplication
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application', {
        description: 'Please try again or contact support.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWizardNext = async () => {
    if (wizardStep === 1) {
      if (propertyUnits.length > 1) {
        const vacant = propertyUnits.filter((u) => !u.isLeased);
        if (vacant.length === 0) {
          toast.error('All units in this listing are already leased.');
          return;
        }
        const uid = form.getValues('unit_id');
        if (!uid || String(uid).trim() === '') {
          toast.error('Select the unit you are applying for.');
          return;
        }
      }
      const ok = await form.trigger([
        'first_name',
        'last_name',
        'email',
        'valid_id',
        'emergency_contact_name',
      ]);
      if (ok) setWizardStep(2);
      return;
    }
    if (wizardStep === 2) {
      const ok = await form.trigger([
        'current_address',
        'tenancy_period',
        'move_in_date',
        'num_occupants',
        'has_pets',
        'pets_details',
        'occupation',
        'monthly_income',
        'employment_status',
        'employer_name',
        'employer_contact',
      ]);
      if (ok) setWizardStep(3);
    }
  };

  const stepLabels = ['You', 'Home & work', 'Documents'] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Apply for rental</DialogTitle>
          <DialogDescription>
            {wizardStep === 1 && `Step 1 of 3 — ${stepLabels[0]} — ${propertyName}`}
            {wizardStep === 2 && `Step 2 of 3 — ${stepLabels[1]} — ${propertyName}`}
            {wizardStep === 3 && `Step 3 of 3 — ${stepLabels[2]} — upload files & submit`}
          </DialogDescription>
          <div className="space-y-2 pt-2">
            <Progress value={(wizardStep / 3) * 100} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {wizardStep === 1 && 'We’ll ask for your details, then move-in, then documents.'}
              {wizardStep === 2 && 'Almost there — help the landlord understand your household.'}
              {wizardStep === 3 &&
                'Attach supporting files (optional where not required) and submit.'}
            </p>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (wizardStep === 3) void form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-6"
          >
            {wizardStep === 1 && (
              <>
                {unitsLoading && uuidPropertyId ? (
                  <p className="text-sm text-muted-foreground">Loading unit availability…</p>
                ) : null}

                {propertyUnits.length > 1 ? (
                  <Alert>
                    <AlertDescription>
                      This listing has multiple units (estate-style). Choose an available unit
                      below. Occupied units are hidden from the list.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {propertyUnits.length > 1 ? (
                  <FormField
                    control={form.control}
                    name="unit_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                          disabled={propertyUnits.filter((u) => !u.isLeased).length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {propertyUnits
                              .filter((u) => !u.isLeased)
                              .map((u) => (
                                <SelectItem key={u.unitId} value={u.unitId}>
                                  {u.unitNumber?.trim() || `Unit ${u.unitId.slice(0, 8)}…`} — ₦
                                  {u.rentAmount.toLocaleString('en-NG')}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Units already leased are not listed. If none appear, every unit is taken.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                {/* Personal Information */}
                <div>
                  <h3 className="mb-4 text-lg font-medium">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              {...field}
                              value={field.value || ''}
                            />
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
                            <Input
                              placeholder="Enter your last name"
                              {...field}
                              value={field.value || ''}
                            />
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
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              {...field}
                              value={field.value || ''}
                            />
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
                            <Input
                              placeholder="Enter your phone number"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valid_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid ID (National ID/Passport)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your National ID or Passport number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-medium">Emergency contact</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              </>
            )}

            {wizardStep === 2 && (
              <>
                <div>
                  <h3 className="mb-4 text-lg font-medium">Current Address & Rental Details</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="current_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your current address"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value ?? ''}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="tenancy_period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tenancy Period</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value, 10))}
                              value={field.value != null ? String(field.value) : '12'}
                            >
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
                              <Input
                                type="date"
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                value={field.value ?? ''}
                                onChange={field.onChange}
                              />
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
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value, 10))}
                              value={field.value != null ? String(field.value) : '1'}
                            >
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
                              checked={Boolean(field.value)}
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
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                value={field.value ?? ''}
                                onChange={field.onChange}
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
                  <h3 className="mb-4 text-lg font-medium">Employment & Income</h3>
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
                            <Input
                              type="number"
                              placeholder="Enter your monthly income"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={
                                field.value === undefined || field.value === null
                                  ? ''
                                  : String(field.value)
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                field.onChange(v === '' ? undefined : Number(v));
                              }}
                            />
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
                              value={field.value ?? 'full-time'}
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

                    {(employmentStatus === 'full-time' || employmentStatus === 'part-time') && (
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
                                <Input
                                  placeholder="Enter employer's contact information"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {wizardStep === 3 && (
              <>
                <div>
                  <h3 className="mb-4 text-lg font-medium">Required Documents</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Please upload the following documents to support your application:
                  </p>

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex items-center rounded-md border p-3">
                      <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                      <span>Proof of Income</span>
                    </div>
                    <div className="flex items-center rounded-md border p-3">
                      <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                      <span>Proof of Address</span>
                    </div>
                    <div className="flex items-center rounded-md border p-3">
                      <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                      <span>Employment Verification</span>
                    </div>
                  </div>

                  <div className="relative cursor-pointer rounded-lg border-2 border-dashed bg-muted/50 p-6 text-center transition-colors hover:bg-muted/80">
                    <input
                      type="file"
                      multiple
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      onChange={handleFileUpload}
                    />
                    <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="mb-1 font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">
                      Upload all required documents (PDF, JPG, PNG)
                    </p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Uploaded Documents</p>
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div
              className={cn(
                'flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center',
                wizardStep === 1 ? 'sm:justify-end' : 'sm:justify-between'
              )}
            >
              {wizardStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWizardStep((s) => Math.max(1, s - 1))}
                >
                  Back
                </Button>
              )}
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                {wizardStep < 3 && (
                  <Button
                    type="button"
                    className="w-full sm:min-w-[140px]"
                    onClick={() => void handleWizardNext()}
                  >
                    Continue
                  </Button>
                )}
                {wizardStep === 3 && (
                  <Button type="submit" className="w-full sm:min-w-[160px]" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting…' : 'Submit application'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
