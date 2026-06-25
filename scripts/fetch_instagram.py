import json
import os
import sys
import urllib.parse
import urllib.request

IG_USER_ID = "17841458656142409"
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "data", "instagram.json")
LIMIT = 8
LOCAL_TOKEN_FILE = os.path.expanduser("~/.scrubbys/meta_tokens.json")


def get_token():
    token = os.environ.get("IG_PAGE_TOKEN")
    if token:
        return token
    if os.path.exists(LOCAL_TOKEN_FILE):
        with open(LOCAL_TOKEN_FILE) as f:
            return json.load(f).get("page_token")
    return None


def fetch():
    PAGE_TOKEN = get_token()
    if not PAGE_TOKEN:
        print("IG_PAGE_TOKEN not set", file=sys.stderr)
        sys.exit(1)

    params = urllib.parse.urlencode({
        "fields": "caption,media_type,media_url,thumbnail_url,permalink,timestamp",
        "limit": LIMIT,
        "access_token": PAGE_TOKEN,
    })
    url = f"https://graph.facebook.com/v19.0/{IG_USER_ID}/media?{params}"
    with urllib.request.urlopen(url) as resp:
        data = json.load(resp)

    if "error" in data:
        print(f"Graph API error: {data['error']}", file=sys.stderr)
        sys.exit(1)

    posts = []
    for item in data.get("data", []):
        image = item.get("thumbnail_url") or item.get("media_url")
        caption = (item.get("caption") or "").split("\n")[0].strip()
        if len(caption) > 140:
            caption = caption[:137].rstrip() + "..."
        posts.append({
            "image": image,
            "caption": caption,
            "permalink": item.get("permalink"),
            "media_type": item.get("media_type"),
        })

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump({"posts": posts}, f, indent=2)
    print(f"Wrote {len(posts)} posts to {OUT_PATH}")


if __name__ == "__main__":
    fetch()
