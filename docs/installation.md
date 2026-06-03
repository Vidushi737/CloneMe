# Installation Guide

This document describes how to set up CloneMe locally or via Docker.

## Prerequisites
- Node.js (v18 or higher)
- Python (v3.9 or higher)
- Docker & Docker Compose (optional, for containerized run)
- Gemini API Key (obtain from Google AI Studio)

---

## Local Development Setup

To run without Docker using SQLite for development:

### 1. Backend Setup
1. Open a terminal and navigate to the `backend/` directory.
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Unix/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables:
   ```bash
   copy ..\.env.example .env
   ```
5. Edit `.env` to insert your `GEMINI_API_KEY`.
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will be available at `http://localhost:8000`. You can access the Interactive Swagger documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend/` directory.
2. Install the required Node packages:
   ```bash
   npm install
   ```
3. Copy the environment variables:
   ```bash
   copy ..\.env.example .env.local
   # Or create it manually with variables prefix VITE_
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

---

## Docker Compose Setup

To run the complete platform inside containers (PostgreSQL, ChromaDB, FastAPI, React):

1. Copy `.env.example` into a root `.env` file:
   ```bash
   copy .env.example .env
   ```
2. Open the newly created `.env` and set `GEMINI_API_KEY`.
3. Build and launch the containers:
   ```bash
   docker-compose up --build
   ```
4. Access the application:
   - Frontend: `http://localhost`
   - Backend API Docs: `http://localhost:8000/docs`
