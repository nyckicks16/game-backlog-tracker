# Game Backlog Tracker

A web application for managing your video game backlog, tracking progress, and maintaining ratings/reviews.

## 🎮 Project Overview

This application allows users to:
- Add games to their personal collection
- Categorize games as Playing, Completed, or Backlog
- Track progress and add personal notes
- Rate and review completed games
- Search and filter their game library

## 🚀 Tech Stack

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management

### Backend
- **Node.js** with Express.js
- **Prisma ORM** with SQLite (development)
- **Google OAuth 2.0** for authentication
- **JWT** for session management

### Development Tools
- **ESLint** + **Prettier** for code quality
- **Concurrently** for running frontend/backend together
- **VS Code** with recommended extensions

## 📁 Project Structure

```
game-backlog-tracker/
├── frontend/          # React + Vite application
├── backend/           # Node.js + Express API
├── docs/             # Project documentation
└── README.md         # This file
```

## 🛠️ Getting Started

1. Clone the repository
2. Set up environment variables
3. Install dependencies for both frontend and backend
4. Run development servers

## 📝 User Stories

This project is organized around Azure DevOps work items:
- **Epic #3**: Video Game Backlog Tracker - Core Platform Development
- **Feature #4**: User Authentication with Google OAuth
- **User Story #6**: Create Project Structure and Development Environment ✅ **IN PROGRESS**
- **User Story #5**: Set up Google OAuth 2.0 Configuration

## 🔧 Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

## 📄 License

MIT License