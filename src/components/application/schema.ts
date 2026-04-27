import { z } from 'zod';

// Define the form schema
export const applicationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  validId: z.string().min(5, 'Valid ID number is required (National ID/Passport)'),
  occupation: z.string().min(2, 'Occupation must be at least 2 characters'),
  monthlyIncome: z.string().min(1, 'Monthly income is required'),
  currentAddress: z.string().min(5, 'Current address must be at least 5 characters'),
  tenancyPeriod: z.string().min(1, 'Please select a tenancy period'),
  moveInDate: z.string().min(1, 'Move-in date is required'),
  occupants: z.string().min(1, 'Number of occupants is required'),
  pets: z.boolean().default(false),
  petsDetails: z.string().optional(),
  employmentStatus: z.enum([
    'full-time',
    'part-time',
    'self-employed',
    'unemployed',
    'student',
    'retired',
  ]),
  employerName: z.string().optional(),
  employerContact: z.string().optional(),
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(10, 'Emergency contact phone is required'),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  consentToBackground: z.boolean().refine((val) => val === true, {
    message: 'You must consent to a background check',
  }),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;
