export interface CommunicationTemplate {
  id: string;
  title: string;
  subject?: string;
  body: string;
  category: 'payment' | 'maintenance' | 'announcement' | 'general' | 'onboarding';
  tags?: string[];
}

export const communicationTemplates: CommunicationTemplate[] = [
  {
    id: 'rent-reminder',
    title: 'Rent Payment Reminder',
    subject: 'Friendly Reminder: Rent Payment Due Soon',
    body: "Dear [Tenant Name],\n\nThis is a friendly reminder that your rent payment of [Amount] is due on [Due Date]. Please ensure your payment is made on time to avoid late fees.\n\nIf you've already made your payment, please disregard this message.\n\nThank you,\n[Property Manager]",
    category: 'payment',
    tags: ['rent', 'payment', 'reminder']
  },
  {
    id: 'maintenance-scheduled',
    title: 'Maintenance Visit Scheduled',
    subject: 'Scheduled Maintenance Visit',
    body: "Dear [Tenant Name],\n\nThis is to inform you that a maintenance visit has been scheduled for your unit on [Date] between [Start Time] and [End Time].\n\nThe purpose of this visit is to [Maintenance Purpose].\n\nYour presence is not required, but appreciated. Please let us know if this timing doesn't work for you.\n\nRegards,\n[Property Manager]",
    category: 'maintenance',
    tags: ['maintenance', 'schedule', 'visit']
  },
  {
    id: 'inspection-notice',
    title: 'Property Inspection Notice',
    subject: 'Upcoming Property Inspection',
    body: "Dear [Tenant Name],\n\nWe will be conducting a routine property inspection on [Date] between [Start Time] and [End Time].\n\nThis is a standard inspection to ensure everything is in good working order. Your presence is not required but you're welcome to be present.\n\nIf you have any maintenance issues you'd like us to address, please let us know before the inspection.\n\nThank you,\n[Property Manager]",
    category: 'announcement',
    tags: ['inspection', 'notice']
  },
  {
    id: 'welcome',
    title: 'Welcome New Tenant',
    subject: 'Welcome to Your New Home!',
    body: "Dear [Tenant Name],\n\nWelcome to your new home! We're delighted to have you as a tenant and hope you'll be very happy here.\n\nEnclosed you'll find some important information about your property, including emergency contacts, maintenance procedures, and community guidelines.\n\nIf you have any questions or need assistance, please don't hesitate to contact us at [Contact Information].\n\nBest regards,\n[Property Manager]",
    category: 'general',
    tags: ['welcome', 'new tenant']
  },
  {
    id: 'lease-renewal',
    title: 'Lease Renewal Offer',
    subject: 'Your Lease Renewal Information',
    body: "Dear [Tenant Name],\n\nAs your lease agreement will be expiring on [Expiration Date], we'd like to offer you the opportunity to renew your lease.\n\nWe value you as a tenant and would be pleased to have you continue your residency with us. The new lease terms would be for [Lease Term] at a monthly rent of [New Rent Amount].\n\nPlease let us know your decision by [Response Deadline]. If you have any questions or would like to discuss the renewal terms, please contact us.\n\nThank you,\n[Property Manager]",
    category: 'general',
    tags: ['lease', 'renewal']
  },
  {
    id: 'building-maintenance',
    title: 'Building Maintenance Notice',
    subject: 'Scheduled Building Maintenance',
    body: "Dear [Tenant Name],\n\nWe will be conducting maintenance on [Maintenance Type] in the building on [Date] from [Start Time] to [End Time].\n\nDuring this time, you may experience [Expected Disruptions]. We apologize for any inconvenience this may cause and appreciate your understanding.\n\nIf you have any questions or special needs during this time, please contact us at [Contact Information].\n\nThank you,\n[Property Manager]",
    category: 'maintenance',
    tags: ['building', 'maintenance', 'notice']
  },
  {
    id: 'late-payment',
    title: 'Late Payment Notice',
    subject: 'Important: Overdue Rent Payment',
    body: "Dear [Tenant Name],\n\nOur records indicate that your rent payment of [Amount] due on [Due Date] has not been received. As per your lease agreement, late fees of [Late Fee Amount] will be applied.\n\nIf you have already made the payment, please disregard this notice. If not, please arrange for payment as soon as possible to avoid additional charges.\n\nIf you're experiencing financial difficulties, please contact us to discuss possible arrangements.\n\nRegards,\n[Property Manager]",
    category: 'payment',
    tags: ['late', 'payment', 'notice']
  },
  {
    id: 'community-event',
    title: 'Community Event Invitation',
    subject: "You're Invited: Community Event",
    body: "Dear [Tenant Name],\n\nWe're pleased to invite you to our upcoming community event: [Event Name], which will be held on [Date] at [Time] in [Location].\n\n[Event Description]\n\nRefreshments will be provided. We hope you can join us for this opportunity to meet your neighbors and enjoy some time together as a community.\n\nPlease RSVP by [RSVP Deadline] by [RSVP Method].\n\nWe look forward to seeing you there!\n\nBest regards,\n[Property Manager]",
    category: 'announcement',
    tags: ['community', 'event', 'invitation']
  },
  {
    id: 'welcome-onboarding',
    title: 'Tenant Welcome & Onboarding',
    subject: 'Welcome to Your New Home!',
    body: "Dear [Tenant Name],\n\nCongratulations on being approved for [Property Name]! We're delighted to welcome you as our newest tenant.\n\nTo help make your move-in process smooth, we've prepared the following resources:\n\n1. Your lease agreement is attached for your signature\n2. A move-in checklist is available in your tenant portal\n3. Access codes and key pickup information will be provided upon lease signing\n\nPlease log in to your tenant portal to complete the required documents and access your welcome packet.\n\nIf you have any questions, don't hesitate to contact us at [Contact Information].\n\nWe look forward to having you as our tenant!\n\nWarm regards,\n[Property Manager]",
    category: 'onboarding',
    tags: ['welcome', 'onboarding', 'new tenant']
  },
  {
    id: 'lease-signing',
    title: 'Lease Signing Request',
    subject: 'Your Lease Agreement is Ready for Signature',
    body: "Dear [Tenant Name],\n\nYour lease agreement for [Property Name] is now ready for your electronic signature.\n\nTo review and sign your lease:\n1. Log in to your tenant portal\n2. Navigate to the 'Documents' section\n3. Open the lease agreement file\n4. Follow the prompts to sign electronically\n\nPlease complete this process within 3 business days. Once signed, you'll receive a copy for your records.\n\nIf you have any questions about the lease terms, please contact us before signing.\n\nThank you,\n[Property Manager]",
    category: 'onboarding',
    tags: ['lease', 'signature', 'onboarding']
  },
  {
    id: 'move-in-instructions',
    title: 'Move-in Instructions',
    subject: 'Your Move-in Instructions for [Property Name]',
    body: "Dear [Tenant Name],\n\nWe're excited for your upcoming move to [Property Name] on [Move-in Date]!\n\nHere's everything you need to know for a smooth move-in:\n\n1. Key Pickup: Keys will be available at [Location] between [Start Time] and [End Time] on [Move-in Date].\n\n2. Utilities: Please ensure you've arranged for all utilities to be transferred to your name before move-in.\n\n3. Parking: Your assigned parking space is [Parking Space]. Visitor parking is located at [Visitor Parking Location].\n\n4. Move-in Inspection: Please complete the move-in inspection form within 48 hours of moving in to document the property's condition.\n\nWe've attached a move-in checklist to help you prepare. If you need any assistance, please contact us at [Contact Information].\n\nWelcome to your new home!\n\nBest regards,\n[Property Manager]",
    category: 'onboarding',
    tags: ['move-in', 'instructions', 'onboarding']
  },
  {
    id: 'rental-milestone',
    title: 'Rental Milestone Notification',
    subject: 'Important Update: [Milestone Type] for Your Rental',
    body: "Dear [Tenant Name],\n\nThis is a notification regarding an important milestone for your tenancy at [Property Name]:\n\n[Milestone Description]\n\nAction Required: [Action Details]\n\nDeadline: [Deadline Date]\n\nIf you have any questions or need assistance with this matter, please don't hesitate to contact us at [Contact Information].\n\nThank you for your attention to this important matter.\n\nSincerely,\n[Property Manager]",
    category: 'general',
    tags: ['milestone', 'notification']
  },
  {
    id: 'lease-violation',
    title: 'Lease Violation Notice',
    subject: 'Important: Notice of Lease Violation',
    body: "Dear [Tenant Name],\n\nThis letter is to formally notify you of a violation of your lease agreement at [Property Name]. Specifically, the violation pertains to [Describe Violation].\n\nAs per your lease agreement, you are required to remedy this situation by [Remedy Date]. Failure to do so may result in further action, up to and including eviction.\n\nPlease contact us immediately to discuss this matter and resolve the issue.\n\nSincerely,\n[Property Manager]",
    category: 'general',
    tags: ['lease', 'violation', 'notice']
  },
  {
    id: 'emergency-notice',
    title: 'Emergency Notice',
    subject: 'URGENT: Emergency Notice for [Property Name]',
    body: "Dear [Tenant Name],\n\nThis is an urgent notice regarding an emergency situation at [Property Name].\n\n[Describe Emergency Situation and Instructions]\n\nWe are working to resolve this issue as quickly as possible and will provide updates as they become available. We apologize for any inconvenience and appreciate your cooperation.\n\nFor immediate assistance, please contact [Emergency Contact].\n\nSincerely,\n[Property Manager]",
    category: 'announcement',
    tags: ['emergency', 'urgent', 'notice']
  }
];

export const getTemplatesByCategory = (category: CommunicationTemplate['category']) => {
  return communicationTemplates.filter(template => template.category === category);
};

export const getTemplateById = (id: string) => {
  return communicationTemplates.find(template => template.id === id);
};
