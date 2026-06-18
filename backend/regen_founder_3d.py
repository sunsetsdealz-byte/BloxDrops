"""One-off: convert the founder character.png to a 3D GLB via fal.ai image-to-3d
and assign it to the founder drop in MongoDB.

Usage: cd /app/backend && python regen_founder_3d.py
"""
import os
import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from pymongo import MongoClient


async def main():
    if not os.environ.get("FAL_KEY"):
        print("FAL_KEY missing — aborting")
        sys.exit(1)

    import fal_client

    # Public URL to the founder character image
    image_url = "https://ai-generator-66.preview.emergentagent.com/hero/character.png"

    print(f"[1/3] Submitting fal.ai image-to-3d for: {image_url}")
    handler = await fal_client.submit_async(
        "tripo3d/tripo/v2.5/image-to-3d",
        arguments={"image_url": image_url},
    )
    print(f"[2/3] Waiting for fal.ai result …")
    result = await handler.get()

    model_url = None
    thumb_url = None
    if isinstance(result, dict):
        model_url = (
            (result.get("model_mesh") or {}).get("url")
            or (result.get("pbr_model") or {}).get("url")
            or (result.get("base_model") or {}).get("url")
        )
        thumb_url = (result.get("rendered_image") or {}).get("url")

    if not model_url:
        print("Failed — no model URL in fal response:")
        print(result)
        sys.exit(2)

    print(f"  model_url: {model_url}")
    print(f"  thumb_url: {thumb_url}")

    # Update the founder drop
    print(f"[3/3] Updating founder drop in DB …")
    mongo = MongoClient(os.environ["MONGO_URL"])
    db = mongo[os.environ["DB_NAME"]]
    res = db.generations.update_one(
        {"is_coming_soon": True},
        {"$set": {"model_url": model_url}},
    )
    print(f"Updated {res.modified_count} doc(s)")


if __name__ == "__main__":
    asyncio.run(main())
