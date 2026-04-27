-- Enable Row Level Security on tables used for messaging (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages') THEN
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage their own messages" ON public.messages;
    DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
    CREATE POLICY "Users can manage their own messages" ON public.messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = recipient_id) WITH CHECK (auth.uid() = sender_id);
    CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.is_admin(auth.uid()));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenants') THEN
    ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Tenants can view their own profile" ON public.tenants;
    DROP POLICY IF EXISTS "Admins can view all tenant profiles" ON public.tenants;
    CREATE POLICY "Tenants can view their own profile" ON public.tenants FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Admins can view all tenant profiles" ON public.tenants FOR SELECT USING (public.is_admin(auth.uid()));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='properties') THEN
    ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated users can view properties" ON public.properties;
    CREATE POLICY "Authenticated users can view properties" ON public.properties FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='property_tenants') THEN
    ALTER TABLE public.property_tenants ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Tenants can view their property link" ON public.property_tenants;
    DROP POLICY IF EXISTS "Admins can view all property-tenant links" ON public.property_tenants;
    CREATE POLICY "Tenants can view their property link" ON public.property_tenants FOR SELECT USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = property_tenants.tenant_id AND tenants.user_id = auth.uid()));
    CREATE POLICY "Admins can view all property-tenant links" ON public.property_tenants FOR SELECT USING (public.is_admin(auth.uid()));
  END IF;
END $$;
