import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  PaymentCategory,
  PAYMENT_CATEGORIES,
  RecurringPaymentType,
  RECURRING_PAYMENT_OPTIONS,
} from '@/utils/PaymentTypes';

interface RecurringPaymentFormProps {
  recurringType: RecurringPaymentType;
  setRecurringType: (type: RecurringPaymentType) => void;
  recurringCategory: PaymentCategory;
  setRecurringCategory: (category: PaymentCategory) => void;
  recurringAmount: number;
  setRecurringAmount: (amount: number) => void;
  recurringDescription: string;
  setRecurringDescription: (description: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export const RecurringPaymentForm = ({
  recurringType,
  setRecurringType,
  recurringCategory,
  setRecurringCategory,
  recurringAmount,
  setRecurringAmount,
  recurringDescription,
  setRecurringDescription,
  onSubmit,
  isProcessing,
}: RecurringPaymentFormProps) => {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="recurring-type">Billing Frequency</Label>
        <Select
          value={recurringType}
          onValueChange={(value) => setRecurringType(value as RecurringPaymentType)}
        >
          <SelectTrigger id="recurring-type">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            {RECURRING_PAYMENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurring-category">Payment Type</Label>
        <Select
          value={recurringCategory}
          onValueChange={(value) => setRecurringCategory(value as PaymentCategory)}
        >
          <SelectTrigger id="recurring-category">
            <SelectValue placeholder="Select payment type" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurring-amount">Amount (₦)</Label>
        <Input
          id="recurring-amount"
          type="number"
          value={recurringAmount}
          onChange={(e) => setRecurringAmount(Number(e.target.value))}
          placeholder="Enter amount"
          min={1000}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurring-description">Description (Optional)</Label>
        <Textarea
          id="recurring-description"
          value={recurringDescription}
          onChange={(e) => setRecurringDescription(e.target.value)}
          placeholder="Add payment details"
          className="resize-none"
        />
      </div>

      <Button onClick={onSubmit} disabled={isProcessing} className="mt-2">
        {isProcessing ? 'Processing...' : `Set up ${recurringType} payments`}
      </Button>
    </div>
  );
};
