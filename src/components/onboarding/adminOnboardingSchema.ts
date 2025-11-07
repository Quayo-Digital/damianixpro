
import { z } from "zod";

export const adminOnboardingSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is required" }),
  companyName: z.string().min(2, { message: "Company name is required" }),
  phone: z.string().min(5, { message: "Phone number is required" }),
  email: z.string().email({ message: "Valid email required" }),
  address: z.string().optional(),
  defaultTimeZone: z.string().min(2, { message: "Default time zone is required" }),
});

export type AdminOnboardingFormValues = z.infer<typeof adminOnboardingSchema>;
