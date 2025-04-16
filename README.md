# Beyond Measure

A Next.js application that facilitates project-based learning between teachers and students.

## Features

- **Teacher Dashboard**: Create, manage, and track student projects
- **Student Portal**: View and interact with assigned projects
- **Admin Panel**: Manage users and site content
- **User Authentication**: Secure login and registration
- **Profile Management**: User profiles with customizable avatars
- **Responsive Design**: Works on mobile and desktop devices

## Technology Stack

- Next.js 14
- TypeScript
- Supabase (Auth, Database, Storage)
- Tailwind CSS
- Shadcn UI Components

## Recent Changes and Fixes

- Fixed profile image loading issues in teacher project cards
- Improved user role management and authentication flows
- Enhanced UI/UX across the platform
- Added debug utilities for troubleshooting
- Implemented comprehensive database schema

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env.local` file with your Supabase credentials
4. Run the development server with `npm run dev`

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deployment

The application can be deployed to Vercel or any other hosting platform that supports Next.js applications. 