export interface Tenant {
  id: string;
  user_id: string;
  name: string;
  property: string;
  property_id: string;
}

export interface LandlordAgent {
  id: string; // profile id (user_id)
  user_id: string; // same as id, for consistency
  name: string;
  role: 'owner' | 'agent';
  property: string;
  property_id: string;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  key: string;
  category: string;
  title: string | null;
  description: string | null;
  lang: string;
  created_at: string;
  updated_at: string;
}
