-- Rental applications + document links (used by applicationApi / RentalApplicationDialog)
-- PostgREST returns 404 if these tables are missing.

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text,
  file_type text,
  file_size bigint,
  category text,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents (user_id);

CREATE TABLE IF NOT EXISTS public.rental_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  monthly_income numeric,
  occupation text,
  current_address text,
  move_in_date text,
  tenancy_period integer NOT NULL DEFAULT 12,
  num_occupants integer NOT NULL DEFAULT 1,
  has_pets boolean NOT NULL DEFAULT false,
  pets_details text,
  employment_status text DEFAULT 'full-time',
  employer_name text,
  employer_contact text,
  emergency_contact_name text NOT NULL DEFAULT '',
  emergency_contact_phone text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (
      status = ANY (
        ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'more_info'::text]
      )
    ),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rental_applications_property_id ON public.rental_applications (property_id);
CREATE INDEX IF NOT EXISTS idx_rental_applications_user_id ON public.rental_applications (user_id);

CREATE TABLE IF NOT EXISTS public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.rental_applications (id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'supporting_document',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON public.application_documents (application_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

-- documents: owner only
CREATE POLICY "documents_select_own" ON public.documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "documents_insert_own" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update_own" ON public.documents FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_delete_own" ON public.documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- rental_applications: applicant + property owner
CREATE POLICY "rental_applications_select_own" ON public.rental_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "rental_applications_select_as_owner" ON public.rental_applications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = rental_applications.property_id AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY "rental_applications_insert_own" ON public.rental_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rental_applications_update_owner_or_applicant" ON public.rental_applications FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = rental_applications.property_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = rental_applications.property_id AND p.owner_id = auth.uid()
    )
  );

-- application_documents: via owning application or document
CREATE POLICY "application_documents_select" ON public.application_documents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rental_applications ra
      WHERE ra.id = application_documents.application_id
        AND (
          ra.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = ra.property_id AND p.owner_id = auth.uid()
          )
        )
    )
  );
CREATE POLICY "application_documents_insert_applicant" ON public.application_documents FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rental_applications ra
      WHERE ra.id = application_documents.application_id AND ra.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = application_documents.document_id AND d.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.rental_applications TO authenticated;
GRANT SELECT, INSERT ON public.application_documents TO authenticated;

-- Admins (same helper as rest of schema)
CREATE POLICY "documents_admin_all" ON public.documents FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "rental_applications_admin_all" ON public.rental_applications FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "application_documents_admin_all" ON public.application_documents FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
