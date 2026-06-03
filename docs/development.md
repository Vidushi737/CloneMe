# Development Guide

This guide details code structure, API design, database schemas, and conventions used in CloneMe.

## Tech Stack Overview

- **Frontend**: React, TypeScript, Tailwind CSS, Vite.
  - State Management: Context API / Hooks.
  - Charts: Recharts.
  - Icons: Lucide React.
  - HTTP Client: Axios.

- **Backend**: FastAPI, Python 3.9+.
  - ORM: SQLAlchemy.
  - Migrations: Alembic (optional / db auto-creation on start for dev).
  - Auth: JWT-based authentication with bcrypt password hashing.

- **Vector DB**: ChromaDB for similarity searching and memory retrieval.

- **AI SDK**: Google Gemini API via `google-generativeai` or LangChain.

## Code Conventions

### Python Backend
- Follow PEP 8 guidelines.
- Use type hints for all parameters and return statements in endpoints.
- Return Pydantic schemas from API endpoints instead of raw SQLAlchemy objects.
- Keep business logic in `crud.py` or separate service classes (e.g. `services/gemini.py`), leaving routers clean.

### React Frontend
- Write functional components in TypeScript (`.tsx`).
- Use CSS utility classes from Tailwind. Do not use inline styles.
- Organize UI parts into reusable components inside `src/components/`.
- Handle page-specific UI state inside `src/pages/`.
