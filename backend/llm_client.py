"""LLM client — OpenRouter-backed replacement for the old emergentintegrations wrapper.

Uses the OpenAI Python SDK against OpenRouter's OpenAI-compatible endpoint so we
can call any frontier model (Claude Sonnet 4.5, GPT-4o, Gemini Pro Vision, etc.)
with one client, one key, one bill.

Env vars:
    OPENROUTER_API_KEY   required
    OPENROUTER_TEXT_MODEL  default: anthropic/claude-sonnet-4.5
    OPENROUTER_VISION_MODEL default: anthropic/claude-sonnet-4.5
    OPENROUTER_REFERER   optional, sent as HTTP-Referer (OpenRouter ranking)
    OPENROUTER_APP_NAME  optional, sent as X-Title
"""
from __future__ import annotations

import os
from typing import Optional

from openai import OpenAI


_DEFAULT_TEXT_MODEL = "anthropic/claude-sonnet-4.5"
_DEFAULT_VISION_MODEL = "anthropic/claude-sonnet-4.5"


def _client() -> OpenAI:
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY missing — set it in your environment.")
    extra_headers = {}
    if os.environ.get("OPENROUTER_REFERER"):
        extra_headers["HTTP-Referer"] = os.environ["OPENROUTER_REFERER"]
    if os.environ.get("OPENROUTER_APP_NAME"):
        extra_headers["X-Title"] = os.environ["OPENROUTER_APP_NAME"]
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
        default_headers=extra_headers or None,
    )


def complete_text(
    system: str,
    user: str,
    *,
    model: Optional[str] = None,
    max_tokens: int = 600,
    temperature: float = 0.7,
) -> str:
    """One-shot text completion. Returns the assistant's reply as a string."""
    resp = _client().chat.completions.create(
        model=model or os.environ.get("OPENROUTER_TEXT_MODEL", _DEFAULT_TEXT_MODEL),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return (resp.choices[0].message.content or "").strip()


def complete_vision(
    system: str,
    user_text: str,
    image_base64: str,
    *,
    mime: str = "image/png",
    model: Optional[str] = None,
    max_tokens: int = 400,
    temperature: float = 0.2,
) -> str:
    """One-shot vision completion. Returns the assistant's reply as a string."""
    image_data_url = f"data:{mime};base64,{image_base64}"
    resp = _client().chat.completions.create(
        model=model or os.environ.get("OPENROUTER_VISION_MODEL", _DEFAULT_VISION_MODEL),
        messages=[
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_text},
                    {"type": "image_url", "image_url": {"url": image_data_url}},
                ],
            },
        ],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return (resp.choices[0].message.content or "").strip()
