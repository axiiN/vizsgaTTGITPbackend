# Life Tracker API

A RESTful API for tracking habits, tasks, and notes, built with Node.js, Express, Firebase Realtime Database, and Firebase Authentication.

## Features

- Express web server
- CORS enabled
- Environment variables with dotenv
- HTTP request logging with Morgan
- Firebase Realtime Database integration
- Firebase Authentication
- User-specific data isolation
- Habits, Tasks & Notes API endpoints
- Email notifications
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
│   ├── taskModel.js    # Task model for database operations
│   └── noteModel.js    # Note model for database operations
├── routes/             # Route files
│   ├── habits.js       # Habits resource routes
│   ├── tasks.js        # Tasks resource routes
│   ├── notes.js        # Notes resource routes
│   └── users.js        # User management routes
├── utils/              # Utility functions
│   └── emailService.js # Email service utilities
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

All endpoints require Firebase authentication. You need to include an `Authorization` header with a valid Firebase ID token:

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

### Notes Endpoints

```
GET /notes
```

Returns all notes for the authenticated user.

```
GET /notes/favorites
```

Returns all favorite notes for the authenticated user.

```
GET /notes/:id
```

Returns a specific note by ID for the authenticated user.

```
POST /notes
```

Creates a new note for the authenticated user. Required fields in the request body:
- title

Optional fields:
- content (defaults to empty string)
- isFavorite (defaults to false)

```
PUT /notes/:id
```

Updates a note for the authenticated user. All fields are optional:
- title
- content
- isFavorite

```
DELETE /notes/:id
```

Deletes a note for the authenticated user.

```
PATCH /notes/:id/toggle-favorite
```

Toggles the favorite status of a note for the authenticated user.

### User Endpoints

```
GET /users/me
```

Returns information about the currently authenticated user.

```
POST /users/welcome-email
```

Sends a welcome email to a newly registered user. Required fields in the request body:
- email

Optional fields:
- name (defaults to the email address if not provided)

Example request body:
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

Example response:
```json
{
  "message": "Welcome email sent successfully",
  "success": true,
  "messageId": "message-id-here"
}
```

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

# Get all notes
curl http://localhost:3000/notes \
  -H "Authorization: Bearer development-token"

# Get favorite notes
curl http://localhost:3000/notes/favorites \
  -H "Authorization: Bearer development-token"

# Create a new note
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer development-token" \
  -d '{"title": "Important Note", "content": "This is the content of my note", "isFavorite": true}'

# Toggle note favorite status
curl -X PATCH http://localhost:3000/notes/note1/toggle-favorite \
  -H "Authorization: Bearer development-token"

# Send a welcome email
curl -X POST http://localhost:3000/users/welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe"}'
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
      "userId": "user123",
      "createdAt": "2023-01-01T12:00:00Z",
      "updatedAt": "2023-01-01T12:00:00Z"
    },
    "habit2": { ... }
  },
  "tasks": {
    "task1": {
      "name": "Complete project proposal",
      "category": "Work",
      "dueDate": "2023-12-31T00:00:00Z",
      "priority": "high",
      "completed": false,
      "userId": "user123",
      "createdAt": "2023-01-01T12:00:00Z",
      "updatedAt": "2023-01-01T12:00:00Z"
    },
    "task2": { ... }
  },
  "notes": {
    "note1": {
      "title": "Project Ideas",
      "content": "List of ideas for the next quarter",
      "isFavorite": true,
      "userId": "user123",
      "createdAt": "2023-01-01T12:00:00Z",
      "updatedAt": "2023-01-01T12:00:00Z"
    },
    "note2": { ... }
  }
}
```

Each user can only access their own data, enforced through userId filtering in the API layer.

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

## Email Configuration

The application uses Nodemailer for sending emails. You'll need to set up the following environment variables in your `.env` file:

```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=user@example.com
EMAIL_PASSWORD=password123
EMAIL_FROM=Life Tracker <no-reply@lifetracker.example.com>
```

Unlike previous versions that only logged emails in development mode, the application now sends actual emails in all environments. For Gmail users, make sure to:

1. Enable "Less secure app access" or
2. Use an App Password if you have 2-Factor Authentication enabled (recommended)

> Note: For Gmail, use the following settings:
> - EMAIL_HOST=smtp.gmail.com
> - EMAIL_PORT=587
> - EMAIL_SECURE=false

### Setting Up Gmail for Email Sending

To use Gmail as your email provider, follow these steps:

1. **Create or use an existing Gmail account**:
   - It's recommended to create a dedicated Gmail account for your application rather than using your personal email

2. **Set up an App Password (if you have 2FA enabled - recommended)**:
   - Go to your [Google Account settings](https://myaccount.google.com/)
   - Navigate to Security > 2-Step Verification
   - Scroll down and click on "App passwords"
   - Select "Mail" as the app and "Other" as the device (give it a name like "Life Tracker API")
   - Click "Generate" 
   - Copy the 16-character password that appears
   - Use this password in your .env file as EMAIL_PASSWORD (not your regular Gmail password)

3. **If you don't use 2FA, enable Less Secure App Access**:
   - Go to your [Google Account settings](https://myaccount.google.com/)
   - Navigate to Security
   - Scroll down to "Less secure app access" and turn it on
   - Note: Google may disable this option in the future as it's less secure

4. **Update your .env file with Gmail settings**:
   ```
   # Email configuration for Gmail
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password-or-gmail-password
   EMAIL_FROM=Life Tracker <your-email@gmail.com>
   ```

5. **Test your email configuration**:
   - Start your server: `npm run dev`
   - Send a test email using the API endpoint:
   ```bash
   curl -X GET "http://localhost:3000/users/test-email?email=recipient@example.com"
   ```
   - Or test through the welcome email endpoint:
   ```bash
   curl -X POST http://localhost:3000/users/welcome-email \
     -H "Content-Type: application/json" \
     -d '{"email": "recipient@example.com", "name": "Test User"}'
   ```

6. **Troubleshooting Gmail Connection Issues**:
   - Make sure you're using the correct port (587) and secure setting (false)
   - Check that your app password is entered correctly (no spaces)
   - Verify that "Less secure app access" is enabled if you're not using an app password
   - Check the server logs for detailed error messages
   - Ensure your Gmail account doesn't have any security blocks or captchas pending

### Email Debugging

In development mode, email details are logged to the console for debugging purposes in addition to sending the actual email. This helps with troubleshooting while still testing the full email sending functionality.

The application includes a dedicated test endpoint for verifying email configuration:

```
GET /users/test-email
```

This endpoint is only available in development mode and will send a test email to:
- The email address specified in the query parameter: `?email=test@example.com` 
- The EMAIL_USER address from your .env file if no query parameter is provided 