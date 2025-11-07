
import { supabase } from '@/integrations/supabase/client';
import { getTemplateById } from '@/utils/communicationTemplates';
import { PaymentNotification } from './types';

// Function to check for upcoming rent payments
export async function checkUpcomingPayments(tenantId: string, days: number = 7): Promise<PaymentNotification[]> {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    // In a real implementation, this would query the database for upcoming rent payments
    // For now, using sample data for demonstration
    const mockPayment: PaymentNotification = {
      id: '67890',
      tenant_id: tenantId,
      amount: 120000,
      due_date: futureDateStr,
      type: 'upcoming',
      is_acknowledged: false,
      created_at: new Date().toISOString()
    };
    
    return [mockPayment];
    
  } catch (error) {
    console.error('Error checking upcoming payments:', error);
    return [];
  }
}

// Function to send a payment reminder
export async function sendPaymentReminder(
  tenantId: string, // This is user_id
  amount: number,
  dueDate: string,
  daysRemaining: number
): Promise<boolean> {
  try {
    const template = getTemplateById('rent-reminder');
    let message = '';
    
    if (template) {
      message = template.body
        .replace('[Tenant Name]', 'Tenant')
        .replace('[Amount]', `₦${amount.toLocaleString()}`)
        .replace('[Due Date]', new Date(dueDate).toLocaleDateString())
        .replace('[Property Manager]', 'Property Manager');
    } else {
      message = `Your rent payment of ₦${amount.toLocaleString()} is due in ${daysRemaining} days on ${new Date(dueDate).toLocaleDateString()}.`;
    }
    
    const { error } = await supabase.from('notifications').insert({
        user_id: tenantId,
        title: 'Rent Payment Reminder',
        description: message,
        type: 'payment',
        link: '/rent',
        metadata: { amount, due_date: dueDate }
    });

    if (error) throw error;
    
    console.log(`Payment reminder sent to tenant ${tenantId} for amount ₦${amount}`);
    
    return true;
    
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return false;
  }
}
