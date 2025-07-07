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
git clone https://github.com/DinukaSandeepa/mongodb-clone.git
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

To enable email notifications, you need to set up Google OAuth2 credentials and obtain a refresh token. This process allows your application to send emails on your behalf without storing your Gmail password.

### Step 1: Create OAuth 2.0 Credentials in Google Cloud Console

1.  **Go to Google Cloud Console**: Open your web browser and navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2.  **Select or Create a Project**:
    *   If you have an existing project, select it from the top-left dropdown.
    *   If not, create a new project by clicking "Select a project" -> "New Project" and follow the prompts.
3.  **Enable Gmail API**:
    *   In the Google Cloud Console, navigate to "APIs & Services" > "Enabled APIs & services".
    *   Click "+ Enable APIs and Services".
    *   Search for "Gmail API" and enable it.
4.  **Create Credentials**:
    *   Navigate to "APIs & Services" > "Credentials".
    *   Click "+ Create Credentials" and select "OAuth client ID".
    *   For "Application type", choose "Web application".
    *   Give your OAuth client a descriptive name (e.g., `MongoDB Clone Emailer`).
    *   **Authorized JavaScript origins**:
        *   For local development, add `http://localhost:3000` (or whatever port your Next.js app runs on).
        *   For production, add your deployed application's URL (e.g., `https://your-app-domain.com`).
    *   **Authorized redirect URIs**:
        *   Add `https://developers.google.com/oauthplayground` (this is crucial for obtaining the refresh token in the next step).
    *   Click "Create".
5.  **Download Credentials**: A pop-up will show your Client ID and Client Secret. Copy these values. You can also download the `client_secret.json` file, but for `.env` setup, copying the values directly is often easier.
    *   **`GOOGLE_CLIENT_ID`**: Your OAuth2 Client ID.
    *   **`GOOGLE_CLIENT_SECRET`**: Your OAuth2 Client Secret.

### Step 2: Obtain the Refresh Token using Google OAuth Playground

A refresh token is a long-lived credential that allows your application to obtain new access tokens without re-prompting the user for authorization.

1.  **Go to Google OAuth Playground**: Open a new tab and navigate to the [Google OAuth Playground](https://developers.google.com/oauthplayground/).
2.  **Configure OAuth 2.0**:
    *   In the top-right corner, click the gear icon (⚙️) for "OAuth 2.0 configuration".
    *   Check "Use your own OAuth credentials".
    *   Enter your `GOOGLE_CLIENT_ID` into the "OAuth Client ID" field.
    *   Enter your `GOOGLE_CLIENT_SECRET` into the "OAuth Client secret" field.
    *   Close the configuration box.
3.  **Select Gmail API Scope**:
    *   On the left sidebar, under "Step 1: Select & authorize APIs", search for and expand "Gmail API v1".
    *   Select the scope `https://mail.google.com/` (Send, delete, and read your email). This is the most permissive scope required for sending emails.
    *   Click "Authorize APIs".
4.  **Grant Permissions**:
    *   You will be redirected to a Google sign-in page. Sign in with the Gmail account you want to use for sending notifications.
    *   Grant the requested permissions.
5.  **Exchange Authorization Code for Tokens**:
    *   After granting permissions, you will be redirected back to the OAuth Playground.
    *   Under "Step 2: Exchange authorization code for tokens", click "Exchange authorization code for tokens".
    *   The "Refresh token" will appear. **Copy this value carefully**. This is your `GOOGLE_REFRESH_TOKEN`.

### Step 3: Update Your Environment Variables

Now that you have all the necessary credentials, update your `.env.local` file (or your deployment's environment variables) with the following:

```env
# Google OAuth2 for Gmail SMTP
GOOGLE_CLIENT_ID=your-google-client-id-from-step-1
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-step-1
GOOGLE_REFRESH_TOKEN=your-google-refresh-token-from-step-2
GOOGLE_USER_EMAIL=the-gmail-account-you-authorized@gmail.com
```

**Important**: The `GOOGLE_USER_EMAIL` must be the exact Gmail address of the account you used to generate the OAuth2 credentials and refresh token.

### Step 4: Restart the Application

After updating your environment variables, restart your Next.js application to ensure the new variables are loaded.

```bash
npm run dev # for development
# or
npm start # for production
```

Your MongoDB Clone Manager should now be able to send email notifications. You can test the configuration from the application's settings page.

---

## License
MIT

---

## Contact
For questions or support, open an issue or contact the maintainer.
