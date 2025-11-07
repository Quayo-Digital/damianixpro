-- Row Level Security (RLS) Policies for Short-Let Tables
-- Phase 1: Basic policies for owners, agents, guests, and admins

-- Listings policies
CREATE POLICY "Owners can view their own listings"
  ON listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = listings.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can create listings for their properties"
  ON listings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = listings.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their own listings"
  ON listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = listings.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete their own listings"
  ON listings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = listings.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active listings"
  ON listings FOR SELECT
  USING (active = TRUE);

-- Listing availabilities policies
CREATE POLICY "Owners can manage availabilities for their listings"
  ON listing_availabilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM listings
      JOIN properties ON properties.id = listings.property_id
      WHERE listings.id = listing_availabilities.listing_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view availabilities for active listings"
  ON listing_availabilities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_availabilities.listing_id
      AND listings.active = TRUE
    )
  );

-- Bookings policies
CREATE POLICY "Guests can view their own bookings"
  ON bookings FOR SELECT
  USING (guest_id = auth.uid());

CREATE POLICY "Owners can view bookings for their listings"
  ON bookings FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Guests can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Owners can update bookings for their listings"
  ON bookings FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Guests can cancel their own bookings"
  ON bookings FOR UPDATE
  USING (
    guest_id = auth.uid()
    AND status IN ('pending', 'confirmed')
  )
  WITH CHECK (status = 'cancelled');

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (true); -- Will be restricted by application logic

-- Wallets policies
CREATE POLICY "Users can view their own wallet"
  ON wallets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can update wallets"
  ON wallets FOR UPDATE
  USING (true); -- Will be restricted by application logic

-- Guest documents policies
CREATE POLICY "Users can view their own documents"
  ON guest_documents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can upload their own documents"
  ON guest_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can view documents for their bookings"
  ON guest_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = guest_documents.booking_id
      AND bookings.owner_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Public can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND (bookings.guest_id = auth.uid() OR bookings.owner_id = auth.uid())
      AND bookings.status = 'completed'
    )
  );

CREATE POLICY "Reviewers can update their own reviews"
  ON reviews FOR UPDATE
  USING (reviewer_id = auth.uid());

-- Admin policies (for users with admin role)
-- Note: These assume you have a user_roles table with role checking
CREATE POLICY "Admins can view all listings"
  ON listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

