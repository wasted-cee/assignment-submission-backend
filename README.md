# Assignment Submission System - Backend

Backend API for the school assignment submission system built with Node.js, Express, and PostgreSQL.

## Features

- User authentication with JWT (students and teachers)
- Assignment management (create, read, update, delete)
- File submission handling
- Grading system with feedback
- Role-based access control

## Setup

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example` and configure:
   ```bash
   cp .env.example .env
   ```

4. Initialize the database:
   ```bash
   psql -U postgres -d assignment_db -f src/database/init.sql
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Assignments
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments` - Create assignment (teachers only)
- `PUT /api/assignments/:id` - Update assignment (teachers only)
- `DELETE /api/assignments/:id` - Delete assignment (teachers only)

### Submissions
- `POST /api/submissions/:assignmentId/submit` - Submit assignment (students only)
- `GET /api/submissions/assignment/:assignmentId` - Get submissions for assignment
- `GET /api/submissions/user/:userId` - Get user submissions
- `PUT /api/submissions/:submissionId/grade` - Grade submission (teachers only)

## License

MIT
