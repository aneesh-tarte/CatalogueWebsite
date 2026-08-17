# Catalogue Dashboard - Project Overview

This document provides a comprehensive overview of the **Catalogue Dashboard** project. It is intended to serve as a complete reference guide for developers and collaborators to understand the system's architecture, technologies, database schema, and core functionalities.

> Note: This document deliberately excludes sensitive information such as database credentials, JWT secrets, and API keys.

---

## 1. Project Description

The Catalogue Dashboard is a web application designed to let users search, discover, and track various types of media (Games, Anime, and Manga). Users can create a personal library, organize items by their tracking status (e.g., "In Progress", "Completed"), and stay up-to-date with the latest industry news through an integrated news stream.

---

## 2. System Architecture

The project follows a standard decoupled Client-Server architecture:
- **Frontend**: A lightweight, Vanilla JavaScript, HTML, and CSS client.
- **Backend**: A Node.js REST API built with Express.js.
- **Database**: A PostgreSQL relational database managed via Prisma ORM.

---

## 3. Technology Stack

### Frontend
- **Structure**: Semantic HTML5 (`index.html`).
- **Styling**: Vanilla CSS3 (`styles.css`) utilizing modern layout techniques (Flexbox/Grid), custom variables for theming, and the Google "Inter" font.
- **Logic**: Vanilla JavaScript (`app.js`) handling DOM manipulation, event listeners, API communication (via `fetch`), and modal state management. No heavy frontend frameworks (like React or Vue) are used.

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma (`@prisma/client`)
- **Authentication**: JWT (`jsonwebtoken`) for secure session management and `bcryptjs` for password hashing.
- **External Requests**: `axios` for fetching external data.
- **XML Parsing**: `fast-xml-parser` (likely used within the News Sync Job to parse RSS feeds).
- **Task Scheduling**: `node-cron` for running background jobs (like syncing the latest news).
- **Security & Utilities**: `cors` for Cross-Origin Resource Sharing and `express-rate-limit` to prevent API abuse.

---

## 4. Database Schema (PostgreSQL)

The database schema is defined using Prisma. Here are the core models and their relationships:

### Core Models

- **User**
  - Handles authentication and profile information.
  - Fields: `id` (UUID), `email` (Unique), `passwordHash`, `username` (Unique), `avatarUrl`, `bio`, `createdAt`.
  - Relations: One-to-Many with `UserLibrary` and `Comment`.

- **MediaItem**
  - Represents a catalog item.
  - Fields: `id` (UUID), `externalId`, `type` (Enum: `GAME`, `ANIME`, `MANGA`), `title`, `genres` (String Array), `coverImageUrl`, `releaseDate`.
  - Relations: One-to-Many with `UserLibrary` and `Comment`.

- **UserLibrary** (Join Table)
  - Links a `User` to a `MediaItem` to track their progress.
  - Fields: `id`, `userId`, `mediaItemId`, `status` (Enum: `PLAN_TO_TRACK`, `IN_PROGRESS`, `COMPLETED`, `DROPPED`), `currentProgress`, `personalScore`, `reviewText`, `updatedAt`.
  - Enforces a unique constraint on `[userId, mediaItemId]` so a user can only have one tracking record per item.

- **NewsArticle**
  - Stores cached industry news to display on the dashboard.
  - Fields: `id`, `headline`, `sourceUrl`, `imageUrl`, `publisher`, `publishedAt`.

- **Comment**
  - Stores user discussions linked to specific media items.
  - Fields: `id`, `content`, `createdAt`, `updatedAt`, `authorId`, `mediaItemId`, `parentId`.
  - Relations: Belongs to `User` (author) and `MediaItem`. Self-referencing relationship via `parentId` to support threaded nested replies.

- **ChatMessage**
  - Stores history for the global live community chat.
  - Fields: `id`, `content`, `username`, `timestamp`.

---

## 5. Backend Structure & APIs

The backend is modularized inside the `src/` directory.

### Directory Structure
- `src/controllers/`: Contains the logic for handling requests and returning responses.
- `src/routes/`: Express router definitions.
- `src/services/`: Business logic and external service integrations (e.g., `NewsSyncJob`).
- `src/middlewares/`: Express middlewares (e.g., Auth verification, error handling).
- `src/utils/`: Helper functions.

### REST API Routes
The API is prefixed with `/api`.
- **Auth Routes (`/api/auth`)**: Handled by `authRoutes.js`. Responsible for user registration, login, and managing user profiles (`/profile`).
- **Catalog Routes (`/api/catalog`)**: Handled by `catalogRoutes.js`. Responsible for searching global media items (`/search`), fetching aggregated public reviews and global ratings (`/:id/reviews`), and managing community comment threads (`/:id/comments`).
- **Library Routes (`/api/library`)**: Handled by `libraryRoutes.js`. Responsible for CRUD operations on a user's personal tracking library (requires JWT auth).
- **News Routes (`/api/news`)**: Handled by `newsRoutes.js`. Fetches the latest synced news articles.
- **Chat Routes (`/api/chat`)**: Handled by `chatRoutes.js`. Responsible for fetching the most recent global chat messages and saving new ones.

### Background Jobs
- **NewsSyncJob**: Instantiated in `server.js` (`NewsSyncJob.start()`). It uses `node-cron` to periodically fetch RSS feeds or external APIs, parses them (using `fast-xml-parser`), and stores the latest `NewsArticle` records in the database.

---

## 6. Frontend Core Features & Components

The frontend (`index.html`) is a Single Page Application (SPA) layout divided into several key sections:

- **App Header & Navigation**: 
  - Contains branding, a global search bar (with real-time autocomplete results), an auth button, and SPA navigation links (`Dashboard` and `Profile`).
- **Dashboard View**:
  - **News Carousel**: A top-level horizontal carousel displaying the latest vibrant industry news cards fetched from the backend.
  - **Live Community Chat**: A real-time chat interface connected directly to Supabase Realtime (Serverless) allowing active users to converse globally.
- **Profile View**:
  - **Profile Header**: Displays the user's avatar, username, and bio, with an "Edit Profile" modal to update details.
  - **Library Section**: Displays the user's tracked items underneath their profile. It includes tabbed navigation (`In Progress`, `Plan to Track`, `Completed`, `Dropped`) to filter the view.
- **Modals**:
  - **Auth Modal**: Provides the UI for Signing In and Registering. Connects to `/api/auth`.
  - **Details Modal**: Pops up when a user clicks on a media item (from search or library). It includes:
    - **Media Info**: Cover image, title, type, release year, and genres.
    - **Actions**: "Add to Library" and "Check News" buttons.
    - **Public Reviews**: Displays an aggregated Global Rating (out of 100) based on users' personal scores, alongside a feed of individual text reviews.
    - **Community Comments**: A dedicated section for threaded discussions. Users can post top-level comments and use inline forms to post nested replies to one another.
## 7. Deployment Configuration

- **Frontend Configuration**: CORS in the backend allows requests from `https://catalogue-website-frontend.vercel.app` (production) and local development ports (`3000`, `5500`).
- **Backend Configuration**: Requires a PostgreSQL instance via `DATABASE_URL`. Includes a `vercel.json` file indicating serverless deployment setup.

---
*End of Document*
