# Experimentation Platform API Documentation

This document provides documentation for the Experimentation Platform API endpoints.

## Base URL

The base URL for all API endpoints is:

```
http://localhost:3000
```

## Authentication

Authentication is not implemented in this demo version.

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: The request was successful
- `201 Created`: The resource was successfully created
- `400 Bad Request`: The request was invalid
- `404 Not Found`: The requested resource was not found
- `500 Internal Server Error`: An error occurred on the server

Error responses have the following format:

```json
{
  "message": "Error message",
  "error": "Detailed error information (only in development mode)"
}
```

## Endpoints

### Experiment Management

#### Create Experiment

```
POST /experiments
```

Create a new experiment.

**Request Body:**

```json
{
  "name": "Button Color Test",
  "description": "Testing impact of button color on conversion",
  "variants": [
    {
      "name": "Control",
      "config": { "buttonColor": "blue" }
    },
    {
      "name": "Treatment",
      "config": { "buttonColor": "green" }
    }
  ],
  "targetUserPercentage": 100,
  "startDate": "2025-03-20T12:00:00Z",
  "endDate": "2025-04-20T12:00:00Z"
}
```

**Response:**

```json
{
  "experiment": {
    "id": "exp123",
    "name": "Button Color Test",
    "description": "Testing impact of button color on conversion",
    "status": "DRAFT",
    "variants": [
      {
        "id": "var1",
        "name": "Control",
        "config": { "buttonColor": "blue" }
      },
      {
        "id": "var2",
        "name": "Treatment",
        "config": { "buttonColor": "green" }
      }
    ],
    "targetUserPercentage": 100,
    "createdAt": "2025-03-20T12:00:00Z",
    "updatedAt": "2025-03-20T12:00:00Z",
    "startDate": "2025-03-20T12:00:00Z",
    "endDate": "2025-04-20T12:00:00Z"
  }
}
```

#### List Experiments

```
GET /experiments
```

List all experiments with optional filtering.

**Query Parameters:**

- `status` (optional): Filter by experiment status (`DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`)
- `limit` (optional): Maximum number of experiments to return
- `offset` (optional): Number of experiments to skip

**Response:**

```json
{
  "experiments": [
    {
      "id": "exp123",
      "name": "Button Color Test",
      "description": "Testing impact of button color on conversion",
      "status": "ACTIVE",
      "variants": [
        {
          "id": "var1",
          "name": "Control",
          "config": { "buttonColor": "blue" }
        },
        {
          "id": "var2",
          "name": "Treatment",
          "config": { "buttonColor": "green" }
        }
      ],
      "targetUserPercentage": 100,
      "createdAt": "2025-03-20T12:00:00Z",
      "updatedAt": "2025-03-20T12:00:00Z"
    }
  ],
  "total": 1
}
```

#### Get Experiment

```
GET /experiments/:id
```

Get a specific experiment by ID.

**Response:**

```json
{
  "experiment": {
    "id": "exp123",
    "name": "Button Color Test",
    "description": "Testing impact of button color on conversion",
    "status": "ACTIVE",
    "variants": [
      {
        "id": "var1",
        "name": "Control",
        "config": { "buttonColor": "blue" }
      },
      {
        "id": "var2",
        "name": "Treatment",
        "config": { "buttonColor": "green" }
      }
    ],
    "targetUserPercentage": 100,
    "createdAt": "2025-03-20T12:00:00Z",
    "updatedAt": "2025-03-20T12:00:00Z"
  }
}
```

#### Update Experiment

```
PUT /experiments/:id
```

Update an existing experiment.

**Request Body:**

```json
{
  "name": "Updated Button Color Test",
  "status": "ACTIVE"
}
```

**Response:**

```json
{
  "experiment": {
    "id": "exp123",
    "name": "Updated Button Color Test",
    "description": "Testing impact of button color on conversion",
    "status": "ACTIVE",
    "variants": [
      {
        "id": "var1",
        "name": "Control",
        "config": { "buttonColor": "blue" }
      },
      {
        "id": "var2",
        "name": "Treatment",
        "config": { "buttonColor": "green" }
      }
    ],
    "targetUserPercentage": 100,
    "createdAt": "2025-03-20T12:00:00Z",
    "updatedAt": "2025-03-20T12:30:00Z"
  }
}
```

#### Get Active Experiments for User

```
GET /experiments/active?userId=user123&sessionId=session456
```

Get active experiments assigned to a specific user.

**Query Parameters:**

- `userId` (required): User identifier
- `sessionId` (required): Session identifier

**Response:**

```json
{
  "experiments": [
    {
      "experimentId": "exp123",
      "variantId": "var2",
      "config": { "buttonColor": "green" }
    }
  ]
}
```

### Event Collection

#### Record Event

```
POST /events
```

Record a single experiment event.

**Request Body:**

```json
{
  "experimentId": "exp123",
  "variantId": "var2",
  "userId": "user123",
  "sessionId": "session456",
  "action": "BUTTON_CLICK",
  "metadata": { 
    "pageLocation": "hero-section",
    "timeOnPage": 45
  }
}
```

**Response:**

```json
{
  "success": true,
  "eventId": "evt789"
}
```

#### Batch Record Events

```
POST /events/batch
```

Record multiple experiment events in a single request.

**Request Body:**

```json
{
  "events": [
    {
      "experimentId": "exp123",
      "variantId": "var2",
      "userId": "user123",
      "sessionId": "session456",
      "action": "PAGE_VIEW"
    },
    {
      "experimentId": "exp123",
      "variantId": "var2",
      "userId": "user123",
      "sessionId": "session456",
      "action": "BUTTON_CLICK",
      "metadata": { 
        "pageLocation": "hero-section"
      }
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "eventIds": ["evt789", "evt790"]
}
```

### Report Management

#### Generate Report

```
POST /reports
```

Generate a new report for an experiment.

**Request Body:**

```json
{
  "experimentId": "exp123",
  "timeRange": {
    "start": "2025-03-19T00:00:00Z",
    "end": "2025-03-20T23:59:59Z"
  }
}
```

**Response:**

```json
{
  "reportId": "rep456",
  "status": "PENDING"
}
```

#### Get Report Metadata

```
GET /reports/:id
```

Get metadata for a specific report.

**Response:**

```json
{
  "report": {
    "id": "rep456",
    "experimentId": "exp123",
    "status": "COMPLETED",
    "s3Location": "reports/exp123/rep456.json",
    "createdAt": "2025-03-20T14:00:00Z",
    "updatedAt": "2025-03-20T14:30:00Z",
    "metrics": {
      "totalEvents": 3750,
      "variantCounts": {
        "var1": 1250,
        "var2": 1250
      }
    }
  }
}
```

#### List Reports

```
GET /reports
```

List all reports with optional filtering.

**Query Parameters:**

- `experimentId` (optional): Filter by experiment ID
- `status` (optional): Filter by report status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`)
- `limit` (optional): Maximum number of reports to return
- `offset` (optional): Number of reports to skip

**Response:**

```json
{
  "reports": [
    {
      "id": "rep456",
      "experimentId": "exp123",
      "status": "COMPLETED",
      "s3Location": "reports/exp123/rep456.json",
      "createdAt": "2025-03-20T14:00:00Z",
      "updatedAt": "2025-03-20T14:30:00Z",
      "metrics": {
        "totalEvents": 3750,
        "variantCounts": {
          "var1": 1250,
          "var2": 1250
        }
      }
    }
  ],
  "total": 1
}
```

#### Get Report Data

```
GET /reports/:id/data
```

Get the full data for a completed report.

**Response:**

```json
{
  "reportData": {
    "experimentId": "exp123",
    "experimentName": "Button Color Test",
    "generatedAt": "2025-03-20T14:30:00Z",
    "timeRange": {
      "start": "2025-03-19T00:00:00Z",
      "end": "2025-03-20T23:59:59Z"
    },
    "metrics": {
      "overall": {
        "totalUsers": 1250,
        "totalEvents": 3750,
        "conversionRate": 0.15
      },
      "byVariant": {
        "var1": {
          "users": 625,
          "events": {
            "PAGE_VIEW": 625,
            "BUTTON_CLICK": 75,
            "CONVERSION": 75
          },
          "conversionRate": 0.12
        },
        "var2": {
          "users": 625,
          "events": {
            "PAGE_VIEW": 625,
            "BUTTON_CLICK": 125,
            "CONVERSION": 112
          },
          "conversionRate": 0.18,
          "improvement": 50.0,
          "significanceLevel": 0.03
        }
      },
      "timeSeries": {
        "dates": ["2025-03-19", "2025-03-20"],
        "byVariant": {
          "var1": {
            "events": [300, 325],
            "conversions": [36, 39]
          },
          "var2": {
            "events": [310, 315],
            "conversions": [56, 56]
          }
        }
      }
    }
  }
}
```

### Health Check

```
GET /health
```

Check the health of the API and its dependencies.

**Response:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "environment": "development",
  "dependencies": {
    "dynamodb": "ok",
    "s3": "ok",
    "batch": "ok"
  }
}