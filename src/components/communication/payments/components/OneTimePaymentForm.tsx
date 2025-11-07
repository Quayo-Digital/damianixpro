
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PaymentCategory, PAYMENT_CATEGORIES } from '@/utils/PaymentTypes';
import { CreditCard } from 'lucide-react';

interface OneTimePaymentFormProps {
  category: PaymentCategory;
  setCategory: (category: PaymentCategory) => void;
  amount: number;
  setAmount: (amount: number) => void;
  description: string;
  setDescription: (description: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export const OneTimePaymentForm = ({
  category,
  setCategory,
  amount,
  setAmount,
  description,
  setDescription,
  onSubmit,
  isProcessing
}: OneTimePaymentFormProps) => {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="category">Payment Type</Label>
        <Select 
          value={category} 
          onValueChange={(value) => setCategory(value as PaymentCategory)}
        >
          <SelectTrigger id="category">
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
        <Label htmlFor="amount">Amount (₦)</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Enter amount"
          min={1000}
          className="col-span-3"
        />
        <p className="text-sm text-muted-foreground">
          Default amount is ₦50,000
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add payment details"
          className="resize-none"
        />
      </div>
      
      <Button onClick={onSubmit} disabled={isProcessing} className="mt-2">
        {isProcessing ? "Processing..." : `Pay ₦${amount.toLocaleString()}`}
      </Button>
    </div>
  );
};
