# 🔌 DamianixPro API Documentation

## Overview

The DamianixPro API provides comprehensive endpoints for managing properties, tenants, payments, and all platform functionality. Built on Supabase with Row Level Security (RLS) for data protection.

## Base URL

```
Development: http://localhost:8081/api
Production: https://your-domain.com/api
```

## Authentication

All API requests require authentication using Supabase JWT tokens.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Getting Authentication Token

```typescript
import { supabase } from '@/lib/supabase';

// Sign in user
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Use data.session.access_token for API calls
```

## Core Endpoints

### Authentication

#### Sign Up

```http
POST /auth/signup
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "tenant|owner|agent|vendor"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "tenant"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

#### Sign In

```http
POST /auth/signin
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Sign Out

```http
POST /auth/signout
```

### Properties

#### List Properties

```http
GET /api/properties
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `location` (optional): Filter by location
- `property_type` (optional): apartment|house|commercial
- `min_price` (optional): Minimum price filter
- `max_price` (optional): Maximum price filter

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "3-Bedroom Apartment in Lekki",
      "description": "Modern apartment with ocean view",
      "price": 2500000,
      "location": "Lekki, Lagos",
      "property_type": "apartment",
      "bedrooms": 3,
      "bathrooms": 2,
      "size": 120,
      "images": ["url1", "url2"],
      "amenities": ["parking", "gym", "pool"],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Get Property Details

```http
GET /api/properties/:id
```

**Response:**

```json
{
  "id": "uuid",
  "title": "3-Bedroom Apartment in Lekki",
  "description": "Modern apartment with ocean view",
  "price": 2500000,
  "location": "Lekki, Lagos",
  "property_type": "apartment",
  "bedrooms": 3,
  "bathrooms": 2,
  "size": 120,
  "images": ["url1", "url2"],
  "amenities": ["parking", "gym", "pool"],
  "owner": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "+234123456789"
  },
  "agent": {
    "id": "uuid",
    "name": "Jane Smith",
    "phone": "+234987654321"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Create Property

```http
POST /api/properties
```

**Request Body:**

```json
{
  "title": "3-Bedroom Apartment in Lekki",
  "description": "Modern apartment with ocean view",
  "price": 2500000,
  "location": "Lekki, Lagos",
  "property_type": "apartment",
  "bedrooms": 3,
  "bathrooms": 2,
  "size": 120,
  "amenities": ["parking", "gym", "pool"],
  "images": ["url1", "url2"]
}
```

#### Update Property

```http
PUT /api/properties/:id
```

#### Delete Property

```http
DELETE /api/properties/:id
```

### Payments

#### Initialize Payment

```http
POST /api/payments/initialize
```

**Request Body:**

```json
{
  "amount": 250000000,
  "payment_type": "rent|deposit|late_fee",
  "payment_method": "paystack|flutterwave|bank_transfer",
  "tenant_id": "uuid",
  "lease_id": "uuid",
  "description": "Monthly rent payment"
}
```

**Response:**

```json
{
  "payment_id": "uuid",
  "reference": "REF_123456789",
  "authorization_url": "https://checkout.paystack.com/xyz",
  "access_code": "access_code_123"
}
```

#### Verify Payment

```http
POST /api/payments/verify
```

**Request Body:**

```json
{
  "reference": "REF_123456789",
  "payment_id": "uuid"
}
```

**Response:**

```json
{
  "status": "success|failed",
  "amount": 250000000,
  "currency": "NGN",
  "transaction_date": "2024-01-01T00:00:00Z",
  "gateway_response": "Approved"
}
```

#### Payment History

```http
GET /api/payments/history
```

**Query Parameters:**

- `tenant_id` (optional): Filter by tenant
- `status` (optional): pending|completed|failed
- `start_date` (optional): Filter from date
- `end_date` (optional): Filter to date

### Tenants

#### List Tenants

```http
GET /api/tenants
```

#### Get Tenant Details

```http
GET /api/tenants/:id
```

**Response:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+234123456789",
  "date_of_birth": "1990-01-01",
  "occupation": "Software Engineer",
  "monthly_income": 500000,
  "current_lease": {
    "id": "uuid",
    "property": {
      "title": "3-Bedroom Apartment",
      "location": "Lekki, Lagos"
    },
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "monthly_rent": 250000
  },
  "payment_history": [
    {
      "id": "uuid",
      "amount": 250000,
      "payment_date": "2024-01-01T00:00:00Z",
      "status": "completed"
    }
  ]
}
```

#### Create Tenant

```http
POST /api/tenants
```

#### Update Tenant

```http
PUT /api/tenants/:id
```

### Maintenance Requests

#### List Maintenance Requests

```http
GET /api/maintenance
```

#### Create Maintenance Request

```http
POST /api/maintenance
```

**Request Body:**

```json
{
  "property_id": "uuid",
  "tenant_id": "uuid",
  "title": "Leaking faucet",
  "description": "Kitchen faucet is leaking water",
  "priority": "low|medium|high|urgent",
  "category": "plumbing|electrical|hvac|general"
}
```

#### Update Maintenance Request

```http
PUT /api/maintenance/:id
```

### Documents

#### Upload Document

```http
POST /api/documents/upload
```

**Request Body (multipart/form-data):**

```
file: [binary file data]
document_type: "lease|id|income_proof|reference"
tenant_id: "uuid"
```

#### Get Document

```http
GET /api/documents/:id
```

#### List Documents

```http
GET /api/documents
```

## Error Handling

All API endpoints return errors in the following format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `AUTHENTICATION_ERROR` - Invalid or missing authentication
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - Internal server error

## Rate Limiting

API requests are limited to:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Payment Webhooks

DamianixPro supports webhooks for payment events:

```http
POST /api/webhooks/payments
```

**Payload:**

```json
{
  "event": "payment.success|payment.failed",
  "data": {
    "payment_id": "uuid",
    "reference": "REF_123456789",
    "amount": 250000000,
    "status": "success",
    "tenant_id": "uuid"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Webhook Security

Webhooks are signed using HMAC-SHA256. Verify signatures:

```typescript
import crypto from 'crypto';

const signature = req.headers['x-nigeria-homes-signature'];
const payload = JSON.stringify(req.body);
const secret = process.env.WEBHOOK_SECRET;

const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { NigeriaHomesAPI } from '@nigeria-homes/sdk';

const api = new NigeriaHomesAPI({
  baseUrl: 'https://api.nigeriahomes.com',
  apiKey: 'your-api-key',
});

// List properties
const properties = await api.properties.list({
  location: 'Lagos',
  property_type: 'apartment',
});

// Create payment
const payment = await api.payments.initialize({
  amount: 250000000,
  tenant_id: 'uuid',
  payment_method: 'paystack',
});
```

### Python

```python
from nigeria_homes import NigeriaHomesAPI

api = NigeriaHomesAPI(
    base_url='https://api.nigeriahomes.com',
    api_key='your-api-key'
)

# List properties
properties = api.properties.list(
    location='Lagos',
    property_type='apartment'
)

# Create payment
payment = api.payments.initialize(
    amount=250000000,
    tenant_id='uuid',
    payment_method='paystack'
)
```

## Testing

### Test Environment

Use the test environment for development:

```
Base URL: http://localhost:8081/api
Test API Keys: Available in development environment
```

### Postman Collection

Import our Postman collection for easy API testing:

```json
{
  "info": {
    "name": "DamianixPro API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Sign Up",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"role\": \"tenant\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/signup",
              "host": ["{{base_url}}"],
              "path": ["auth", "signup"]
            }
          }
        }
      ]
    }
  ]
}
```

## Support

For API support and questions:

- **Documentation**: https://docs.nigeriahomes.com
- **Support Email**: api-support@nigeriahomes.com
- **Developer Portal**: https://developers.nigeriahomes.com
- **Status Page**: https://status.nigeriahomes.com
