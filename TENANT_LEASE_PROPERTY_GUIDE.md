# How Tenants Can Lease Properties from the Tenant Dashboard

## Overview

Tenants can browse available properties and submit rental applications directly from their Tenant Dashboard. This guide explains the complete workflow.

## Step-by-Step Process

### 1. **Access Tenant Dashboard**

- Navigate to `/tenant/dashboard` after logging in as a tenant
- The dashboard shows an overview of your current lease (if any), payments, and available properties

### 2. **Browse Available Properties**

#### Option A: From Dashboard "Properties" Tab

1. Click on the **"Properties"** tab in the Tenant Dashboard
2. You'll see two sections:
   - **Available Longterm Properties**: Properties available for annual lease
   - **Available Shortlet Listings**: Short-term rental properties

#### Option B: View All Properties

1. Click **"View All Properties"** button in the Longterm Properties section
2. This navigates to `/public/properties` - the public property browsing page
3. Use filters to search by:
   - Location
   - Price range
   - Property type (Apartment, House, etc.)
   - Bedrooms/Bathrooms
   - Amenities

### 3. **View Property Details**

1. Click on any property card in the dashboard or browse page
2. You'll be taken to `/public/properties/:id` - the public property detail page
3. View:
   - High-quality photos
   - Property description
   - Amenities and features
   - Location on map
   - Pricing information

### 4. **Apply to Lease a Property**

#### From Property Detail Page:

1. On the property detail page, you'll see a **"Apply to Rent"** button
2. Click the button to open the Rental Application Dialog
3. Fill out the application form with:
   - Personal information
   - Employment details
   - Income information
   - References
   - Preferred move-in date
   - Upload required documents (ID, proof of income, etc.)

#### Alternative: Direct Application Link

- You can also navigate directly to `/apply/:propertyId` if you have the property ID

### 5. **Submit Application**

1. Complete all required fields in the application form
2. Upload necessary documents
3. Review terms and conditions
4. Click **"Submit Application"**
5. You'll be redirected to `/application-success` page
6. You'll receive a confirmation email

### 6. **Track Application Status**

- Check your notifications in the Tenant Dashboard
- Property owner/agent will review your application
- You'll be notified when a decision is made

## Key Routes for Tenants

| Route                    | Purpose                         | Access                 |
| ------------------------ | ------------------------------- | ---------------------- |
| `/tenant/dashboard`      | Main tenant dashboard           | Tenant only            |
| `/public/properties`     | Browse all available properties | Public (authenticated) |
| `/public/properties/:id` | View property details           | Public (authenticated) |
| `/apply/:id`             | Submit rental application       | Authenticated users    |
| `/application-success`   | Application confirmation        | Authenticated users    |

## Features Available

### Property Browsing

- ✅ View available longterm properties
- ✅ View available shortlet listings
- ✅ Filter by location, price, type, amenities
- ✅ View property details with photos
- ✅ See pricing and payment terms

### Application Process

- ✅ Submit rental applications
- ✅ Upload required documents
- ✅ Request property viewings
- ✅ Contact property agents
- ✅ Track application status

### Shortlets

- ✅ Browse short-term rental listings
- ✅ Book shortlets directly
- ✅ View availability calendar
- ✅ Make instant bookings

## Important Notes

1. **Authentication Required**: You must be logged in as a tenant to:
   - Submit applications
   - Request viewings
   - Contact agents
   - Track applications

2. **Property Access**:
   - Tenants can only view **available** properties
   - Properties you're already leasing appear in your dashboard overview
   - You cannot access owner property management pages (`/properties`)

3. **Application Requirements**:
   - Valid ID (National ID, Passport, Driver's License)
   - Proof of income
   - Employment details
   - References (previous landlords, employers)
   - Emergency contact information

4. **Payment Terms**:
   - In Nigeria, rent is typically paid **annually**
   - You'll need to pay:
     - Annual rent amount
     - Security deposit (usually 1-2 months rent)
     - Agency fees (if applicable)

## Troubleshooting

### Issue: Can't see properties in dashboard

**Solution**:

- Make sure you're logged in as a tenant
- Check if there are available properties in the system
- Try clicking "View All Properties" to browse the full catalog

### Issue: "Apply to Rent" button is disabled

**Solution**:

- Property might not be available
- Check property status (should be "Available")
- Make sure you're logged in

### Issue: Can't submit application

**Solution**:

- Ensure all required fields are filled
- Upload all required documents
- Check your internet connection
- Try refreshing the page

## Quick Access Links

From Tenant Dashboard:

- **Browse Properties**: Click "View All Properties" → `/public/properties`
- **View Shortlets**: Click "View All Shortlets" → `/shortlets`
- **Current Lease**: View in "Overview" tab
- **Payments**: Click "Payments" tab
- **Maintenance**: Click "Maintenance" tab

## Next Steps After Application

1. **Wait for Review**: Property owner/agent reviews your application
2. **Receive Response**: You'll get a notification about the decision
3. **If Approved**:
   - Sign lease agreement
   - Make initial payment (rent + deposit)
   - Get property keys
   - Move in!

4. **If Rejected**:
   - You can apply to other properties
   - Contact the agent for feedback
   - Improve your application and try again

---

**Need Help?** Contact property management through the Messages section in your dashboard or email support@damianixpro.com
