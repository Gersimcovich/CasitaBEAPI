# Guesty Booking Engine API (BEAPI) Quick Reference

## Overview
The Booking Engine API enables direct booking integration with better rate limits than the Open API.

---

## Base URLs

```
API Base:    https://booking.guesty.com/api
Auth:        https://booking.guesty.com/oauth2/token
```

---

## Authentication

### ⚠️ IMPORTANT: BEAPI has SEPARATE Credentials!
**BEAPI uses DIFFERENT client_id and client_secret from your Open API credentials!**
You need to create a Booking Engine API instance in Guesty Dashboard:
- Go to Growth → Distribution → Booking Engine API → Create new API key

### Get Access Token
```bash
curl -X POST https://booking.guesty.com/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=client_credentials" \
  -d "scope=booking_engine:api"
```

### Your BEAPI Credentials (DIFFERENT from Open API!)
```
Client ID:     0oaskkr3z8rbqpeK25d7
Client Secret: jGieE2LSCpRaHRsvD_tDRgaft1aTQEnXS-TKJULQrC94UUxqU15OyeHHgYAnWc6S
```

### Your Open API Credentials (for PMS operations)
```
Client ID:     0oash6p7aiHL6nznW5d7
Client Secret: sGTWMqt7OMEkm75VK_S2skf9aVAHm8-gZ73A4LrybgUUtZ1grR3dNj4efvd_GKJ7
```

### Use Token in Requests
```bash
curl -X GET "https://booking.guesty.com/api/listings" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Token Rules
- Expires after **24 hours** (86,400 seconds)
- Max **5 applications** per account
- Renewable **3 times per 24 hours**
- **Best practice**: Cache and reuse until expiration

---

## Rate Limits

| Limit | Value |
|-------|-------|
| Per second | 5 requests |
| Per minute | 275 requests |
| Per hour | 16,500 requests |

**On 429 error**: Use exponential backoff

---

## Endpoints Quick Reference

### LISTINGS

#### Get All Listings
```
GET /api/listings
```
**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| limit | number | Max 100, default 20 |
| checkIn | string | YYYY-MM-DD |
| checkOut | string | YYYY-MM-DD |
| minOccupancy | number | Min guests |
| numberOfBedrooms | number | |
| numberOfBathrooms | number | |
| minPrice | number | |
| maxPrice | number | |
| currency | string | USD, EUR, etc |
| propertyType | string | |
| tags | string | Comma-separated |
| latitude | number | For geo search |
| longitude | number | For geo search |

**Example:**
```bash
curl "https://booking.guesty.com/api/listings?limit=20&checkIn=2025-03-01&checkOut=2025-03-05" \
  -H "Authorization: Bearer TOKEN"
```

---

#### Get Single Listing
```
GET /api/listings/{listingId}
```
**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| fields | string | Optional: customize response |

**Example:**
```bash
curl "https://booking.guesty.com/api/listings/5fa3143b126c86002fe2f1e6" \
  -H "Authorization: Bearer TOKEN"
```

---

#### Get Cities
```
GET /api/listings/cities
```
**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| limit | number | Max 100 |
| skip | number | Pagination offset |
| searchText | string | Filter by text |

---

#### Get Calendar/Availability
```
GET /api/listings/{listingId}/calendar
```
**Parameters (Required):**
| Param | Type | Description |
|-------|------|-------------|
| from | string | YYYY-MM-DD start |
| to | string | YYYY-MM-DD end |

**Example:**
```bash
curl "https://booking.guesty.com/api/listings/LISTING_ID/calendar?from=2025-03-01&to=2025-03-31" \
  -H "Authorization: Bearer TOKEN"
```

---

#### Get Payment Provider
```
GET /api/listings/{listingId}/payment-provider
```
Returns Stripe configuration for the listing.

---

### RESERVATIONS

#### Create Quote
```
POST /api/reservations/quotes
```
**Body (Required):**
```json
{
  "listingId": "5fa3143b126c86002fe2f1e6",
  "checkInDateLocalized": "2025-03-01",
  "checkOutDateLocalized": "2025-03-05",
  "guestsCount": 2,
  "coupons": ["DISCOUNT10"]  // optional
}
```

**Example:**
```bash
curl -X POST "https://booking.guesty.com/api/reservations/quotes" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "LISTING_ID",
    "checkInDateLocalized": "2025-03-01",
    "checkOutDateLocalized": "2025-03-05",
    "guestsCount": 2
  }'
```

**Response includes:** `quoteId`, pricing breakdown, expiration

---

#### Get Quote Details
```
GET /api/reservations/quotes/{quoteId}
```

---

#### Create Instant Reservation (with Stripe token)
```
POST /api/reservations/quotes/{quoteId}/instant
```
**Body:**
```json
{
  "ratePlanId": "rate_plan_id",
  "ccToken": "pm_xxxxx",  // Stripe payment method token
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

**Note:** Only accepts Stripe SCA tokens (pm_... format)

---

#### Create Inquiry (Request to Book)
```
POST /api/reservations/quotes/{quoteId}/inquiry
```
**Body:**
```json
{
  "ratePlanId": "rate_plan_id",
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "message": "Looking forward to my stay!"
}
```

Payment optional for inquiries.

---

#### Instant Charge Reservation
```
POST /api/reservations/quotes/{quoteId}/instant-charge
```
Uses Stripe confirmation tokens (ctoken_... format) for immediate charge.

---

#### Get Reservation Details
```
GET /api/reservations/{reservationId}/details
```

---

#### Verify Charge
```
POST /api/reservations/{reservationId}/verify-charge
```

---

### PAYOUTS

#### Get Payout Schedule
```
GET /api/reservations/payouts/list
```
**Parameters (Required):**
| Param | Type | Description |
|-------|------|-------------|
| listingId | string | |
| checkIn | string | YYYY-MM-DD |
| checkOut | string | YYYY-MM-DD |
| total | number | Total amount |
| bookingType | string | instant/inquiry |

---

## Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check parameters |
| 401 | Unauthorized | Check API key/token |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check resource ID |
| 429 | Rate Limited | Wait + retry with backoff |
| 500 | Server Error | Retry later |

---

## Booking Flow

### 1. Search Available Properties
```
GET /api/listings?checkIn=DATE&checkOut=DATE&minOccupancy=GUESTS
```

### 2. Get Calendar for Selected Property
```
GET /api/listings/{id}/calendar?from=DATE&to=DATE
```

### 3. Create Quote
```
POST /api/reservations/quotes
Body: { listingId, checkInDateLocalized, checkOutDateLocalized, guestsCount }
```

### 4a. Instant Booking (with payment)
```
POST /api/reservations/quotes/{quoteId}/instant
Body: { ratePlanId, ccToken, guest }
```

### 4b. OR Request to Book (inquiry)
```
POST /api/reservations/quotes/{quoteId}/inquiry
Body: { ratePlanId, guest, message }
```

---

## Important Notes

1. **Wait 60 seconds** between reservation manipulation requests
2. **Coupon codes**: Alphanumeric only (no special characters)
3. **Stripe tokens**: Use `pm_` prefix for instant, `ctoken_` for instant-charge
4. **Calendar params**: BEAPI uses `from`/`to`, NOT `startDate`/`endDate`
5. **Auto-payments**: Can be configured in Guesty dashboard

---

## TypeScript Example

```typescript
const BEAPI_URL = 'https://booking.guesty.com/api';
const BEAPI_AUTH_URL = 'https://booking.guesty.com/oauth2/token';

// Uses SAME credentials as Open API, just different endpoint and scope
async function getToken(): Promise<string> {
  const res = await fetch(BEAPI_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GUESTY_CLIENT_ID!,      // Same as Open API
      client_secret: process.env.GUESTY_CLIENT_SECRET!, // Same as Open API
      grant_type: 'client_credentials',
      scope: 'booking_engine:api',  // Different scope for BEAPI
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function beapiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BEAPI_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}

// Get listings
const listings = await beapiFetch('/listings?limit=20');

// Get calendar
const calendar = await beapiFetch(`/listings/${listingId}/calendar?from=2025-03-01&to=2025-03-31`);

// Create quote
const quote = await beapiFetch('/reservations/quotes', {
  method: 'POST',
  body: JSON.stringify({
    listingId: 'xxx',
    checkInDateLocalized: '2025-03-01',
    checkOutDateLocalized: '2025-03-05',
    guestsCount: 2,
  }),
});
```

---

## Environment Variables Needed

```env
# BEAPI Credentials (for booking website)
GUESTY_BEAPI_CLIENT_ID=0oaskkr3z8rbqpeK25d7
GUESTY_BEAPI_CLIENT_SECRET=jGieE2LSCpRaHRsvD_tDRgaft1aTQEnXS-TKJULQrC94UUxqU15OyeHHgYAnWc6S

# Open API Credentials (for PMS/dashboard operations)
GUESTY_CLIENT_ID=0oash6p7aiHL6nznW5d7
GUESTY_CLIENT_SECRET=sGTWMqt7OMEkm75VK_S2skf9aVAHm8-gZ73A4LrybgUUtZ1grR3dNj4efvd_GKJ7
```

---

## Differences from Open API

| Feature | Open API | BEAPI |
|---------|----------|-------|
| Token URL | open-api.guesty.com/oauth2/token | booking.guesty.com/oauth2/token |
| Scope | `open-api` | `booking_engine:api` |
| API Base URL | open-api.guesty.com/v1 | booking.guesty.com/api |
| Credentials | **DIFFERENT** | **DIFFERENT** |
| Rate limits | Strict (~200/min) | More generous (275/min, 5/sec) |
| Calendar params | startDate/endDate | from/to |
| Reservations | Full CRUD | Quote → Book flow |
| Best for | PMS/management | Direct booking sites |

---

## Quick Commands Cheatsheet

```bash
# Get token
curl -X POST https://booking.guesty.com/oauth2/token \
  -d "client_id=ID&client_secret=SECRET&grant_type=client_credentials"

# List properties
curl "https://booking.guesty.com/api/listings" -H "Authorization: Bearer TOKEN"

# Search with dates
curl "https://booking.guesty.com/api/listings?checkIn=2025-03-01&checkOut=2025-03-05&minOccupancy=4" \
  -H "Authorization: Bearer TOKEN"

# Get calendar
curl "https://booking.guesty.com/api/listings/LISTING_ID/calendar?from=2025-03-01&to=2025-04-01" \
  -H "Authorization: Bearer TOKEN"

# Create quote
curl -X POST "https://booking.guesty.com/api/reservations/quotes" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listingId":"ID","checkInDateLocalized":"2025-03-01","checkOutDateLocalized":"2025-03-05","guestsCount":2}'

# Book instantly
curl -X POST "https://booking.guesty.com/api/reservations/quotes/QUOTE_ID/instant" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ratePlanId":"RATE_ID","ccToken":"pm_xxx","guest":{"firstName":"John","lastName":"Doe","email":"j@d.com"}}'
```
