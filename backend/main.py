"""
FastAPI backend for the Architectures portal.

Holds the Anthropic API key server-side and exposes three endpoints
that the frontend calls instead of hitting api.anthropic.com directly:

  POST /api/deepdive   - generate a deep-dive on a model given a prompt instruction
  POST /api/chat       - multi-turn chat scoped to a model's context
  POST /api/quiz       - generate one multiple-choice question (strict JSON)

Run locally:
  pip install -r requirements.txt
  cp .env.example .env   # then fill in ANTHROPIC_API_KEY
  uvicorn main:app --reload --port 8000

Deploy: see DEPLOY.md
"""

import os
import json
import logging
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"

# Comma-separated list of allowed frontend origins, e.g.
# "https://yourname.github.io,http://localhost:5500"
ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5500").split(",") if o.strip()
]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("portal-backend")

if not ANTHROPIC_API_KEY:
    logger.warning("ANTHROPIC_API_KEY is not set — requests to Anthropic will fail until it is.")

app = FastAPI(title="Architectures Portal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ---------- Request/response models ----------

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class DeepdiveRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_name: str = Field(..., description="Display name of the architecture, e.g. 'LSTM'")
    year: str
    concept: str
    mechanism: List[str]
    instruction: str = Field(..., description="What kind of deep-dive to generate")
    max_tokens: int = 700


class ChatRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_name: str
    year: str
    concept: str
    mechanism: List[str]
    significance: str
    messages: List[ChatMessage] = Field(..., description="Conversation so far, ending in a user message")
    max_tokens: int = 500


class QuizRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_name: str
    concept: str
    mechanism: List[str]
    max_tokens: int = 500


class QuizResponse(BaseModel):
    question: str
    options: List[str]
    correctIndex: int
    explanation: str


# ---------- Anthropic call helper ----------

async def call_anthropic(messages: list, max_tokens: int) -> str:
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="Server is missing ANTHROPIC_API_KEY configuration.")

    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
    }
    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": max_tokens,
        "messages": messages,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(ANTHROPIC_API_URL, headers=headers, json=payload)
        except httpx.RequestError as exc:
            logger.error(f"Network error calling Anthropic: {exc}")
            raise HTTPException(status_code=502, detail="Could not reach the Anthropic API.")

    if resp.status_code != 200:
        logger.error(f"Anthropic API error {resp.status_code}: {resp.text}")
        raise HTTPException(status_code=502, detail=f"Anthropic API returned {resp.status_code}.")

    data = resp.json()
    text_blocks = [b["text"] for b in data.get("content", []) if b.get("type") == "text"]
    return "\n".join(text_blocks).strip()


# ---------- Endpoints ----------

@app.get("/api/health")
async def health():
    return {"status": "ok", "model": ANTHROPIC_MODEL, "key_configured": bool(ANTHROPIC_API_KEY)}


@app.post("/api/deepdive")
async def deepdive(req: DeepdiveRequest):
    prompt = (
        f"You are a precise ML architecture tutor. The reader is a CS academic studying "
        f"\"{req.model_name}\" ({req.year}). Context — concept: {req.concept}\n\n"
        f"Mechanism notes: {' | '.join(req.mechanism)}\n\n"
        f"Task: {req.instruction}\n\n"
        f"Use $...$ for inline math (LaTeX). Keep it tight — academic, not chatty. "
        f"No headers, no markdown bullets, just well-structured prose paragraphs separated by blank lines."
    )
    text = await call_anthropic([{"role": "user", "content": prompt}], req.max_tokens)
    return {"text": text}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not req.messages or req.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="messages must end with a user turn.")

    sys_context = (
        f"You are a precise ML architecture tutor discussing \"{req.model_name}\" ({req.year}) "
        f"with a CS academic. Page context — concept: {req.concept} "
        f"Mechanism: {' | '.join(req.mechanism)} Significance: {req.significance}\n\n"
        f"Answer their question directly and rigorously. Use $...$ for inline LaTeX math. "
        f"Be concise — a few sentences to a short paragraph unless they ask for depth."
    )
    api_messages = (
        [
            {"role": "user", "content": sys_context},
            {"role": "assistant", "content": f"Understood — ready for questions about {req.model_name}."},
        ]
        + [{"role": m.role, "content": m.content} for m in req.messages]
    )
    text = await call_anthropic(api_messages, req.max_tokens)
    return {"reply": text}


@app.post("/api/quiz", response_model=QuizResponse)
async def quiz(req: QuizRequest):
    prompt = (
        f"Write ONE multiple-choice comprehension question testing real understanding "
        f"(not trivia/dates) of \"{req.model_name}\" — concept: {req.concept} "
        f"Mechanism: {' | '.join(req.mechanism)}\n\n"
        f"Respond with STRICT JSON only, no markdown fences, no preamble, in this exact shape: "
        f'{{"question":"...", "options":["...","...","...","..."], "correctIndex":0, "explanation":"..."}}\n'
        f"Make exactly 4 options, only one correct, distractors should be plausible misconceptions. "
        f"Keep the question and options free of $ math delimiters - plain text only."
    )
    text = await call_anthropic([{"role": "user", "content": prompt}], req.max_tokens)
    cleaned = text.replace("```json", "").replace("```", "").strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse quiz JSON from model output: {cleaned[:300]}")
        raise HTTPException(status_code=502, detail="Model did not return valid quiz JSON.")

    required_keys = {"question", "options", "correctIndex", "explanation"}
    if not required_keys.issubset(parsed.keys()):
        raise HTTPException(status_code=502, detail="Quiz JSON missing required fields.")

    return parsed
