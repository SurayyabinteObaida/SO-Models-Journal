"""
FastAPI backend for the Architectures portal.

Holds the Anthropic API key server-side and exposes three endpoints
that the frontend calls instead of hitting api.anthropic.com directly:

  POST /api/deepdive   - generate a deep-dive on a model given a prompt instruction
  POST /api/chat       - multi-turn chat scoped to a model's context
  POST /api/quiz       - generate one multiple-choice question (strict JSON)
  POST /api/define     - define a user-selected term/phrase, in context (cue cards)
  POST /api/critique-pipeline - written AI critique of a "solve the problem" pipeline graph

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


class DefineRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    term: str = Field(..., description="The exact text the user selected to define")
    model_name: str = Field(..., description="Which architecture page this was selected from, for context")
    surrounding_context: str = Field(..., description="A sentence or two around the selection, for disambiguation")
    max_tokens: int = 250


class PipelineNode(BaseModel):
    nodeId: str
    blockId: str
    label: str


class PipelineEdge(BaseModel):
    fromNode: str = Field(..., alias="from")
    toNode: str = Field(..., alias="to")

    model_config = {"populate_by_name": True}


class CritiqueRequest(BaseModel):
    problem_title: str
    problem_blurb: str
    nodes: List[PipelineNode]
    edges: List[PipelineEdge]
    heuristic_issues: List[str] = Field(default_factory=list)
    max_tokens: int = 600


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


@app.post("/api/define")
async def define(req: DefineRequest):
    term = req.term.strip()
    if not term:
        raise HTTPException(status_code=400, detail="term must not be empty.")
    if len(term) > 200:
        raise HTTPException(status_code=400, detail="Selection too long — select a shorter term or phrase.")

    prompt = (
        f"The reader is a CS academic reading about \"{req.model_name}\" and selected this exact "
        f"term/phrase to look up: \"{term}\"\n\n"
        f"Surrounding context where they selected it: \"{req.surrounding_context}\"\n\n"
        f"Give a precise, self-contained definition of \"{term}\" as it's used in this specific context. "
        f"2-4 sentences. Use $...$ for inline LaTeX math if relevant. No preamble like 'this term means' — "
        f"just the definition directly. Assume graduate-level ML background, so don't over-explain basics "
        f"unrelated to this specific term."
    )
    text = await call_anthropic([{"role": "user", "content": prompt}], req.max_tokens)
    return {"term": term, "definition": text}


def serialize_pipeline(nodes: List[PipelineNode], edges: List[PipelineEdge]) -> str:
    """Renders the graph as readable pseudo-code for the model to critique, e.g.:
    n1[Raw text] -> n2[Tokenize] -> n3[TF-IDF] -> n4[Logistic regression] -> n5[Threshold] -> n6[Classification label]
    Branches and combiners naturally show as multiple lines converging on a shared node id.
    """
    node_labels = {n.nodeId: f"{n.nodeId}[{n.label}]" for n in nodes}
    lines = []
    if not edges:
        lines.append("(no connections — " + ", ".join(node_labels.values()) + " are placed but unconnected)")
    for e in edges:
        frm = node_labels.get(e.fromNode, e.fromNode)
        to = node_labels.get(e.toNode, e.toNode)
        lines.append(f"{frm} -> {to}")
    return "\n".join(lines)


@app.post("/api/critique-pipeline")
async def critique_pipeline(req: CritiqueRequest):
    if not req.nodes:
        raise HTTPException(status_code=400, detail="Pipeline has no blocks to critique.")

    graph_repr = serialize_pipeline(req.nodes, req.edges)
    heuristic_summary = (
        "The automatic structural checker found no issues."
        if not req.heuristic_issues
        else "The automatic structural checker flagged:\n- " + "\n- ".join(req.heuristic_issues)
    )

    prompt = (
        f"A student is designing an ML pipeline to solve: \"{req.problem_title}\" — {req.problem_blurb}\n\n"
        f"Their proposed pipeline graph (node[block label] -> node[block label]):\n{graph_repr}\n\n"
        f"{heuristic_summary}\n\n"
        f"Give a short, direct critique (not a rewrite) covering: (1) whether the overall approach is "
        f"reasonable for this problem, (2) one specific strength, (3) one specific weakness or risk "
        f"(e.g. a block choice that's technically valid but a poor fit, a missing consideration like "
        f"class imbalance or latency, or an over-engineered choice for the problem's scale), and "
        f"(4) one concrete suggestion for improvement. Write for a CS academic — skip basic explanations, "
        f"go straight to the substantive assessment. 4 short paragraphs, no headers, no bullet lists."
    )
    text = await call_anthropic([{"role": "user", "content": prompt}], req.max_tokens)
    return {"critique": text}

