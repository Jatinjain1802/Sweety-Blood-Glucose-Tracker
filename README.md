# Sweety - Blood Glucose Tracker

A MERN-style diabetes tracking app for recording up to four blood glucose readings per day and reviewing daily, month-to-date, and monthly summaries.

## Tech stack

- Node.js + Express
- PostgreSQL
- React + Vite
- JWT-based authentication
- bcrypt password hashing

## Project structure

- `server/` - API, database migration, validation, tests, seed script
- `client/` - React frontend

## Features

- User sign up and login with hashed passwords
- Protected user-specific glucose readings
- Add, edit, delete, and view readings by date and slot
- Validation for required fields, ranges, duplicates, and limits
- Daily, month-to-date, and monthly report summaries
- Seed script for a demo user and sample readings
