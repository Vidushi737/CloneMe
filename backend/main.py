# backend/app/main.py (key endpoints)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt, datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["[localhost](http://localhost:5173)"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET = "your-secret-key"  # move to .env

class AuthBody(BaseModel):
    email: str
    password: str

def make_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")

@app.post("/login")
def login(body: AuthBody):
    # TODO: verify against DB
    # Raise HTTPException(400, "Invalid credentials") on failure
    return {"access_token": make_token(body.email)}

@app.post("/signup")
def signup(body: AuthBody):
    # TODO: create user in DB
    # Raise HTTPException(400, "Email already registered") on duplicate
    return {"access_token": make_token(body.email)}

