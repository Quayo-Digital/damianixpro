export interface VendorJob {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  property: string;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  cost: number | null;
  feedback: string | null;
  rating: number | null;
  created_at: string;
}
