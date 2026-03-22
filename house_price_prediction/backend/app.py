from __future__ import annotations

import base64
import json
import os
import pickle
import warnings
import requests
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import sklearn
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sklearn.exceptions import InconsistentVersionWarning
from sqlalchemy import text

app = Flask(__name__)

# ✅ FIXED: Allow all origins (fixes mobile CORS issues)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')  # Change in production
jwt = JWTManager(app)


def _include_error_detail() -> bool:
    return str(os.environ.get("INCLUDE_ERROR_DETAIL") or "").strip() in {"1", "true", "yes"}


@app.errorhandler(Exception)
def handle_unexpected_error(e):
    # Keep API responses actionable in production debugging (opt-in).
    app.logger.exception("Unhandled exception")
    payload = {"error": "Internal Server Error"}
    if _include_error_detail():
        payload["detail"] = str(e)
    return jsonify(payload), 500

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response


@app.route("/healthz", methods=["GET"])
def healthz():
    db_name = "unknown"
    db_ok = False
    try:
        db_name = db.engine.url.get_backend_name() or "unknown"
        db.session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return jsonify({"ok": True, "db": db_name, "db_ok": bool(db_ok)}), 200

# Paths
BASE_DIR = Path(__file__).resolve().parent
def _detect_repo_root() -> Path:
    for parent in BASE_DIR.parents:
        if (parent / "public").exists():
            return parent
    return BASE_DIR


REPO_ROOT = _detect_repo_root()
MODEL_DIR = BASE_DIR / "model"

# Lazy-loaded ML artifacts
model = None
scaler = None
MODEL_METADATA_FILE = MODEL_DIR / "model_metadata.json"

# Storage files
WISHLIST_FILE = BASE_DIR / "wishlist.json"
PROPERTIES_FILE = BASE_DIR / "properties.json"
MOCK_PROPERTIES_FILE = BASE_DIR / "mock_properties.json"


def _get_database_url() -> str:
    url = (os.environ.get("DATABASE_URL") or "").strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]

    # In production (Railway/Render/etc.), require an external DB for persistence.
    # Falling back to SQLite inside ephemeral containers causes users/properties to disappear on redeploy/restart.
    is_prod_like = bool(os.environ.get("RAILWAY_ENVIRONMENT") or os.environ.get("RENDER") or os.environ.get("FLY_APP_NAME"))
    if not url and is_prod_like:
        raise RuntimeError("DATABASE_URL is required in production for persistent storage (Postgres).")

    if not url:
        url = f"sqlite:///{(BASE_DIR / 'app.db').as_posix()}"
    return url


app.config["SQLALCHEMY_DATABASE_URI"] = _get_database_url()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
if app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite:"):
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"connect_args": {"timeout": 30}}
else:
    # Better resilience for managed Postgres connections.
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
db = SQLAlchemy(app)

with app.app_context():
    db.create_all()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    display_name = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Property(db.Model):
    __tablename__ = "properties"

    id = db.Column(db.Integer, primary_key=True)
    external_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class WishlistItem(db.Model):
    __tablename__ = "wishlist_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(128), nullable=False, index=True)
    property_external_id = db.Column(db.String(64), nullable=False, index=True)
    payload = db.Column(db.JSON, nullable=False)
    added_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "property_external_id", name="uq_user_property"),)


class BlogPost(db.Model):
    __tablename__ = "blog_posts"

    id = db.Column(db.Integer, primary_key=True)
    external_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class VideoCategory(db.Model):
    __tablename__ = "video_categories"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    icon = db.Column(db.String(16), nullable=True)


class MediaBlob(db.Model):
    __tablename__ = "media_blobs"

    key = db.Column(db.String(255), primary_key=True)
    mime_type = db.Column(db.String(128), nullable=False)
    data = db.Column(db.LargeBinary, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Video(db.Model):
    __tablename__ = "videos"

    id = db.Column(db.Integer, primary_key=True)
    external_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    property_external_id = db.Column(db.String(64), nullable=False, index=True)
    category_id = db.Column(db.String(64), nullable=True, index=True)
    payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class MLArtifact(db.Model):
    __tablename__ = "ml_artifacts"

    key = db.Column(db.String(64), primary_key=True)
    data = db.Column(db.LargeBinary, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


def _safe_json_load(path: Path | None, default):
    try:
        if path and path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return default


def _normalize_property_payload(payload: dict) -> dict:
    for k in ["valuationCost", "price"]:
        v = payload.get(k)
        if isinstance(v, str) and "â‚¹" in v:
            payload[k] = v.replace("â‚¹", "₹")

    for k in ["propertyImage", "videoThumbnail", "image", "thumbnail"]:
        v = payload.get(k)
        if isinstance(v, str) and v.startswith("/houses/"):
            payload[k] = f"https://res.cloudinary.com/dh0glzsnz/image/upload/houses/{v.lstrip('/houses/')}"

    for k in ["propertyVideo", "videoUrl"]:
        v = payload.get(k)
        if isinstance(v, str) and v.startswith("/assets/videos/"):
            payload[k] = f"/media/{v.lstrip('/')}"

    return payload


def _absolute_if_relative_media_url(value: str) -> str:
    if not value.startswith("/"):
        return value
    if not (value.startswith("/media/") or value.startswith("/assets/") or value.startswith("/houses/")):
        return value
    url_root = request.url_root.rstrip("/")
    url_root = url_root.replace("http://", "https://")
    return url_root + value

def _rewrite_media_urls(payload: dict) -> dict:
    keys = [
        "propertyImage",
        "videoThumbnail",
        "thumbnail",
        "image",
        "propertyVideo",
        "videoUrl",
    ]
    for k in keys:
        v = payload.get(k)
        if isinstance(v, str):
            payload[k] = _absolute_if_relative_media_url(v)
    return payload


def load_ml_artifacts():
    global model, scaler
    if model is not None and scaler is not None:
        return model, scaler

    artifact_model = MLArtifact.query.filter_by(key="house_price_model.pkl").first()
    artifact_scaler = MLArtifact.query.filter_by(key="scaler.pkl").first()
    if artifact_model is None or artifact_scaler is None:
        raise FileNotFoundError(
            "Missing ML artifacts in database. "
            "Seed them once by calling POST /seed/ml/from-files (local) or upload via POST /seed/ml."
        )

    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always", InconsistentVersionWarning)
        model = pickle.loads(artifact_model.data)
        scaler = pickle.loads(artifact_scaler.data)

    if any(isinstance(w.message, InconsistentVersionWarning) for w in caught):
        meta = _safe_json_load(MODEL_METADATA_FILE, {})
        trained_with = meta.get("sklearn_version", "unknown")
        raise RuntimeError(
            "Model artifacts were created with a different scikit-learn version. "
            f"Runtime sklearn={sklearn.__version__}, model sklearn={trained_with}. "
            f"Regenerate pickles: python {BASE_DIR / 'train_and_export.py'}"
        )

    return model, scaler


def load_wishlist():
    return _safe_json_load(WISHLIST_FILE, {})


def save_wishlist(data):
    with open(WISHLIST_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def load_properties():
    return _safe_json_load(PROPERTIES_FILE, [])


def save_properties(data):
    with open(PROPERTIES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def _maybe_migrate_json_to_db():
    with app.app_context():
        db.create_all()

        if Property.query.first() is None:
            for item in load_properties():
                external_id = item.get("_id") or item.get("id")
                if external_id is None:
                    continue
                db.session.add(Property(external_id=str(external_id), payload=item))
            db.session.commit()

        if WishlistItem.query.first() is None:
            wishlist = load_wishlist()
            for user_id, items in (wishlist or {}).items():
                if not isinstance(items, list):
                    continue
                for item in items:
                    external_id = item.get("_id") or item.get("id")
                    if external_id is None:
                        continue
                    db.session.add(
                        WishlistItem(
                            user_id=str(user_id),
                            property_external_id=str(external_id),
                            payload=item,
                        )
                    )
            db.session.commit()


_maybe_migrate_json_to_db()


# -------------------- Auth --------------------

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")
    display_name = str(data.get("displayName") or "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    try:
        password_hash = generate_password_hash(password)
        new_user = User(email=email, password_hash=password_hash, display_name=display_name)
        db.session.add(new_user)
        db.session.commit()

        access_token = create_access_token(identity=email)

        return (
            jsonify(
                {
                    "access_token": access_token,
                    "user": {"id": new_user.id, "uid": email, "email": email, "displayName": display_name},
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        app.logger.exception("Registration failed")
        payload = {"error": "Registration failed"}
        if _include_error_detail():
            payload["detail"] = str(e)
        return jsonify(payload), 500


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    try:
        access_token = create_access_token(identity=email)
        return (
            jsonify(
                {
                    "access_token": access_token,
                    "user": {
                        "id": user.id,
                        "uid": user.email,
                        "email": user.email,
                        "displayName": user.display_name,
                    },
                }
            ),
            200,
        )
    except Exception as e:
        app.logger.exception("Login failed")
        payload = {"error": "Login failed"}
        if _include_error_detail():
            payload["detail"] = str(e)
        return jsonify(payload), 500


@app.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()
    if not identity:
        return jsonify({"error": "Unauthorized"}), 401

    user = User.query.filter_by(email=str(identity).strip().lower()).first()
    if user is None:
        return jsonify({"error": "User not found"}), 404

    return (
        jsonify(
            {
                "user": {
                    "id": user.id,
                    "uid": user.email,
                    "email": user.email,
                    "displayName": user.display_name or "",
                }
            }
        ),
        200,
    )


# -------------------- Predict --------------------

@app.route("/predict", methods=["GET", "POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return Response(status=200)

    if request.method == "GET":
        return jsonify(
            {
                "message": (
                    'Send a POST request with JSON: {"bedrooms":..., "bathrooms":..., '
                    '"livingArea":..., "condition":..., "schoolsNearby":...}'
                ),
                "example": {
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "livingArea": 2000,
                    "condition": 3,
                    "schoolsNearby": 2,
                },
            }
        )

    data = request.json or {}
    required = ["bedrooms", "bathrooms", "livingArea", "condition", "schoolsNearby"]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        m, s = load_ml_artifacts()
        features = np.array(
            [
                [
                    float(data["bedrooms"]),
                    float(data["bathrooms"]),
                    float(data["livingArea"]),
                    float(data["condition"]),
                    float(data["schoolsNearby"]),
                ]
            ]
        )
        scaled_features = s.transform(features)
        prediction = float(m.predict(scaled_features)[0])
        return jsonify({"predicted_price": prediction * 9})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- Properties --------------------

@app.route("/properties", methods=["GET", "OPTIONS"])
def get_properties():
    if request.method == "OPTIONS":
        return Response(status=200)
    items = Property.query.order_by(Property.id.asc()).all()
    return jsonify({"properties": [_rewrite_media_urls(dict(p.payload)) for p in items]})


@app.route("/properties", methods=["POST"])
@jwt_required()
def add_property():
    current_user = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Property data is required"}), 400

    external_id = data.get("_id") or data.get("id")
    if external_id is None:
        return jsonify({"error": "Property must include id (or _id)"}), 400
    external_id = str(external_id)

    existing = Property.query.filter_by(external_id=external_id).first()
    if existing is None:
        db.session.add(Property(external_id=external_id, payload=data))
        db.session.commit()
        return jsonify({"message": "Property saved", "property": data}), 201

    existing.payload = data
    db.session.commit()
    return jsonify({"message": "Property updated", "property": data}), 200


# -------------------- Wishlist --------------------

@app.route("/wishlist/<user_id>", methods=["GET"])
@jwt_required()
def get_wishlist(user_id):
    current_user = get_jwt_identity()
    if current_user != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    items = (
        WishlistItem.query.filter_by(user_id=str(user_id))
        .order_by(WishlistItem.added_at.desc())
        .all()
    )
    return jsonify({"wishlist": [_rewrite_media_urls(dict(w.payload)) for w in items]})


@app.route("/wishlist/<user_id>", methods=["POST"])
@jwt_required()
def add_to_wishlist(user_id):
    current_user = get_jwt_identity()
    if current_user != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    data = request.get_json(silent=True)
    if not data or "id" not in data:
        return jsonify({"error": "Property data with id is required"}), 400

    external_id = str(data.get("id"))
    existing = WishlistItem.query.filter_by(
        user_id=str(user_id), property_external_id=external_id
    ).first()
    if existing is not None:
        return jsonify({"message": "Already in wishlist", "wishlist": [_rewrite_media_urls(dict(existing.payload))]}), 200

    db.session.add(
        WishlistItem(
            user_id=str(user_id),
            property_external_id=external_id,
            payload=data,
        )
    )
    db.session.commit()

    items = (
        WishlistItem.query.filter_by(user_id=str(user_id))
        .order_by(WishlistItem.added_at.desc())
        .all()
    )
    return jsonify({"message": "Added to wishlist", "wishlist": [_rewrite_media_urls(dict(w.payload)) for w in items]}), 201


@app.route("/wishlist/<user_id>/<property_id>", methods=["DELETE"])
@jwt_required()
def remove_from_wishlist(user_id, property_id):
    current_user = get_jwt_identity()
    if current_user != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    deleted = WishlistItem.query.filter_by(
        user_id=str(user_id), property_external_id=str(property_id)
    ).delete()
    db.session.commit()

    items = (
        WishlistItem.query.filter_by(user_id=str(user_id))
        .order_by(WishlistItem.added_at.desc())
        .all()
    )
    if deleted == 0:
        return jsonify({"error": "Not found", "wishlist": [_rewrite_media_urls(dict(w.payload)) for w in items]}), 404
    return jsonify({"message": "Removed from wishlist", "wishlist": [_rewrite_media_urls(dict(w.payload)) for w in items]})


# -------------------- Videos + Blogs --------------------

PUBLIC_DIR = REPO_ROOT / "public"
VIDEO_DIR = PUBLIC_DIR / "assets" / "videos"
HOUSES_DIR = PUBLIC_DIR / "houses"

VIDEO_CATEGORIES = [
    {"id": "virtual-tour", "name": "Virtual Tours", "icon": "VT"},
    {"id": "walkthrough", "name": "Walkthroughs", "icon": "W"},
    {"id": "360-tour", "name": "360 Tours", "icon": "360"},
    {"id": "video-tour", "name": "Video Tours", "icon": "V"},
    {"id": "property-showcase", "name": "Showcase", "icon": "S"},
    {"id": "luxury-tour", "name": "Luxury", "icon": "L"},
    {"id": "heritage-tour", "name": "Heritage", "icon": "H"},
    {"id": "estate-tour", "name": "Estate", "icon": "E"},
    {"id": "modern-tour", "name": "Modern", "icon": "M"},
    {"id": "tech-tour", "name": "Smart Homes", "icon": "T"},
    {"id": "family-tour", "name": "Family", "icon": "F"},
]


def _pick_category_for_id(n: int) -> str:
    if not VIDEO_CATEGORIES:
        return "video-tour"
    return VIDEO_CATEGORIES[(n - 1) % len(VIDEO_CATEGORIES)]["id"]


# ✅ FIXED: Generate videos from mock_properties.json using Cloudinary URLs
def load_videos_from_public():
    videos = []

    # Try loading from mock_properties.json first (Cloudinary URLs)
    props = _safe_json_load(MOCK_PROPERTIES_FILE, [])
    if isinstance(props, list) and props:
        for prop in props:
            prop_id = prop.get("_id") or prop.get("id")
            if prop_id is None:
                continue
            try:
                n = int(prop_id)
            except Exception:
                n = 1

            video_url = prop.get("propertyVideo") or f"https://res.cloudinary.com/dh0glzsnz/video/upload/property{prop_id}.mp4"
            thumb = prop.get("propertyImage") or f"https://res.cloudinary.com/dh0glzsnz/image/upload/houses/img{prop_id}.jpg"

            videos.append({
                "id": str(prop_id),
                "propertyId": str(prop_id),
                "title": f"Property {prop_id} Video Tour",
                "videoUrl": video_url,
                "thumbnail": thumb,
                "duration": "",
                "views": 500 + (n * 73),
                "uploadDate": None,
                "description": f"Video tour for property {prop_id}.",
                "type": _pick_category_for_id(n),
            })
        return videos

    # Fallback: scan local video files
    if VIDEO_DIR.exists():
        for p in sorted(VIDEO_DIR.glob("property*.mp4")):
            stem = p.stem
            try:
                prop_id = int(stem.replace("property", ""))
            except Exception:
                continue

            videos.append({
                "id": str(prop_id),
                "propertyId": str(prop_id),
                "title": f"Property {prop_id} Video Tour",
                "videoUrl": f"https://res.cloudinary.com/dh0glzsnz/video/upload/property{prop_id}.mp4",
                "thumbnail": f"https://res.cloudinary.com/dh0glzsnz/image/upload/houses/img{prop_id}.jpg",
                "duration": "",
                "views": 500 + (prop_id * 73),
                "uploadDate": None,
                "description": f"Video tour for property {prop_id}.",
                "type": _pick_category_for_id(prop_id),
            })

    return videos


@app.route("/videos", methods=["GET"])
def list_videos():
    videos = Video.query.order_by(Video.id.asc()).all()
    return jsonify({"data": [_rewrite_media_urls(dict(v.payload)) for v in videos]})


@app.route("/video-categories", methods=["GET"])
def list_video_categories():
    cats = VideoCategory.query.order_by(VideoCategory.id.asc()).all()
    return jsonify({"data": [{"id": c.id, "name": c.name, "icon": c.icon} for c in cats]})


@app.route("/videos/by-property/<property_id>", methods=["GET"])
def get_video_by_property(property_id):
    v = Video.query.filter_by(property_external_id=str(property_id)).order_by(Video.id.asc()).first()
    if v is None:
        return jsonify({"error": "Video not found"}), 404
    return jsonify({"data": _rewrite_media_urls(dict(v.payload))})


def _blogs_file_candidates():
    return [
        REPO_ROOT / "public" / "blogsData.json",
        REPO_ROOT / "dist" / "blogsData.json",
        BASE_DIR / "blogsData.json",
        REPO_ROOT / "src" / "blogsData.json",
        REPO_ROOT / "blogsData.json",
    ]


def load_blogs():
    for p in _blogs_file_candidates():
        data = _safe_json_load(p, None)
        if isinstance(data, list):
            return data
    return []


# ✅ FIXED: Cloudinary URLs for blog images
def load_mock_blogs():
    return [
        {
            "_id": "1",
            "title": "Top 10 Real Estate Investment Tips for 2024",
            "description": "Discover the best strategies for real estate investment in today's market.",
            "content": "Real estate investment requires careful planning and market analysis...",
            "author": "Priya Sharma",
            "date": "2024-01-15",
            "category": "Investment",
            "image": "https://res.cloudinary.com/dh0glzsnz/image/upload/houses/img1.jpg",
            "readTime": "5 min read"
        },
        {
            "_id": "2",
            "title": "How to Choose the Perfect Home in Hyderabad",
            "description": "A complete guide to buying your dream home in Hyderabad.",
            "content": "Hyderabad's real estate market has been growing rapidly...",
            "author": "Ravi Kumar",
            "date": "2024-02-10",
            "category": "Buying Guide",
            "image": "https://res.cloudinary.com/dh0glzsnz/image/upload/houses/img2.jpg",
            "readTime": "7 min read"
        },
        {
            "_id": "3",
            "title": "Understanding Property Valuation in India",
            "description": "Learn how property valuation works and what factors affect it.",
            "content": "Property valuation is a critical step in any real estate transaction...",
            "author": "Anita Reddy",
            "date": "2024-03-05",
            "category": "Education",
            "image": "https://res.cloudinary.com/dh0glzsnz/image/upload/houses/img3.jpg",
            "readTime": "6 min read"
        },
        {
            "_id": "4",
            "title": "Rental Property Management Best Practices",
            "description": "Tips for managing rental properties effectively.",
            "content": "Managing rental properties can be challenging but rewarding...",
            "author": "Suresh Babu",
            "date": "2024-03-20",
            "category": "Management",
            "image": "https://res.cloudinary.com/dh0glzsnz/image/upload/houses/img4.jpg",
            "readTime": "8 min read"
        },
        {
            "_id": "5",
            "title": "The Future of Smart Homes in India",
            "description": "How technology is transforming the real estate sector.",
            "content": "Smart home technology is revolutionizing how we live...",
            "author": "Deepa Nair",
            "date": "2024-04-01",
            "category": "Technology",
            "image": "https://res.cloudinary.com/dh0glzsnz/image/upload/houses/img5.jpg",
            "readTime": "4 min read"
        },
    ]


@app.route("/blogs", methods=["GET"])
def list_blogs():
    blogs = BlogPost.query.order_by(BlogPost.id.asc()).all()
    return jsonify({"data": [_rewrite_media_urls(dict(b.payload)) for b in blogs]})


@app.route("/blogs/<blog_id>", methods=["GET"])
def get_blog(blog_id):
    blog = BlogPost.query.filter_by(external_id=str(blog_id)).first()
    if blog is None:
        return jsonify({"error": "Blog not found"}), 404
    return jsonify({"data": _rewrite_media_urls(dict(blog.payload))})


def _require_seed_token():
    expected = (os.environ.get("SEED_TOKEN") or "").strip()
    if not expected:
        return
    auth = request.headers.get("Authorization") or ""
    if auth.startswith("Bearer "):
        auth = auth[len("Bearer "):]
    if auth.strip() != expected:
        return Response("Unauthorized", status=401)


def _seed_media_from_public(include_videos: bool, include_images: bool, force: bool):
    inserted = 0
    updated = 0

    if include_videos and VIDEO_DIR.exists():
        for p in sorted(VIDEO_DIR.glob("property*.mp4")):
            key = f"assets/videos/{p.name}"
            existing = MediaBlob.query.filter_by(key=key).first()
            if existing is None:
                db.session.add(MediaBlob(key=key, mime_type="video/mp4", data=p.read_bytes()))
                inserted += 1
            elif force:
                existing.mime_type = "video/mp4"
                existing.data = p.read_bytes()
                updated += 1

    if include_images and HOUSES_DIR.exists():
        for p in sorted(HOUSES_DIR.glob("img*.jpg")):
            key = f"houses/{p.name}"
            existing = MediaBlob.query.filter_by(key=key).first()
            if existing is None:
                db.session.add(MediaBlob(key=key, mime_type="image/jpeg", data=p.read_bytes()))
                inserted += 1
            elif force:
                existing.mime_type = "image/jpeg"
                existing.data = p.read_bytes()
                updated += 1

    db.session.commit()
    return inserted, updated


@app.route("/media/<path:key>", methods=["GET"])
def get_media(key: str):
    blob = MediaBlob.query.filter_by(key=key).first()
    if blob is None:
        return jsonify({"error": "Media not found"}), 404

    data = blob.data
    size = len(data)
    range_header = request.headers.get("Range")
    if not range_header:
        return Response(data, mimetype=blob.mime_type, headers={"Content-Length": str(size)})

    try:
        units, spec = range_header.split("=", 1)
        if units.strip().lower() != "bytes":
            raise ValueError("unsupported units")
        start_s, end_s = (spec.split("-", 1) + [""])[:2]
        start = int(start_s) if start_s else 0
        end = int(end_s) if end_s else size - 1
        start = max(0, min(start, size - 1))
        end = max(start, min(end, size - 1))
    except Exception:
        return Response(status=416)

    chunk = data[start: end + 1]
    headers = {
        "Content-Range": f"bytes {start}-{end}/{size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(len(chunk)),
    }
    return Response(chunk, status=206, mimetype=blob.mime_type, headers=headers)


@app.route("/seed/video-categories", methods=["POST"])
def seed_video_categories():
    unauthorized = _require_seed_token()
    if unauthorized is not None:
        return unauthorized

    payload = request.get_json(silent=True)
    categories = payload if isinstance(payload, list) else VIDEO_CATEGORIES
    inserted = 0
    for c in categories:
        cid = c.get("id")
        name = c.get("name")
        if not cid or not name:
            continue
        existing = VideoCategory.query.filter_by(id=str(cid)).first()
        if existing is None:
            db.session.add(VideoCategory(id=str(cid), name=str(name), icon=str(c.get("icon") or "")))
            inserted += 1
    db.session.commit()
    return jsonify({"inserted": inserted})


@app.route("/seed/mock-properties", methods=["POST"])
def seed_mock_properties():
    unauthorized = _require_seed_token()
    if unauthorized is not None:
        return unauthorized

    items = request.get_json(silent=True)
    if not isinstance(items, list):
        items = _safe_json_load(MOCK_PROPERTIES_FILE, [])

    if not isinstance(items, list) or not items:
        return jsonify({"error": "No mock properties found to seed"}), 400

    inserted = 0
    updated = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        external_id = item.get("_id") or item.get("id")
        if external_id is None:
            continue
        external_id = str(external_id)

        item = _normalize_property_payload(dict(item))
        existing = Property.query.filter_by(external_id=external_id).first()
        if existing is None:
            db.session.add(Property(external_id=external_id, payload=item))
            inserted += 1
        else:
            existing.payload = item
            updated += 1

    db.session.commit()
    return jsonify({"inserted": inserted, "updated": updated, "total": inserted + updated})


# ✅ FIXED: seed_blogs now updates existing records with Cloudinary image URLs
@app.route("/seed/blogs", methods=["POST"])
def seed_blogs():
    unauthorized = _require_seed_token()
    if unauthorized is not None:
        return unauthorized

    items = request.get_json(silent=True)
    if not isinstance(items, list):
        items = load_blogs()

    if not items:
        items = load_mock_blogs()

    inserted = 0
    updated = 0
    for item in items:
        external_id = item.get("_id") or item.get("id")
        if external_id is None:
            continue
        external_id = str(external_id)
        existing = BlogPost.query.filter_by(external_id=external_id).first()
        if existing is None:
            db.session.add(BlogPost(external_id=external_id, payload=item))
            inserted += 1
        else:
            existing.payload = item
            updated += 1
    db.session.commit()
    return jsonify({"inserted": inserted, "updated": updated})


# ✅ FIXED: seed_videos now updates existing records with correct Cloudinary thumbnail URLs
@app.route("/seed/videos", methods=["POST"])
def seed_videos():
    unauthorized = _require_seed_token()
    if unauthorized is not None:
        return unauthorized

    items = request.get_json(silent=True)
    seeded_from_public = False
    if not isinstance(items, list):
        items = load_videos_from_public()
        seeded_from_public = True

    inserted = 0
    updated = 0
    for item in items:
        if seeded_from_public:
            vurl = item.get("videoUrl") or ""
            if isinstance(vurl, str) and vurl.startswith("/assets/videos/"):
                item["videoUrl"] = f"/media/{vurl.lstrip('/')}"

            thumb = item.get("thumbnail") or ""
            if isinstance(thumb, str) and thumb.startswith("/houses/"):
                item["thumbnail"] = f"/media/{thumb.lstrip('/')}"

        external_id = item.get("_id") or item.get("id")
        if external_id is None:
            continue
        external_id = str(external_id)

        property_id = item.get("propertyId") or item.get("property_id") or external_id
        category_id = item.get("type") or item.get("categoryId")

        existing = Video.query.filter_by(external_id=external_id).first()
        if existing is None:
            db.session.add(Video(
                external_id=external_id,
                property_external_id=str(property_id),
                category_id=str(category_id) if category_id else None,
                payload=item,
            ))
            inserted += 1
        else:
            existing.payload = item
            existing.property_external_id = str(property_id)
            existing.category_id = str(category_id) if category_id else None
            updated += 1

    db.session.commit()
    return jsonify({"inserted": inserted, "updated": updated})


@app.route("/seed/media", methods=["POST"])
def seed_media():
    unauthorized = _require_seed_token()
    if unauthorized is not None:
        return unauthorized

    items = request.get_json(silent=True)
    if isinstance(items, dict):
        items = [items]
    if not isinstance(items, list):
        return jsonify({"error": "Expected JSON object or list"}), 400

    inserted = 0
    for item in items:
        key = item.get("key")
        mime = item.get("mimeType") or item.get("mime_type") or "application/octet-stream"
        data_b64 = item.get("base64")
        if not key or not data_b64:
            continue
        if MediaBlob.query.filter_by(key=str(key)).first() is not None:
            continue
        raw = base64.b64decode(data_b64)
        db.session.add(MediaBlob(key=str(key), mime_type=str(mime), data=raw))
        inserted += 1
    db.session.commit()
    return jsonify({"inserted": inserted})


@app.route("/seed/media/from-public", methods=["POST"])
def seed_media_from_public():
    unauthorized = _require_seed_token()
    if unauthorized is not None:
        return unauthorized

    include_videos = str(request.args.get("videos") or "1") in {"1", "true", "yes"}
    include_images = str(request.args.get("images") or "1") in {"1", "true", "yes"}
    force = str(request.args.get("force") or "0") in {"1", "true", "yes"}
    inserted, updated = _seed_media_from_public(
        include_videos=include_videos, include_images=include_images, force=force
    )
    return jsonify(
        {
            "inserted": inserted,
            "updated": updated,
            "force": bool(force),
            "videos": bool(include_videos),
            "images": bool(include_images),
        }
    )


@app.route("/seed/ml", methods=["POST"])
def seed_ml_upload():
    unauthorized = _require_seed_token()
    if unauthorized is not None:
        return unauthorized

    item = request.get_json(silent=True) or {}
    key = item.get("key")
    data_b64 = item.get("base64")
    if not key or not data_b64:
        return jsonify({"error": "Expected JSON: {key, base64}"}), 400

    raw = base64.b64decode(data_b64)
    existing = MLArtifact.query.filter_by(key=str(key)).first()
    if existing is None:
        db.session.add(MLArtifact(key=str(key), data=raw))
    else:
        existing.data = raw
    db.session.commit()
    return jsonify({"saved": str(key)})


@app.route("/seed/ml/from-files", methods=["POST"])
def seed_ml_from_files():
    unauthorized = _require_seed_token()
    if unauthorized is not None:
        return unauthorized

    model_path = MODEL_DIR / "house_price_model.pkl"
    scaler_path = MODEL_DIR / "scaler.pkl"
    if not model_path.exists() or not scaler_path.exists():
        return jsonify({"error": f"Missing {model_path} or {scaler_path}"}), 400

    for p in [model_path, scaler_path]:
        raw = p.read_bytes()
        key = p.name
        existing = MLArtifact.query.filter_by(key=key).first()
        if existing is None:
            db.session.add(MLArtifact(key=key, data=raw))
        else:
            existing.data = raw
    db.session.commit()
    return jsonify({"seeded": ["house_price_model.pkl", "scaler.pkl"]})


# ✅ NEW: Download ML model from Hugging Face
@app.route("/seed/ml/from-gdrive", methods=["POST"])
def seed_ml_from_gdrive():
    unauthorized = _require_seed_token()
    if unauthorized is not None:
        return unauthorized
    try:
        # Download model
        model_url = "https://huggingface.co/Sravanisravs2125/real-estate-model/resolve/main/house_price_model.pkl"
        model_response = requests.get(model_url, stream=True, timeout=300)
        model_response.raise_for_status()
        model_data = b""
        for chunk in model_response.iter_content(chunk_size=65536):
            if chunk:
                model_data += chunk

        # Download scaler
        scaler_url = "https://huggingface.co/Sravanisravs2125/real-estate-model/resolve/main/scaler.pkl"
        scaler_response = requests.get(scaler_url, stream=True, timeout=300)
        scaler_response.raise_for_status()
        scaler_data = b""
        for chunk in scaler_response.iter_content(chunk_size=65536):
            if chunk:
                scaler_data += chunk

        # Save model to database
        existing_model = MLArtifact.query.filter_by(key="house_price_model.pkl").first()
        if existing_model is None:
            db.session.add(MLArtifact(key="house_price_model.pkl", data=model_data))
        else:
            existing_model.data = model_data

        # Save scaler to database
        existing_scaler = MLArtifact.query.filter_by(key="scaler.pkl").first()
        if existing_scaler is None:
            db.session.add(MLArtifact(key="scaler.pkl", data=scaler_data))
        else:
            existing_scaler.data = scaler_data

        db.session.commit()
        return jsonify({"status": "ok", "model_size": len(model_data), "scaler_size": len(scaler_data)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/ml/status", methods=["GET"])
def ml_status():
    ok = (
        MLArtifact.query.filter_by(key="house_price_model.pkl").first() is not None
        and MLArtifact.query.filter_by(key="scaler.pkl").first() is not None
    )
    return jsonify({"ok": bool(ok)})


@app.route("/seed/all", methods=["POST"])
def seed_all():
    unauthorized = _require_seed_token()
    if unauthorized is not None:
        return unauthorized

    include_media = str(request.args.get("includeMedia") or "0") in {"1", "true", "yes"}

    props = seed_mock_properties()
    cats = seed_video_categories()
    media = None
    if include_media:
        media = seed_media_from_public()
    videos = seed_videos()
    blogs = seed_blogs()
    ml = seed_ml_from_files()

    payload = {
        "properties": props.get_json(),
        "videoCategories": cats.get_json(),
        "videos": videos.get_json(),
        "blogs": blogs.get_json(),
        "ml": ml.get_json(),
    }
    if media is not None:
        payload["media"] = media.get_json()
    return jsonify(payload)


# ✅ FIXED: Production-ready server config
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
