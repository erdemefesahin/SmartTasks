# SmartTasks

AI-assisted task and project management web app.

## Overview

This monorepo contains:
- `/client` — React + TypeScript + Vite frontend
- `/server` — Node.js + Express + TypeScript backend
- PostgreSQL database managed by Prisma
- JWT authentication and AI-assisted task enhancements

## Quick start

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and update values.
3. Start backend and frontend:
   - `npm run dev:server`
   - `npm run dev:client`

## Docker

`docker compose up --build`

## Structure

- `client/src` — frontend pages and components
- `server/src` — backend controllers, services, routes, middleware
- `server/prisma/schema.prisma` — database models
