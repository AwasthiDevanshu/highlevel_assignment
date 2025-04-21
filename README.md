# CRM Bulk Action Platform

A scalable and efficient bulk action platform for CRM applications, capable of performing various bulk actions on CRM entities with high performance and robust error handling.

## Features

- Bulk update operations for CRM entities
- Rate limiting per account
- Batch processing for large datasets
- Deduplication based on email field
- Scheduled bulk actions
- Real-time progress tracking
- Detailed logging and statistics
- Horizontal scaling support

## Technical Stack

- Node.js
- Express.js
- MongoDB
- Redis (for queue management)
- Bull (for job processing)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/crm-bulk-actions
   REDIS_URL=redis://127.0.0.1:6379
   ```

## API Endpoints

### Create Bulk Action
```
POST /bulk-actions
```
Request body:
```json
{
  "accountId": "string",
  "entityType": "contact",
  "actionType": "update",
  "data": [
    {
      "email": "string",
      "name": "string",
      "age": "number",
      "status": "string"
    }
  ],
  "scheduledFor": "2024-03-20T10:00:00Z" // optional
}
```

### Get Bulk Action
```
GET /bulk-actions/{actionId}
```

### Get Bulk Action Statistics
```
GET /bulk-actions/{actionId}/stats
```

### List Bulk Actions
```
GET /bulk-actions?accountId=string&status=string&entityType=string&limit=number&skip=number
```

## Rate Limiting

The API implements rate limiting with the following configuration:
- 10,000 requests per minute per account
- Rate limit is enforced using the `accountId` parameter

## Error Handling

The system provides detailed error messages and logging for:
- Validation errors
- Processing failures
- Rate limit exceeded
- Database errors
- Queue processing errors

## Performance Considerations

- Batch processing with configurable batch size
- Indexed database queries
- Asynchronous processing using queues
- Horizontal scaling support
- Memory-efficient processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT # highlevel_assignment
