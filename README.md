# Pocket Kade

Welcome to **Pocket Kade**, a comprehensive solution for creating and managing invoices, tracking inventory, and handling returns. This application is built with Next.js and Firebase, utilizing ShadCN UI components for a clean and modern user interface.

## Key Features

- **Invoice Management**: Create, view, edit, and cancel invoices with ease.
- **Inventory Tracking**: Manage your product stock, prices, and get alerts for low-stock items.
- **Returns Handling**: Log and manage customer and supplier returns through a streamlined process.
- **User Roles**: Differentiates between 'Admin' and 'Staff' roles with specific permissions.
- **AI-Powered Suggestions**: Get smart suggestions for line item descriptions to speed up invoice creation.
- **Reporting & Analytics**: Admins can view an analytics dashboard to track inventory value and aging.

## Tech Stack

- **Framework**: Next.js (with App Router)
- **Database & Auth**: Firebase (Firestore, Authentication)
- **UI**: ShadCN UI, Tailwind CSS
- **AI**: Google Gemini via Genkit
- **State Management**: React Hooks & Context API

## Getting Started Locally

GitHub is a code repository for storing the project's source code. To run the application on your own computer, you need to follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [Git](https://git-scm.com/)

### Setup Instructions

1.  **Clone the repository from GitHub:**
    ```bash
    git clone <your-github-repository-url>
    cd PocketKade
    ```

2.  **Install dependencies:**
    This command reads the `package.json` file and installs all the necessary libraries for the project.
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    You will need to fill this file with your own Firebase project credentials and your application's public URL.

    *   **Firebase Credentials:** You can find these in your Firebase project settings under "General" -> "Your apps" -> "SDK setup and configuration".
    *   **Application URL (`NEXT_PUBLIC_APP_URL`):** This is crucial for generating correct invitation links. When running locally, the app defaults to `http://localhost:9002`. For a deployed version, you must set this to your public URL (e.g., `https://your-app.web.app`).
    *   **Authorize Your Domain in Firebase:** For features like Google Sign-In to work correctly, you MUST add your application's domain to the list of authorized domains in your Firebase project. Go to **Firebase Console -> Authentication -> Settings -> Authorized domains** and add the domain from your `NEXT_PUBLIC_APP_URL` (e.g., `your-app.web.app`). If running in a development environment like Firebase Studio, you must add its unique domain, which often ends in `.dev` (e.g., `project-name-12345.firebaseapp.com` or `project-name-12345.web.app`), and NOT `localhost`.


4.  **Run the development server:**
    This command starts the application.
    ```bash
    npm run dev
    ```

The application will then be available at `http://localhost:9002` in your web browser.
