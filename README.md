# Life Tracker API

A RESTful API for tracking habits and tasks, built with Node.js, Express, Firebase Realtime Database, and Firebase Authentication.

## Features

- Express web server
- CORS enabled
- Environment variables with dotenv
- HTTP request logging with Morgan
- Firebase Realtime Database integration
- Firebase Authentication
- User-specific data isolation
- Habits & Tasks API endpoints
- Error handling middleware

## Project Structure

```
.
├── config/             # Configuration files
│   └── firebase.js     # Firebase Admin SDK configuration
├── db/                 # Database related files
│   └── initDb.js       # Database initialization script
├── middleware/         # Express middleware
│   └── auth.js         # Authentication middleware
├── models/             # Database models
│   ├── habitModel.js   # Habit model for database operations
│   └── taskModel.js    # Task model for database operations
├── routes/             # Route files
│   ├── habits.js       # Habits resource routes
│   └── tasks.js        # Tasks resource routes
├── index.js            # Main application file
├── package.json        # Project dependencies and scripts
├── .env                # Environment variables
└── .gitignore          # Git ignore file
```

## Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- A Firebase project with Realtime Database and Authentication enabled

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:

```
PORT=3000
NODE_ENV=development

# Firebase configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n","client_email":"your-client-email","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"your-cert-url"}
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.your-region.firebasedatabase.app
```

## Firebase Setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Realtime Database and set up security rules
3. Enable Authentication and set up the authentication methods you want to use
4. Navigate to Project Settings > Service Accounts
5. Generate a new private key (this will download a JSON file)
6. Copy the contents of the JSON file and set it as the `FIREBASE_SERVICE_ACCOUNT` environment variable in your `.env` file
7. Set the `FIREBASE_DATABASE_URL` environment variable to your Firebase Realtime Database URL (make sure to include the full URL with region information, e.g., `https://your-project-id-default-rtdb.europe-west1.firebasedatabase.app`)

## Database Setup

The application uses Firebase Realtime Database for data storage. The database will be automatically initialized when you start the server.

If you want to manually initialize the database:

```bash
# Initialize the database
npm run init-db
```

## Running the Application

### Development mode

```bash
npm run dev
```

This will start the server with nodemon, which automatically restarts when you make changes.

### Production mode

```bash
npm start
```

## API Endpoints

### Root endpoint

```
GET /
```

Returns a welcome message to confirm the API is running, along with a list of available endpoints.

### Authentication Header

All habits and tasks endpoints require Firebase authentication. You need to include an `Authorization` header with a valid Firebase ID token:

```
Authorization: Bearer <firebase-id-token>
```

In development mode, you can use a test token:

```
Authorization: Bearer development-token
```

### Habits Endpoints

```
GET /habits
```

Returns all habits for the authenticated user.

```
GET /habits/:id
```

Returns a specific habit by ID for the authenticated user.

```
POST /habits
```

Creates a new habit for the authenticated user. Required fields in the request body:
- name

Optional fields:
- description (defaults to empty string)
- frequency (defaults to 'daily')

```
PUT /habits/:id
```

Updates a habit for the authenticated user. All fields are optional:
- name
- description
- frequency

```
DELETE /habits/:id
```

Deletes a habit for the authenticated user.

```
PATCH /habits/:id/toggle
```

Toggles the completion status of a habit for the authenticated user.

### Tasks Endpoints

```
GET /tasks
```

Returns all tasks for the authenticated user, ordered by due date.

```
GET /tasks/:id
```

Returns a specific task by ID for the authenticated user.

```
GET /tasks/category/:category
```

Returns all tasks in a specific category for the authenticated user.

```
GET /tasks/priority/:priority
```

Returns all tasks with a specific priority for the authenticated user.

```
POST /tasks
```

Creates a new task for the authenticated user. Required fields in the request body:
- name

Optional fields:
- category (defaults to empty string)
- dueDate (defaults to null)
- priority (defaults to 'medium')

```
PUT /tasks/:id
```

Updates a task for the authenticated user. All fields are optional:
- name
- category
- dueDate
- priority
- completed

```
DELETE /tasks/:id
```

Deletes a task for the authenticated user.

```
PATCH /tasks/:id/toggle
```

Toggles the completion status of a task for the authenticated user.

## Testing the API

You can use tools like Postman, Insomnia, or curl to test the API endpoints.

Example with curl:

```bash
# Get all habits
curl http://localhost:3000/habits \
  -H "Authorization: Bearer development-token"

# Create a new habit
curl -X POST http://localhost:3000/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer development-token" \
  -d '{"name": "Read Books", "frequency": "daily", "description": "Read for 30 minutes"}'

# Get all tasks
curl http://localhost:3000/tasks \
  -H "Authorization: Bearer development-token"

# Get tasks by category
curl http://localhost:3000/tasks/category/Work \
  -H "Authorization: Bearer development-token"

# Create a new task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer development-token" \
  -d '{"name": "Finish project", "category": "Work", "dueDate": "2023-12-31", "priority": "high"}'

# Toggle task completion
curl -X PATCH http://localhost:3000/tasks/1/toggle \
  -H "Authorization: Bearer development-token"
```

## Authentication Flow

1. Client authenticates with Firebase Authentication (frontend)
2. Client receives an ID token from Firebase
3. Client includes the ID token in the Authorization header for API requests
4. Server verifies the token with Firebase Admin SDK
5. If valid, the request proceeds and data is filtered by the user's ID
6. If invalid, the server returns a 401 or 403 error

## Firebase Realtime Database Structure

The application uses the following database structure:

```
{
  "habits": {
    "habit1": {
      "name": "Morning Meditation",
      "description": "10 minutes of mindfulness",
      "frequency": "daily",
      "completed": false,
      "user_id": "user123",
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-01T12:00:00Z"
    },
    "habit2": { ... }
  },
  "tasks": {
    "task1": {
      "name": "Complete project proposal",
      "category": "Work",
      "due_date": "2023-12-31T00:00:00Z",
      "priority": "high",
      "completed": false,
      "user_id": "user123",
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-01T12:00:00Z"
    },
    "task2": { ... }
  }
}
```

Each user can only access their own data, enforced through user_id filtering in the API layer.

## Troubleshooting

### Authentication Issues

If you encounter issues with authentication:

1. Make sure your Firebase service account configuration is correct
2. Verify that the token you're using is valid and not expired
3. Check that you're including the Authorization header correctly
4. In development mode, you can use `development-token` for testing

### Database Issues

If you encounter issues with the Firebase Realtime Database:

1. Make sure your Firebase database URL is correct (be sure to include the full URL with region, like `https://your-project-id-default-rtdb.europe-west1.firebasedatabase.app`)
2. Check that you have the proper permissions set in your Firebase database rules
3. Verify that your service account has access to the database
4. Look for any errors in the server logs

### Private Key Issues

If you encounter "Invalid PEM formatted message" errors:

1. Make sure your private key has proper newlines encoded as `\\n` in the .env file
2. The Firebase service account object should be valid JSON
3. The private key should begin with `-----BEGIN PRIVATE KEY-----\\n` and end with `\\n-----END PRIVATE KEY-----\\n`

## CORS Configuration

This API has CORS enabled for all routes with default settings. If you need to customize the CORS configuration, you can modify the options in `index.js`. 