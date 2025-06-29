# MongoDB Clone Manager

A modern, full-stack Next.js application for managing MongoDB clone jobs, job history, and notifications. Designed for database administrators and developers to easily clone, monitor, and manage MongoDB databases with a beautiful UI and robust notification system.

---

## Features

- **Clone MongoDB Databases**: Easily create and manage clone jobs between MongoDB instances.
- **Job History**: Track all clone operations, view logs, and job details.
- **Email Notifications**: Get notified on job success, failure, and system errors (Gmail OAuth2 integration).
- **Secure Connection Strings**: AES-256 encryption for sensitive data.
- **Modern UI/UX**: Built with React, Next.js, TailwindCSS, and Radix UI.
- **Performance & Health APIs**: Monitor system health and performance.

---

## Tech Stack

- **Frontend**: React, Next.js (App Router), TailwindCSS, Radix UI
- **Backend**: Node.js, Next.js API routes
- **Database**: MongoDB (Mongoose ODM)
- **Email**: Nodemailer, Google OAuth2
- **Other**: Zod, React Hook Form, Recharts, clsx, date-fns

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)
- MongoDB Atlas or local MongoDB instance
- Google Cloud project with OAuth2 credentials (for email notifications)

### Installation
```bash
git clone https://github.com/your-username/mongodb-clone.git
cd mongodb-clone
npm install
```

---

## Environment Variables

Create a `.env.local` file in the root directory. The following variables are required:

| Variable              | Description                                                      |
|---------------------- |------------------------------------------------------------------|
| `MONGODB_URI`         | MongoDB connection string (Atlas or local)                        |
| `ENCRYPTION_KEY`      | 32-character secret key for AES-256 encryption                    |
| `GOOGLE_CLIENT_ID`    | Google OAuth2 Client ID (for Gmail SMTP)                          |
| `GOOGLE_CLIENT_SECRET`| Google OAuth2 Client Secret                                       |
| `GOOGLE_REFRESH_TOKEN`| Google OAuth2 Refresh Token (from OAuth Playground)               |
| `GOOGLE_USER_EMAIL`   | Gmail address to send notifications from (must match credentials) |

### Sample `.env.example`
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Encryption (must be 32 characters)
ENCRYPTION_KEY=your-32-character-secret-key-here!

# Google OAuth2 for Gmail SMTP
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REFRESH_TOKEN=your-google-refresh-token
GOOGLE_USER_EMAIL=your-email@gmail.com
```

---

## Running the App

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

---

## Data Creation & Seeding
- The app will auto-create collections as needed on first use.
- To manually seed data, connect to your MongoDB instance and insert documents into the `CloneJob` and `CloneHistory` collections as needed.
- All sensitive connection strings are encrypted using your `ENCRYPTION_KEY`.

---

## NPM Scripts
| Script      | Description                |
|-------------|----------------------------|
| dev         | Start development server   |
| build       | Build for production       |
| start       | Start production server    |
| lint        | Run ESLint                 |

---

## Folder Structure

```
app/           # Next.js app directory (routing, API, actions, styles)
components/    # UI and logic components
components/ui/ # Atomic UI components (Radix, custom)
hooks/         # Custom React hooks
lib/           # Utilities (email, logger, encryption, MongoDB, etc.)
models/        # Mongoose models
public/        # Static assets
```

---

## Google OAuth2 Setup for Email
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and create OAuth 2.0 credentials.
2. Use [Google OAuth Playground](https://developers.google.com/oauthplayground/) to obtain a refresh token for Gmail SMTP.
3. Set the credentials in your `.env.local` file.
4. Restart the app after updating environment variables.

---

## License
MIT

---

## Contact
For questions or support, open an issue or contact the maintainer.
