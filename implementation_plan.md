# Video Game, Anime, and Manga Catalog Tracking Site

This plan details the implementation of a modern, decoupled web application serving as a tracker for video games, anime, and manga. The architecture is split into a robust Node.js/Express backend and a responsive, dynamic HTML/CSS/JS frontend.

## User Review Required

> [!IMPORTANT]  
> Please review the proposed directory structure and the selected dependencies. Let me know if you would like to include a modern bundler for the frontend (like Vite) or proceed with plain HTML/JS/CSS as requested.
> 
> Also, confirm if you have a local or hosted PostgreSQL instance ready for the Prisma ORM.

## Directory Structure Outline

```text
/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database schema definitions
│   ├── src/
│   │   ├── controllers/         # Request handling logic (auth, items, users)
│   │   ├── middlewares/         # Custom middlewares (auth, rate limiting)
│   │   ├── routes/              # Express API route definitions
│   │   ├── services/            # Business logic and database interactions
│   │   ├── utils/               # Helper functions and constants
│   │   └── server.js            # Express application entry point
│   ├── .env                     # Backend environment variables (DB url, JWT secret)
│   ├── package.json             # Backend dependencies and scripts
│   └── package-lock.json
│
└── frontend/
    ├── assets/
    │   ├── css/
    │   │   ├── main.css         # Global styles and design system tokens
    │   │   └── components.css   # Styles for specific UI elements
    │   ├── js/
    │   │   ├── api.js           # API interaction functions
    │   │   ├── app.js           # Main application logic
    │   │   └── components.js    # Reusable UI component rendering
    │   └── images/              # Static image assets
    ├── index.html               # Main application entry point
    └── .env                     # Frontend environment variables (API URL)
```

## Proposed Changes

### Backend Setup (`/backend`)
We will configure the backend to use Node.js and Express, heavily focusing on security and performance.

Dependencies to be installed:
- `express`: Core web framework
- `prisma` & `@prisma/client`: Modern ORM and its client for PostgreSQL interaction
- `dotenv`: Environment variable management
- `cors`: Cross-Origin Resource Sharing middleware to allow frontend communication
- `bcryptjs`: Password hashing for secure user authentication
- `jsonwebtoken`: JWT generation and validation for stateless API authentication
- `express-rate-limit`: Basic rate-limiting middleware to protect against brute-force attacks

### Frontend Setup (`/frontend`)
The frontend will be built using modern web standards (Vanilla HTML/CSS/JS) to maintain a lightweight footprint while delivering a premium user experience.
- Implementing a rich, dynamic design system with modern typography, dark mode capabilities, and micro-animations for high engagement.
- Modularized Javascript for clean separation of API calls, state management, and UI rendering.

## Implementation Steps (Post-Approval)

1. **Workspace Initialization**: Create the `backend/` and `frontend/` directory structure.
2. **Backend Configuration**: 
   - Initialize `package.json` in `/backend`.
   - Install the specified dependencies (`express`, `prisma`, `dotenv`, `cors`, `bcryptjs`, `jsonwebtoken`, `express-rate-limit`).
   - Initialize Prisma with the PostgreSQL provider.
3. **Frontend Configuration**:
   - Create the base HTML, CSS, and JS files according to the directory outline.
   - Set up the premium design system tokens in `main.css`.

## Verification Plan

### Automated Checks
- Verify `backend/package.json` contains all required dependencies.
- Ensure `prisma/schema.prisma` is correctly configured for `postgresql`.

### Manual Verification
- Review the generated directory tree to ensure strict decoupling of frontend and backend.
