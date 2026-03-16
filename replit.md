# Software Record Management System (软件记录管理系统)

## Overview
A Vue 3 + TypeScript software record management system for tracking and displaying software information.

## Tech Stack
- **Frontend**: Vue 3 + TypeScript + Tailwind CSS + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Replit built-in)
- **Authentication**: Self-hosted JWT (bcrypt + jsonwebtoken)
- **Build Tool**: Vite

## Project Structure
```
├── src/                # Frontend source code
│   ├── components/     # Vue components
│   ├── services/       # API services
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   └── App.vue         # Main app component
├── server/             # Backend source code
│   ├── index.js        # Express server
│   ├── database.js     # Database configuration
│   ├── cos.js          # Tencent COS storage (optional)
│   └── prompts.js      # AI prompts
└── package.json        # Project config
```

## Running the Project
The project runs both frontend and backend concurrently:
- **Frontend**: Vite dev server on port 5000
- **Backend**: Express API on port 3001

The workflow command `npm run dev` starts both servers.

## Database
Uses Replit's built-in PostgreSQL database. Tables:
- `softwares` - Software records
- `comparison_groups` - Comparison group definitions
- `comparison_group_softwares` - Software in groups
- `comparison_analyses` - AI analysis results

## Optional Features (require configuration)
1. **JWT Authentication**: Run `node scripts/migrate-users.js` to create users table, set `JWT_SECRET` in env
2. **Tencent COS Storage**: Set `COS_SECRET_ID`, `COS_SECRET_KEY`, `COS_BUCKET`, `COS_REGION`
3. **Kimi AI Analysis**: Set `KIMI_API_KEY`

## Environment Variables
- `PORT` - Backend port (default: 3001)
- `VITE_API_BASE_URL` - API base URL (default: /api)
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)

## Mobile Responsiveness
The app is fully responsive with mobile-optimized features:
- **Header**: Collapsible search bar on mobile, compact navigation
- **View Mode**: Defaults to list mode on mobile (≤640px), grid on desktop
- **Toggle Button**: Hidden on mobile since list mode is enforced
- **Detail Dialog**: Full-screen on mobile with scrollable tabs
- **Touch Targets**: Minimum 36px for better touch interaction

User preferences saved in localStorage override the mobile default.

## Deployment
For production, build and run:
```bash
npm run build
npm run start
```
