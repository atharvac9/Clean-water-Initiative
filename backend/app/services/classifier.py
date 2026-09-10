"""
CLIP-based zero-shot classifier for watershed field photos.

Runs REAL inference on actual images — never falls back to mock data.
If the model fails to load or inference fails, returns an explicit error.
"""

import io
import logging
from typing import Optional

import numpy as np
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

# Model cache — loaded once, reused for all requests
_model_cache: dict = {}
_torch = None


def _get_torch():
    global _torch
    if _torch is None:
        try:
            import torch
            _torch = torch
        except ImportError:
            raise RuntimeError(
                "torch is not installed. Install it with: pip install torch"
            )
    return _torch


def _load_model():
    """
    Load the CLIP model once and cache it.
    Uses open_clip (preferred) with transformers as fallback.
    """
    if "model" in _model_cache:
        return _model_cache["model"], _model_cache["preprocess"], _model_cache["tokenizer"]

    try:
        import open_clip

        model, _, preprocess = open_clip.create_model_and_transforms(
            settings.clip_model_name,
            pretrained=settings.clip_pretrained,
        )
        tokenizer = open_clip.get_tokenizer(settings.clip_model_name)
        model.eval()

        _model_cache["model"] = model
        _model_cache["preprocess"] = preprocess
        _model_cache["tokenizer"] = tokenizer
        _model_cache["backend"] = "open_clip"

        logger.info(f"CLIP model loaded: {settings.clip_model_name} via open_clip")
        return model, preprocess, tokenizer

    except ImportError:
        logger.warning("open_clip not available, falling back to transformers CLIP")

    try:
        from transformers import CLIPProcessor, CLIPModel

        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        model.eval()

        _model_cache["model"] = model
        _model_cache["preprocess"] = processor
        _model_cache["tokenizer"] = None
        _model_cache["backend"] = "transformers"

        logger.info("CLIP model loaded via transformers")
        return model, processor, None

    except Exception as e:
        raise RuntimeError(f"Failed to load any CLIP model: {e}")


def classify_image(image_bytes: bytes) -> dict:
    """
    Classify a field photo using CLIP zero-shot classification.

    Args:
        image_bytes: Raw image bytes (JPEG/PNG)

    Returns:
        dict with keys:
            - predicted_class: str
            - confidence: float (0-1)
            - all_scores: dict mapping class_name → probability

    Raises:
        RuntimeError: If model loading or inference fails
    """
    # Load and preprocess image
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Invalid image data: {e}")

    model, preprocess, tokenizer = _load_model()
    backend = _model_cache.get("backend", "unknown")
    torch = _get_torch()

    if backend == "open_clip" and tokenizer is not None:
        # open_clip path
        image_tensor = preprocess(image).unsqueeze(0)
        text_tokens = tokenizer(settings.clip_labels)

        with torch.no_grad():
            image_features = model.encode_image(image_tensor)
            text_features = model.encode_text(text_tokens)

            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)

            similarity = (image_features @ text_features.T).squeeze(0)
            probs = torch.softmax(similarity * 100, dim=-1)

    else:
        # transformers CLIPProcessor path
        inputs = preprocess(
            text=settings.clip_labels,
            images=image,
            return_tensors="pt",
            padding=True,
        )

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits_per_image.squeeze(0)
            probs = torch.softmax(logits, dim=-1)

    # Extract results
    probs_np = probs.cpu().numpy()
    predicted_idx = int(np.argmax(probs_np))

    return {
        "predicted_class": settings.class_names[predicted_idx],
        "confidence": round(float(probs_np[predicted_idx]), 4),
        "all_scores": {
            settings.class_names[i]: round(float(probs_np[i]), 4)
            for i in range(len(settings.class_names))
        },
    }


async def classify_photo_from_url(url: str) -> dict:
    """
    Download a photo from a URL (e.g. Supabase Storage public URL)
    and classify it.
    """
    import httpx

    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30)
        response.raise_for_status()
        return classify_image(response.content)


async def classify_photo_from_bytes(image_bytes: bytes) -> dict:
    """Classify a photo from raw bytes (e.g. from an upload)."""
    return classify_image(image_bytes)


def is_model_loaded() -> bool:
    """Check if the CLIP model is loaded in memory."""
    return "model" in _model_cache


def preload_model():
    """
    Eagerly load the CLIP model at startup to avoid first-request latency.
    Call this during FastAPI lifespan.
    """
    try:
        _load_model()
        logger.info("CLIP model preloaded successfully")
    except Exception as e:
        logger.error(f"CLIP model preload failed: {e}")
