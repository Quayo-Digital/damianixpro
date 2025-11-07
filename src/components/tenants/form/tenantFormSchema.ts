
import { z } from "zod";

export const tenantFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  propertyId: z.string().min(1, "Please select a property"),
  rentAmount: z.string().min(1, "Rent amount is required"),
  rentDueDate: z.string().min(1, "Rent due date is required"),
  depositAmount: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  requestScreening: z.boolean().default(false),
});

export type TenantFormValues = z.infer<typeof tenantFormSchema>;
