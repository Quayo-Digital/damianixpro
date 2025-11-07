import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaymentCategory } from '@/utils/PaymentTypes';
import { CreditCard, RepeatIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OneTimePaymentForm } from './components/OneTimePaymentForm';
import { RecurringPaymentForm } from './components/RecurringPaymentForm';
import { usePaymentHandler } from './hooks/usePaymentHandler';
import { useRecurringPaymentHandler } from './hooks/useRecurringPaymentHandler';

interface PaymentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onPaymentSuccess: (payment: any) => void;
  tenantId?: string;
  initialCategory?: PaymentCategory;
}

export const PaymentDialog = ({ 
  isOpen, 
  setIsOpen, 
  onPaymentSuccess, 
  tenantId,
  initialCategory = 'rent' 
}: PaymentDialogProps) => {
  // Common state
  const [paymentTab, setPaymentTab] = useState<'one-time' | 'recurring'>('one-time');
  
  // One-time payment state
  const [amount, setAmount] = useState<number>(50000);
  const [category, setCategory] = useState<PaymentCategory>(initialCategory);
  const [description, setDescription] = useState('');
  
  // Recurring payment state
  const [recurringAmount, setRecurringAmount] = useState<number>(50000);
  const [recurringCategory, setRecurringCategory] = useState<PaymentCategory>('rent');
  const [recurringType, setRecurringType] = useState<'monthly' | 'quarterly' | 'annually'>('monthly');
  const [recurringDescription, setRecurringDescription] = useState('');
  
  // Payment handlers
  const { isProcessing, handleOneTimePayment } = usePaymentHandler({
    tenantId,
    onPaymentSuccess,
    setIsOpen
  });
  
  const { isProcessing: isRecurringProcessing, handleSetupRecurringPayment } = useRecurringPaymentHandler({
    tenantId,
    setIsOpen
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make a Payment</DialogTitle>
          <DialogDescription>
            Enter payment details and complete the transaction.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={paymentTab} onValueChange={(value) => setPaymentTab(value as 'one-time' | 'recurring')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="one-time" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              One-time
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex items-center gap-2">
              <RepeatIcon className="h-4 w-4" />
              Recurring
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="one-time" className="pt-4">
            <OneTimePaymentForm
              category={category}
              setCategory={setCategory}
              amount={amount}
              setAmount={setAmount}
              description={description}
              setDescription={setDescription}
              onSubmit={() => handleOneTimePayment(amount, category, description)}
              isProcessing={isProcessing}
            />
          </TabsContent>
          
          <TabsContent value="recurring" className="pt-4">
            <RecurringPaymentForm
              recurringType={recurringType}
              setRecurringType={setRecurringType}
              recurringCategory={recurringCategory}
              setRecurringCategory={setRecurringCategory}
              recurringAmount={recurringAmount}
              setRecurringAmount={setRecurringAmount}
              recurringDescription={recurringDescription}
              setRecurringDescription={setRecurringDescription}
              onSubmit={() => handleSetupRecurringPayment(
                recurringAmount,
                recurringType,
                recurringCategory,
                recurringDescription
              )}
              isProcessing={isRecurringProcessing}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
