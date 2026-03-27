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
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.exceptions import HTTPException
from sklearn.exceptions import InconsistentVersionWarning
from sqlalchemy import text

app = Flask(__name__)

# ✅ FIXED: Allow all origins (fixes mobile CORS issues)

# Bump this when predict response logic changes (helps frontend confirm backend restart)
PREDICT_API_VERSION = "2026-03-27-monotone-location-v2"

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')  # Change in production
jwt = JWTManager(app)


def _include_error_detail() -> bool:
    return str(os.environ.get("INCLUDE_ERROR_DETAIL") or "").strip() in {"1", "true", "yes"}


@app.errorhandler(Exception)
def handle_unexpected_error(e):
    if isinstance(e, HTTPException):
        payload = {"error": e.name}
        if e.description:
            payload["message"] = e.description
        return jsonify(payload), int(getattr(e, "code", 500) or 500)
    # Keep API responses actionable in production debugging (opt-in).
    app.logger.exception("Unhandled exception")
    payload = {"error": "Internal Server Error"}
    if _include_error_detail():
        payload["detail"] = str(e)
    return jsonify(payload), 500


@app.before_request
def handle_global_options():
    # Make CORS preflight succeed for all routes (mobile browsers can be stricter).
    if request.method == "OPTIONS":
        return Response(status=200)


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"

    requested_headers = request.headers.get("Access-Control-Request-Headers")
    response.headers["Access-Control-Allow-Headers"] = requested_headers or (
        "Content-Type, Authorization, Accept, Origin, X-Requested-With, "
        "X-CSRFToken, Cache-Control, Pragma"
    )
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    response.headers["Access-Control-Max-Age"] = "86400"
    return response


@app.route("/healthz", methods=["GET"])
def healthz():
    db_name = "unknown"
    db_ok = False
    pwd_len = None
    migrated = None
    try:
        db_name = db.engine.url.get_backend_name() or "unknown"
        db.session.execute(text("SELECT 1"))
        db_ok = True

        if db_name == "postgresql":
            pwd_len = (
                db.session.execute(
                    text(
                        "SELECT character_maximum_length "
                        "FROM information_schema.columns "
                        "WHERE table_schema='public' AND table_name='users' AND column_name='password_hash'"
                    )
                ).scalar()
            )
            if pwd_len is not None and int(pwd_len) < 255:
                try:
                    db.session.execute(
                        text("ALTER TABLE IF EXISTS users ALTER COLUMN password_hash TYPE VARCHAR(255)")
                    )
                    db.session.commit()
                    migrated = True
                    pwd_len = 255
                except Exception:
                    db.session.rollback()
                    migrated = False
    except Exception:
        db_ok = False

    payload = {"ok": True, "db": db_name, "db_ok": bool(db_ok)}
    if pwd_len is not None:
        payload["users_password_hash_len"] = int(pwd_len)
    if migrated is not None:
        payload["users_password_hash_migrated"] = bool(migrated)
    return jsonify(payload), 200


@app.route("/", methods=["GET"])
def index():
    return jsonify(
        {
            "service": "house_price_prediction backend",
            "status": "ok",
            "endpoints": {
                "health": "/healthz",
                "predict_get": "/predict",
                "predict_post": "/predict",
                "openapi": "/openapi.json",
                "apidocs": "/apidocs",
                "docs": "/docs",
            },
            "predict_payload_example": {
                "bedrooms": 3,
                "bathrooms": 2,
                "livingArea": 2000,
                "condition": 3,
                "schoolsNearby": 2,
                "location": "Beach Road",
            },
        }
    )


def _openapi_spec() -> dict:
    return {
        "openapi": "3.0.3",
        "info": {
            "title": "House Price Prediction API",
            "version": PREDICT_API_VERSION,
            "description": "Backend API for price prediction, breakdown, and health checks.",
        },
        "servers": [{"url": "/"}],
        "paths": {
            "/healthz": {
                "get": {
                    "summary": "Health check",
                    "responses": {
                        "200": {"description": "OK"},
                        "500": {"description": "DB not OK"},
                    },
                }
            },
            "/predict": {
                "get": {
                    "summary": "Predict endpoint help",
                    "responses": {"200": {"description": "Example payload"}},
                },
                "post": {
                    "summary": "Predict price",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": [
                                        "bedrooms",
                                        "bathrooms",
                                        "livingArea",
                                        "condition",
                                        "schoolsNearby",
                                    ],
                                    "properties": {
                                        "location": {"type": "string"},
                                        "bedrooms": {"type": "number"},
                                        "bathrooms": {"type": "number"},
                                        "livingArea": {"type": "number"},
                                        "condition": {"type": "number"},
                                        "schoolsNearby": {"type": "number"},
                                    },
                                }
                            }
                        },
                    },
                    "responses": {"200": {"description": "Prediction result"}},
                },
            },
        },
    }


@app.route("/openapi.json", methods=["GET"])
def openapi_json():
    return jsonify(_openapi_spec())


@app.route("/apidocs", methods=["GET"])
def apidocs():
    # Lightweight docs without extra dependencies.
    return Response(
        f"""
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Docs - House Price Prediction</title>
    <style>
      body {{ font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; }}
      code, pre {{ background: #0b1020; color: #e6e6e6; padding: 2px 6px; border-radius: 6px; }}
      pre {{ padding: 12px; overflow: auto; }}
      .row {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }}
      .card {{ border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }}
      input, select {{ width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #d1d5db; }}
      button {{ padding: 10px 14px; border-radius: 10px; border: 0; background: #2563eb; color: white; font-weight: 600; }}
      button:disabled {{ background: #9ca3af; }}
      .muted {{ color: #6b7280; }}
    </style>
  </head>
  <body>
    <h1>House Price Prediction API</h1>
    <p class="muted">Version: <b>{PREDICT_API_VERSION}</b></p>

    <div class="row">
      <div class="card">
        <h2>Endpoints</h2>
        <ul>
          <li><code>GET /</code> – this page index (JSON)</li>
          <li><code>GET /healthz</code> – health</li>
          <li><code>GET /predict</code> – payload help</li>
          <li><code>POST /predict</code> – prediction</li>
          <li><code>GET /openapi.json</code> – OpenAPI spec</li>
        </ul>
        <h3>Quick curl</h3>
        <pre>curl -X POST http://127.0.0.1:5000/predict -H "Content-Type: application/json" -d "{{\\"bedrooms\\":3,\\"bathrooms\\":2,\\"livingArea\\":2000,\\"condition\\":3,\\"schoolsNearby\\":2,\\"location\\":\\"Beach Road\\"}}"</pre>
      </div>

      <div class="card">
        <h2>Try /predict</h2>
        <div style="display:grid; gap: 10px;">
          <label>Location <input id="loc" value="Beach Road" /></label>
          <label>Bedrooms <input id="bed" type="number" value="3" min="1" max="10" /></label>
          <label>Bathrooms <input id="bath" type="number" value="2" min="1" max="10" step="0.5" /></label>
          <label>Living Area <input id="area" type="number" value="2000" min="500" max="10000" step="100" /></label>
          <label>Condition <input id="cond" type="number" value="3" min="1" max="5" /></label>
          <label>Schools Nearby <input id="schools" type="number" value="2" min="0" max="10" /></label>
          <button id="btn">Predict</button>
        </div>
        <h3>Response</h3>
        <pre id="out">{{}}</pre>
      </div>
    </div>

    <script>
      const $ = (id) => document.getElementById(id);
      $("btn").addEventListener("click", async () => {{
        $("btn").disabled = true;
        $("out").textContent = "Loading...";
        try {{
          const payload = {{
            location: $("loc").value,
            bedrooms: Number($("bed").value),
            bathrooms: Number($("bath").value),
            livingArea: Number($("area").value),
            condition: Number($("cond").value),
            schoolsNearby: Number($("schools").value),
          }};
          const res = await fetch("/predict", {{
            method: "POST",
            headers: {{ "Content-Type": "application/json" }},
            body: JSON.stringify(payload),
          }});
          const text = await res.text();
          try {{
            $("out").textContent = JSON.stringify(JSON.parse(text), null, 2);
          }} catch {{
            $("out").textContent = text;
          }}
        }} catch (e) {{
          $("out").textContent = String(e);
        }} finally {{
          $("btn").disabled = false;
        }}
      }});
    </script>
  </body>
</html>
""".strip(),
        mimetype="text/html",
    )


@app.route("/docs", methods=["GET"])
def docs():
    # FastAPI-like docs (Swagger UI). Uses CDN assets (internet required in the browser).
    return Response(
        """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Docs - House Price Prediction</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
      });
    </script>
  </body>
</html>
""".strip(),
        mimetype="text/html",
    )

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

    # Lightweight migration: widen password_hash column if needed (Postgres).
    if not app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite:"):
        try:
            db.session.execute(
                text("ALTER TABLE IF EXISTS users ALTER COLUMN password_hash TYPE VARCHAR(255)")
            )
            db.session.commit()
        except Exception:
            db.session.rollback()
            app.logger.exception("Failed to migrate users.password_hash to VARCHAR(255)")


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
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
    file_model = MODEL_DIR / "house_price_model.pkl"
    file_scaler = MODEL_DIR / "scaler.pkl"

    force_files = str(os.environ.get("FORCE_FILE_ARTIFACTS") or "").strip().lower() in {
        "1",
        "true",
        "yes",
    }

    disk_available = file_model.exists() and file_scaler.exists()
    db_available = artifact_model is not None and artifact_scaler is not None

    prefer_disk = force_files
    if disk_available and db_available and not force_files:
        try:
            disk_time = max(
                datetime.utcfromtimestamp(file_model.stat().st_mtime),
                datetime.utcfromtimestamp(file_scaler.stat().st_mtime),
            )
            db_time = min(artifact_model.created_at, artifact_scaler.created_at)
            prefer_disk = disk_time > db_time
        except Exception:
            prefer_disk = False

    if prefer_disk and disk_available:
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always", InconsistentVersionWarning)
            with open(file_model, "rb") as f:
                model = pickle.load(f)
            with open(file_scaler, "rb") as f:
                scaler = pickle.load(f)

        if any(isinstance(w.message, InconsistentVersionWarning) for w in caught):
            meta = _safe_json_load(MODEL_METADATA_FILE, {})
            trained_with = meta.get("sklearn_version", "unknown")
            raise RuntimeError(
                "Model artifacts were created with a different scikit-learn version. "
                f"Runtime sklearn={sklearn.__version__}, model sklearn={trained_with}. "
                f"Regenerate pickles: python {BASE_DIR / 'train_and_export.py'}"
            )

        return model, scaler

    if db_available:
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

    if disk_available:
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always", InconsistentVersionWarning)
            with open(file_model, "rb") as f:
                model = pickle.load(f)
            with open(file_scaler, "rb") as f:
                scaler = pickle.load(f)

        if any(isinstance(w.message, InconsistentVersionWarning) for w in caught):
            meta = _safe_json_load(MODEL_METADATA_FILE, {})
            trained_with = meta.get("sklearn_version", "unknown")
            raise RuntimeError(
                "Model artifacts were created with a different scikit-learn version. "
                f"Runtime sklearn={sklearn.__version__}, model sklearn={trained_with}. "
                f"Regenerate pickles: python {BASE_DIR / 'train_and_export.py'}"
            )

        return model, scaler

    raise FileNotFoundError(
        "Missing ML artifacts in database and on disk. "
        "Generate them: python backend/train_and_export.py "
        "Then seed DB: POST /seed/ml/from-files (local) or upload via POST /seed/ml."
    )


def _inr_breakdown(amount) -> dict:
    value = int(round(float(amount or 0)))
    crores, remainder = divmod(value, 10_000_000)
    lakhs, remainder = divmod(remainder, 100_000)
    thousands, rupees = divmod(remainder, 1_000)
    return {
        "crores": crores,
        "lakhs": lakhs,
        "thousands": thousands,
        "rupees": rupees,
    }


def _format_inr(amount) -> str:
    value = int(round(float(amount or 0)))
    sign = "-" if value < 0 else ""
    digits = str(abs(value))
    if len(digits) <= 3:
        return f"{sign}\u20B9{digits}"

    last3 = digits[-3:]
    rest = digits[:-3]
    parts = []
    while len(rest) > 2:
        parts.append(rest[-2:])
        rest = rest[:-2]
    if rest:
        parts.append(rest)
    parts.reverse()
    return f"{sign}\u20B9{','.join(parts)},{last3}"


_COST_BREAKDOWN_WEIGHTS = [
    ("Land Cost", 0.50),
    ("Construction Cost", 0.30),
    ("Registration Charges", 0.06),
    ("Interior", 0.08),
    ("Utilities", 0.02),
    ("Amenities", 0.03),
]

_LOCATION_PREMIUM_MULTIPLIERS = {
    "Beach Road": 1.25,
    "Lawson's Bay Colony": 1.22,
    "Waltair Uplands": 1.20,
    "Rushikonda Hills": 1.18,
    "MVP Colony": 1.15,
    "Dwaraka Nagar": 1.12,
    "Seethammadhara": 1.10,
    "Maharanipeta": 1.08,
    "Madhurawada": 1.06,
    "Yendada": 1.06,
    "PM Palem": 1.05,
    "Kommadi": 1.04,
    "Hanumanthawaka": 1.03,
    "Isukathota": 1.03,
    "Arilova": 1.02,
    "Marripalem": 1.01,
    "Bheemunipatnam": 1.04,
    "Simhachalam": 0.98,
    "Pendurthi": 0.97,
    "Gopalapatnam": 0.97,
    "Gajuwaka": 0.95,
    "Steel Plant Township": 0.96,
    "Thatichetlapalem": 0.99,
}


def _normalize_location(value) -> str:
    return " ".join(str(value or "").strip().split())


def _location_multiplier(location: str) -> float:
    loc = _normalize_location(location)
    if not loc:
        return 1.0
    if loc in _LOCATION_PREMIUM_MULTIPLIERS:
        return float(_LOCATION_PREMIUM_MULTIPLIERS[loc])
    for k, v in _LOCATION_PREMIUM_MULTIPLIERS.items():
        if k.lower() == loc.lower():
            return float(v)
    return 1.0


_STRICT_PREMIUMS = {
    "per_bedroom": 10_000,
    "per_bathroom": 7_000,
    "per_sqft_over_500": 20,
    "per_condition_step": 25_000,
    "per_school": 5_000,
}


def _strict_increase_adjustment(bedrooms, bathrooms, living_area, condition, schools_nearby, loc_multiplier: float) -> int:
    """
    Adds a small, always-positive premium per feature so the final displayed price
    strictly increases when any of these inputs increase (holding others constant).
    """
    b = max(1, int(round(float(bedrooms))))
    ba = max(1.0, float(bathrooms))
    la = max(0, int(round(float(living_area))))
    c = max(1, int(round(float(condition))))
    sn = max(0, int(round(float(schools_nearby))))

    adj = 0.0
    adj += (b - 1) * float(_STRICT_PREMIUMS["per_bedroom"])
    adj += (ba - 1.0) * float(_STRICT_PREMIUMS["per_bathroom"])
    adj += max(0, la - 500) * float(_STRICT_PREMIUMS["per_sqft_over_500"])
    adj += (c - 1) * float(_STRICT_PREMIUMS["per_condition_step"])
    adj += sn * float(_STRICT_PREMIUMS["per_school"])

    adj *= float(loc_multiplier or 1.0)
    return int(round(adj))


def _monotone_max_prediction(
    m,
    s,
    bedrooms,
    bathrooms,
    living_area,
    condition,
    schools_nearby,
    location_multiplier: float | None = None,
) -> tuple[float, int]:
    """
    Enforce monotonicity (non-decreasing) w.r.t. all input features by taking
    the maximum model prediction over a hyper-rectangle of points where each
    feature is <= the requested feature.

    Returns (max_prediction, evaluated_points_count).
    """
    b = int(round(float(bedrooms)))
    ba = float(bathrooms)
    la = int(round(float(living_area)))
    c = int(round(float(condition)))
    sn = int(round(float(schools_nearby)))

    b = max(1, min(10, b))
    ba = max(1.0, min(10.0, ba))
    la = max(500, min(10000, la))
    c = max(1, min(5, c))
    sn = max(0, min(10, sn))

    bedroom_vals = np.arange(1, b + 1, 1, dtype=float)

    bath_step = 0.5 if abs(ba - round(ba)) > 1e-9 else 1.0
    bathroom_vals = np.arange(1.0, ba + 1e-9, bath_step, dtype=float)
    if bathroom_vals.size == 0 or abs(float(bathroom_vals[-1]) - ba) > 1e-9:
        bathroom_vals = np.unique(np.append(bathroom_vals, ba))

    area_step = 250
    living_vals = np.arange(500, la + 1, area_step, dtype=float)
    if living_vals.size == 0 or int(round(float(living_vals[-1]))) != la:
        living_vals = np.unique(np.append(living_vals, float(la)))

    condition_vals = np.arange(1, c + 1, 1, dtype=float)
    schools_vals = np.arange(0, sn + 1, 1, dtype=float)

    grids = np.meshgrid(
        bedroom_vals, bathroom_vals, living_vals, condition_vals, schools_vals, indexing="ij"
    )
    combos = np.stack([g.ravel() for g in grids], axis=1)
    if combos.size == 0:
        combos = np.array([[b, ba, la, c, sn]], dtype=float)

    if location_multiplier is not None:
        lm = float(location_multiplier)
        combos = np.hstack([combos, np.full((combos.shape[0], 1), lm, dtype=float)])

    scaled = s.transform(combos)
    preds = m.predict(scaled)
    return float(np.max(preds)), int(preds.shape[0])


def _allocate_cost_breakdown(total_amount) -> list[dict]:
    total = int(round(float(total_amount or 0)))
    if total < 0:
        total = 0

    items = []
    allocated = 0
    for label, weight in _COST_BREAKDOWN_WEIGHTS:
        amount = int(round(total * float(weight)))
        allocated += amount
        items.append({"component": label, "amount": amount, "formatted": _format_inr(amount)})

    misc_amount = max(0, total - allocated)
    items.append(
        {"component": "Miscellaneous", "amount": misc_amount, "formatted": _format_inr(misc_amount)}
    )
    return items


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

@app.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return Response(status=200)
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


@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return Response(status=200)
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


@app.route("/me", methods=["GET", "OPTIONS"])
@jwt_required()
def me():
    if request.method == "OPTIONS":
        return Response(status=200)
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
        location = data.get("location") or ""

        expected_features = int(getattr(s, "n_features_in_", 5) or 5)
        loc_multiplier = _location_multiplier(location)

        # 5-feature scaler: legacy model (location applied as post-multiplier)
        # 6-feature scaler: model includes `location_multiplier` as a feature (no extra post-multiplier)
        uses_location_feature = expected_features >= 6

        base_vector = [
            float(data["bedrooms"]),
            float(data["bathrooms"]),
            float(data["livingArea"]),
            float(data["condition"]),
            float(data["schoolsNearby"]),
        ]
        if uses_location_feature:
            base_vector.append(float(loc_multiplier))

        features = np.array([base_vector], dtype=float)
        scaled_features = s.transform(features)
        raw_prediction = float(m.predict(scaled_features)[0])

        monotone_prediction, evaluated_points = _monotone_max_prediction(
            m,
            s,
            data["bedrooms"],
            data["bathrooms"],
            data["livingArea"],
            data["condition"],
            data["schoolsNearby"],
            loc_multiplier if uses_location_feature else None,
        )
        base_predicted_price = int(round(monotone_prediction * 9))

        if uses_location_feature:
            predicted_price = base_predicted_price
            source = "ml+location-feature"
        else:
            predicted_price = int(round(base_predicted_price * float(loc_multiplier)))
            source = "ml+legacy"

        strict_adj = _strict_increase_adjustment(
            data["bedrooms"],
            data["bathrooms"],
            data["livingArea"],
            data["condition"],
            data["schoolsNearby"],
            loc_multiplier,
        )
        final_predicted_price = int(round(predicted_price + strict_adj))

        return jsonify(
            {
                "source": source,
                "api_version": PREDICT_API_VERSION,
                "raw_prediction": raw_prediction,
                "raw_predicted_price": int(round(raw_prediction * 9)),
                "monotone_prediction": monotone_prediction,
                "monotone_points_evaluated": evaluated_points,
                "predicted_price_ml": predicted_price,
                "predicted_price_ml_formatted": _format_inr(predicted_price),
                "strict_increase_adjustment": strict_adj,
                "predicted_price": final_predicted_price,
                "predicted_price_formatted": _format_inr(final_predicted_price),
                "price_breakdown": _inr_breakdown(final_predicted_price),
                "cost_breakdown": _allocate_cost_breakdown(final_predicted_price),
                "total_cost": final_predicted_price,
                "total_cost_formatted": _format_inr(final_predicted_price),
                "base_predicted_price": base_predicted_price,
                "base_predicted_price_formatted": _format_inr(base_predicted_price),
                "location": _normalize_location(location),
                "location_multiplier": loc_multiplier,
            }
        )
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
