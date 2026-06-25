import json
import os
import sys
import urllib.request

PLACE_ID = "ChIJH2VMvQMk_QIRyZBJBLADG-c"
API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "data", "reviews.json")

EXCLUDE_WORDS = ("grout",)


def fetch():
    if not API_KEY:
        print("GOOGLE_PLACES_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    url = (
        "https://maps.googleapis.com/maps/api/place/details/json"
        f"?place_id={PLACE_ID}&fields=rating,user_ratings_total,reviews&key={API_KEY}"
    )
    with urllib.request.urlopen(url) as resp:
        data = json.load(resp)

    if data.get("status") != "OK":
        print(f"Places API error: {data.get('status')}", file=sys.stderr)
        sys.exit(1)

    result = data["result"]
    raw_reviews = sorted(result.get("reviews", []), key=lambda r: r.get("time", 0), reverse=True)
    reviews = []
    for r in raw_reviews:
        text = r.get("text", "")
        if any(w in text.lower() for w in EXCLUDE_WORDS):
            continue
        reviews.append({
            "name": r.get("author_name"),
            "photo": r.get("profile_photo_url"),
            "rating": r.get("rating"),
            "text": text,
            "relative_time": r.get("relative_time_description"),
        })

    out = {
        "rating": result.get("rating"),
        "total": result.get("user_ratings_total"),
        "reviews": reviews,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {len(reviews)} reviews to {OUT_PATH}")


if __name__ == "__main__":
    fetch()
