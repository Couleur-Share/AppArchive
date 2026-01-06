# Software Record Management System (软件记录管理系统)

## Overview
A Vue 3 + TypeScript software record management system for tracking and displaying software information.

## Tech Stack
- **Frontend**: Vue 3 + TypeScript + Tailwind CSS + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Replit built-in)
- **Authentication**: Clerk (optional, disabled by default)
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
1. **Clerk Authentication**: Set `VITE_CLERK_PUBLISHABLE_KEY` to enable
2. **Tencent COS Storage**: Set `COS_SECRET_ID`, `COS_SECRET_KEY`, `COS_BUCKET`, `COS_REGION`
3. **Kimi AI Analysis**: Set `KIMI_API_KEY`

## Environment Variables
- `PORT` - Backend port (default: 3001)
- `VITE_API_BASE_URL` - API base URL (default: /api)
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)

## Deployment
For production, build and run:
```bash
npm run build
npm run start
```
