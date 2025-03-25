# Productif.io API Webhook Guide

This guide describes how to use the Productif.io API webhooks to integrate with n8n and other automation tools.

## Authentication

All webhook endpoints support authentication using JWT tokens:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

For public integrations, you can skip authentication for certain endpoints, but it's recommended to use authentication for production environments.

## Base URL

The base URL for all webhook endpoints is:

```
https://your-productif-instance.com/api/webhooks
```

## Available Webhooks

### General Webhook Endpoint

**Endpoint:** `/api/webhooks`

This endpoint supports basic task operations.

#### Supported Actions:

1. **Create Task**

```json
{
  "action": "create_task",
  "data": {
    "title": "Complete project report",
    "description": "Finish the quarterly report for Project XYZ",
    "userId": "user_id_here",
    "projectId": "optional_project_id",
    "dueDate": "2023-07-15T23:59:59Z"
  }
}
```

2. **Update Task**

```json
{
  "action": "update_task",
  "data": {
    "id": "task_id_here",
    "title": "Updated task title",
    "description": "Updated description",
    "dueDate": "2023-07-20T23:59:59Z"
  }
}
```

3. **Complete Task**

```json
{
  "action": "complete_task",
  "data": {
    "id": "task_id_here"
  }
}
```

### Objectives Webhook Endpoint

**Endpoint:** `/api/webhooks/objectives`

This endpoint supports OKR and objective management.

#### Supported Actions:

1. **Create Mission**

```json
{
  "action": "create_mission",
  "data": {
    "title": "Q3 2023 Goals",
    "quarter": 3,
    "year": 2023,
    "userId": "user_id_here",
    "target": 100
  }
}
```

2. **Create Objective**

```json
{
  "action": "create_objective",
  "data": {
    "title": "Increase user engagement",
    "missionId": "mission_id_here",
    "target": 85
  }
}
```

3. **Update Objective Progress**

```json
{
  "action": "update_objective_progress",
  "data": {
    "id": "objective_id_here",
    "current": 65
  }
}
```

### Habits Webhook Endpoint

**Endpoint:** `/api/webhooks/habits`

This endpoint supports habit tracking and management.

#### Supported Actions:

1. **Create Habit**

```json
{
  "action": "create_habit",
  "data": {
    "name": "Morning Meditation",
    "description": "15-minute morning meditation",
    "frequency": "daily",
    "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "userId": "user_id_here",
    "color": "#4A90E2"
  }
}
```

2. **Log Habit Entry**

```json
{
  "action": "log_habit_entry",
  "data": {
    "habitId": "habit_id_here",
    "date": "2023-07-12",
    "completed": true,
    "note": "Felt great today!",
    "rating": 5
  }
}
```

3. **Get Habit Stats**

```json
{
  "action": "get_habit_stats",
  "data": {
    "userId": "user_id_here",
    "startDate": "2023-07-01",
    "endDate": "2023-07-31"
  }
}
```

## Integration with n8n

### Setting up a Webhook Node in n8n

1. Add a "Webhook" node to your workflow.
2. Configure it to make HTTP requests to the appropriate Productif.io webhook endpoint.
3. Set up the payload as described in the examples above.

### Example n8n Workflow: Creating a Task from Email

1. Use the "Email" trigger node to listen for incoming emails.
2. Add a "Function" node to extract task details from the email.
3. Add an "HTTP Request" node to send data to the Productif webhook:
   - Method: POST
   - URL: https://your-productif-instance.com/api/webhooks
   - Body: JSON containing the action and task data

### Example n8n Workflow: Updating OKR Progress

1. Use a "Schedule" trigger to run weekly.
2. Add an "HTTP Request" node to fetch data from your analytics platform.
3. Add a "Function" node to calculate progress metrics.
4. Add another "HTTP Request" node to update OKR progress:
   - Method: POST
   - URL: https://your-productif-instance.com/api/webhooks/objectives
   - Body: JSON with the "update_objective_progress" action

## Security Considerations

1. Store your JWT tokens securely in n8n credentials.
2. Consider using IP whitelisting for additional security.
3. Validate all incoming data before processing it.
4. Monitor webhook usage to detect unusual patterns.

## Troubleshooting

- Ensure your payload matches the expected format.
- Check that all required fields are provided.
- Verify that your authentication token is valid.
- Look for error responses that can provide clues about any issues.

## Getting Help

If you need assistance with the Productif.io API, please contact our support team or refer to the main documentation. 