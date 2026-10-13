# LectureIQ

LectureIQ is a MERN-based learning platform for browsing and managing courses, delivering recorded lectures, and hosting live sessions. It combines role-based student, teacher, and administrator workflows with course payments and real-time communication.

LectureIQ includes AI-generated study summaries of the lecture description text. It does not transcribe or summarize lecture audio/video.

## Key Features

- Public course catalogue and course details.
- Student registration, email verification, login, password recovery, and Google sign-in.
- Role-specific student, teacher, and admin views and protected routes.
- Teacher course and lecture creation, course submission for review, and admin approval/rejection.
- Student enrollment, course access, and lecture progress tracking.
- Recorded lecture uploads and scheduled live lectures.
- On-demand AI study summaries generated from lecture descriptions.
- Live-session UI with Socket.IO room events, chat, and WebRTC signaling/media support.
- Razorpay course payments, payment verification, and a webhook endpoint.
- Teacher and admin dashboards for courses, students, enrollments, payments, and revenue.
- Cloudinary-backed media upload configuration.

## Tech Stack

| Frontend | Backend |
| --- | --- |
| React 19, Vite | Node.js, Express 5 |
| React Router | MongoDB, Mongoose |
| Redux Toolkit, Redux Persist | Redis |
| Axios | Socket.IO |
| Tailwind CSS, DaisyUI | JWT, bcrypt |
| Socket.IO Client, WebRTC browser APIs | Google OAuth verification, OpenAI text generation, Nodemailer |
| React Player | Cloudinary, Multer, Razorpay |

## Architecture and Request Flow

1. The React application in `Frontend/` sends HTTP requests through Axios to the Express server in `Backend/`.
2. Axios includes cookies. Express parses JSON and cookies, applies its CORS policy, and dispatches requests to the mounted route groups.
3. Authentication and role middleware validate the JWT cookie, check the Redis token blocklist, and load the account from MongoDB.
4. Controllers read or update MongoDB records and use configured integrations for email, media uploads, and payments.
5. The same HTTP server hosts Socket.IO for live-session room events and WebRTC signaling.

## Project Structure

```text
LectureIQ/
├── Backend/
│   ├── package.json
│   └── src/
│       ├── config/       # MongoDB, Redis, and Cloudinary setup
│       ├── controllers/  # Authentication, courses, lectures, payments, dashboards
│       ├── middleware/   # Authentication, role checks, and uploads
│       ├── models/       # Mongoose models
│       ├── routes/       # Express route groups
│       ├── utils/        # Email and validation helpers
│       ├── index.js      # Express and Socket.IO server entry point
│       └── socket.js     # Socket.IO room, chat, and signaling events
├── Frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── api/          # Axios API clients
│       ├── components/
│       ├── contexts/
│       ├── pages/        # Public, auth, student, teacher, admin, and live pages
│       ├── routes/
│       ├── store/
│       └── utils/
├── src/                  # Separate top-level backend source tree; not used by Backend scripts
├── ngrok/                # Bundled ngrok executable
└── package.json          # Root manifest; frontend commands are in Frontend/package.json
```

`Frontend/` and `Backend/` are ordinary repository directories, not Git submodules.

## Prerequisites

- Node.js and npm. The frontend uses Vite 7, which requires Node.js `20.19+` or `22.12+`.
- A MongoDB instance and a connection string.
- Access to the Redis endpoint configured in `Backend/src/config/redis.js`. The current code uses a fixed Redis host and reads its password from the environment.
- Credentials for the integrations you intend to use: Cloudinary for uploads, SMTP for email, Google OAuth for Google sign-in, and Razorpay for payments.

## Installation and Local Setup

The app reads separate environment files from its backend and frontend working directories. No `.env.example` file is currently present in the repository; the templates below contain placeholders only. Create `Backend/.env` and `Frontend/.env` locally from these examples. Do not commit real credentials.

### Backend

From a terminal at the repository root:

```powershell
cd Backend
npm install
```

Create `Backend/.env` using the backend template below, then start the server as described in [Run Locally](#run-locally).

### Frontend

In a separate terminal at the repository root:

```powershell
cd Frontend
npm install
```

Create `Frontend/.env` using the frontend template below.

## Environment Variables

### Backend — `Backend/.env`

```dotenv
PORT=3000
NODE_ENV=development
DB_CONNECTION_STRING=mongodb://127.0.0.1:27017/lectureiq
JWT_KEY=replace_with_a_long_random_secret
REDIS_PASS=your_redis_password

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_oauth_client_id

EMAIL_USER=your_smtp_email
EMAIL_PASS=your_smtp_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

OPENAI_API_KEY=your_openai_api_key
```

`DB_CONNECTION_STRING`, `JWT_KEY`, `PORT`, and `REDIS_PASS` are required for the backend's normal startup and authentication flow. `OPENAI_API_KEY` is required to use lecture summarization. The current Redis host is hard-coded in the source; `REDIS_PASS` does not configure the host. Set the other third-party credentials for the features you use.

### Frontend — `Frontend/.env`

```dotenv
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

The frontend defaults the HTTP API and its SocketService connection to `http://localhost:3000`. Only expose public client configuration through `VITE_` variables; never put server secrets in the frontend environment.

## Run Locally

Start the backend in its own terminal:

```powershell
cd Backend
npx nodemon src/index.js
```

The backend package defines `npm run dev` (`nodemon index.js`) and `npm start` (`node index.js`), but there is no `Backend/index.js`; the server entry point is `Backend/src/index.js`. Those package scripts therefore do not currently target the server file. The command above runs the existing source with the installed nodemon dependency. To run it without nodemon, use `node src/index.js` from `Backend/`. The server listens on the configured `PORT` (use `3000` for the frontend defaults).

Start the frontend in a second terminal:

```powershell
cd Frontend
npm run dev
```

Vite serves the app at `http://localhost:5173`. The Express CORS configuration allows this local origin. MongoDB and the configured Redis service must be reachable for the backend to finish starting.

Other frontend scripts, defined in `Frontend/package.json`, are `npm run build`, `npm run lint`, and `npm run preview`.

## API Endpoints

The backend base URL is `http://localhost:3000`. These paths are relative to that base URL. Protected routes require the authentication cookie unless otherwise noted.

| Method | Endpoint | Access / purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Public student registration |
| `POST` | `/auth/login` | Public login |
| `POST` | `/auth/logout` | Authenticated logout |
| `GET` | `/auth/verify-email` | Verify an email token |
| `POST` | `/auth/resend-verification` | Resend verification email |
| `POST` | `/auth/forgot-password` | Start password recovery |
| `POST` | `/auth/reset-password` | Reset password |
| `POST` | `/auth/change-password` | Authenticated password change |
| `POST` | `/auth/google-auth` | Google sign-in |
| `POST` | `/auth/admin/register` | Admin-only account creation |
| `POST` | `/auth/teacher/register` | Admin-only teacher creation |
| `PATCH` | `/auth/admin/teacher/verify/:teacherId` | Admin verifies a teacher |
| `GET` | `/user/courses` | List published courses |
| `GET` | `/user/course/:courseId` | Course details; optional authentication |
| `GET` | `/user/course/:courseId/lectures` | Course lectures; optional authentication |
| `POST` | `/course/create` | Teacher creates a course |
| `PATCH` | `/course/edit/:courseId` | Teacher edits a course |
| `PATCH` | `/course/submit/:courseId` | Teacher submits a course for review |
| `PATCH` | `/course/admin/approve/:courseId` | Admin approves a course |
| `PATCH` | `/course/course/reject/:courseId` | Admin rejects a course |
| `POST` | `/lecture/create` | Teacher creates a recorded lecture |
| `POST` | `/lecture/create-live` | Teacher schedules a live lecture |
| `PATCH` | `/lecture/lecture/:lectureId/start` | Teacher starts a live lecture |
| `PATCH` | `/lecture/lecture/:lectureId/end` | Teacher ends a live lecture |
| `GET` | `/lecture/upcoming/:courseId` | Authenticated upcoming lectures |
| `GET` | `/lecture/:lectureId/join` | Authenticated live-session details |
| `POST` | `/lecture/:lectureId/summary` | Authenticated teacher (owner), eligible student, or active admin summarizes lecture description text |
| `GET` | `/student/my-courses` | Student course dashboard |
| `GET` | `/student/enrollments` | Student enrollments |
| `POST` | `/student/lecture/:lectureId/progress` | Update lecture progress |
| `GET` | `/teacher/my-courses` | Teacher courses |
| `GET` | `/teacher/course/:courseId/students` | Teacher's course students |
| `GET` | `/teacher/course/:courseId/lectures` | Teacher's course lectures |
| `GET` | `/teacher/dashboard-stats` | Teacher dashboard statistics |
| `GET` | `/admin/teachers` | Admin teacher list |
| `GET` | `/admin/courses` | Admin course list |
| `GET` | `/admin/students` | Admin student list |
| `GET` | `/admin/payments` | Admin payment list |
| `GET` | `/admin/course/:courseId/enrollments` | Admin course enrollments |
| `GET` | `/admin/course/:courseId/payments` | Admin course payments |
| `GET` | `/admin/revenue` | Admin revenue statistics |
| `GET` | `/profile/me` | Authenticated user's profile |
| `PUT` | `/profile/me` | Update authenticated user's profile |
| `POST` | `/payment/courses/:courseId/order` | Student creates a Razorpay order |
| `POST` | `/payment/verify/razorpay` | Student verifies a payment |
| `POST` | `/payment/webhooks/razorpay` | Razorpay webhook; no user-cookie auth |

The Socket.IO server is attached to the backend HTTP server; it is not an Express REST endpoint. The listed methods and access controls reflect the backend route registrations.

## Authentication and Authorization

- Passwords are hashed with bcrypt. Registration sends an email verification link; login checks that the account is verified.
- Login issues a JWT in an `httpOnly`, `SameSite=Strict` cookie. The cookie's `secure` flag is enabled when `NODE_ENV=production`.
- Authentication middleware verifies the token and checks Redis for invalidated tokens. Teacher and admin routes also enforce the relevant role; student routes require an authenticated account.
- Logout adds the token to the Redis blocklist and clears the cookie. Google sign-in is implemented through Google credential verification.

## AI Summarization and Real-Time Features

`POST /lecture/:lectureId/summary` sends the stored lecture title and description to OpenAI's text-generation API and returns:

```json
{
  "lectureId": "lecture_object_id",
  "source": "description",
  "summary": "Generated study summary..."
}
```

The request has no body. A verified, active teacher can summarize their own course's lectures; a verified, active admin can summarize any existing lecture; a verified, active student can summarize a lecture in a published free course, an eligible preview lecture, or a paid course for which they have an active enrollment. The endpoint refuses missing descriptions and descriptions over 20,000 characters. Provider requests have a 30-second timeout and a 600-token output limit. Configure `OPENAI_API_KEY` in `Backend/.env`; it is never sent to the browser. Video and audio are not included because the application has no transcription pipeline.

The backend implements authenticated Socket.IO events for joining/leaving lecture rooms, participant presence, chat broadcasts, and WebRTC offer/answer/ICE-candidate relay. The live-session page uses the shared socket connection from its context. Live room membership is checked against the lecture, course ownership, and active student enrollment; the chat payload contains only a lecture ID and text, while sender identity and timestamp are set by the server. The live-session page includes teacher media capture and student playback via browser WebRTC APIs.

Chat event contract:

- Client emits `lecture:join` with `{ "lectureId": "..." }`; the acknowledgement is `{ "ok": true, "lectureId": "..." }` or `{ "ok": false, "error": "..." }`.
- Client emits `lecture:sendMessage` with `{ "lectureId": "...", "text": "..." }`.
- Server broadcasts `lecture:receiveMessage` with `{ "lectureId": "...", "message": { "id": "...", "text": "...", "sender": { "id": "...", "firstName": "...", "lastName": "..." }, "createdAt": "..." } }`.
- Client emits `lecture:leave` with `{ "lectureId": "..." }`.

## Database and Supporting Services

- **MongoDB:** Mongoose connects using `DB_CONNECTION_STRING`. Models cover students, courses, lectures, enrollments, lecture progress, and payments.
- **Redis:** The server connects on startup and uses Redis for token invalidation. Its host and port are currently hard-coded in `Backend/src/config/redis.js`; supply the expected password via `REDIS_PASS`.
- **Cloudinary:** Configured for uploaded media using the three `CLOUDINARY_*` variables.
- **Email:** Nodemailer is configured for Gmail SMTP using `EMAIL_USER` and `EMAIL_PASS`.
- **Payments:** Razorpay keys support order creation and signature/webhook verification.

## Screenshots and Demo

Replace these placeholders with project screenshots or a deployed demo when available:

- Course catalogue: `![Course catalogue](docs/screenshots/course-catalogue.png)`
- Live classroom: `![Live classroom](docs/screenshots/live-classroom.png)`
- Demo: _Add a deployed demo URL here._

## Security Considerations

- Keep `.env` files and credentials out of version control. Use a strong, private `JWT_KEY`, and never expose server credentials through frontend `VITE_` variables.
- The Express CORS allowlist currently targets local development origins. Configure and review it before deployment.
- The source currently logs an email verification token during registration. Remove that log before production use.
- Protect production cookie and webhook configuration, rotate exposed credentials, and use HTTPS for deployed environments.

## Troubleshooting

| Symptom | Checks |
| --- | --- |
| Backend script reports a missing `index.js` | The package scripts point to `Backend/index.js`, while the actual entry point is `Backend/src/index.js`. From `Backend/`, run `npx nodemon src/index.js` or `node src/index.js`. |
| Backend exits during startup | Confirm MongoDB is reachable and `DB_CONNECTION_STRING` is valid; Redis must also be reachable with the configured password. |
| Browser reports CORS or API errors | Confirm the backend is running on the URL in `VITE_API_URL` and the frontend is on an allowed local origin (`http://localhost:5173` or `http://127.0.0.1:5173`). |
| Socket.IO cannot connect | Confirm the backend is running and `VITE_SOCKET_URL` points to it; by default the shared socket context connects to `http://localhost:3000`. Check the browser's live-chat status for authentication or connection errors. |
| Google sign-in does not complete | Set matching Google client IDs in `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`, and configure the local frontend origin in the Google OAuth client. |
| Lecture progress update fails | The backend route is `POST /student/lecture/:lectureId/progress`; the current frontend API helper sends `PUT`. |
| Email, uploads, or payments fail | Check the corresponding SMTP, Cloudinary, or Razorpay credentials and provider-side configuration. |
| Lecture summary fails | Set `OPENAI_API_KEY` in `Backend/.env`; confirm the server can reach the OpenAI API and the lecture has a description within the documented length limit. |

## Planned / Potential Improvements

No formal roadmap was found in the repository. These are potential follow-ups, not claims about completed or committed work:

- Add transcript ingestion and a verified transcription workflow before offering audio/video summaries.
- Align the live-chat and lecture-progress request payloads/methods.
- Make Redis host and port configurable and add a local development option.
- Add automated backend and end-to-end tests.
- Externalize production CORS and live-session configuration.

## License

`Backend/package.json` declares the ISC license, but there is no repository-level `LICENSE` file. Confirm whether ISC is intended to apply to the full repository before redistributing it.
