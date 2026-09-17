# SatQuery AI — Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SatQuery AI System                                │
│                                                                          │
│  ┌──────────────┐     ┌──────────────────────┐     ┌─────────────────┐ │
│  │  React + Vite │     │  Spring Boot Gateway  │     │  FastAPI Python  │ │
│  │  Port: 5173   │────►│  Port: 8080           │────►│  Port: 8000     │ │
│  │  (Frontend)   │     │  /api/v1/** proxy     │     │  (Orchestrator) │ │
│  └──────────────┘     └──────────────────────┘     └────────┬────────┘ │
│                                                              │           │
│                              ┌───────────────────────────────┤           │
│                              │                               │           │
│                    ┌─────────▼──────┐  ┌────────────┐  ┌───▼──────────┐│
│                    │   MongoDB       │  │   Redis     │  │   MinIO      ││
│                    │   Port: 27017   │  │   Port:6379 │  │   Port:9000  ││
│                    │   Query logs    │  │   Task cache│  │   Images     ││
│                    └────────────────┘  └────────────┘  └──────────────┘│
│                                                                          │
│                              ┌──────────────────────────────────────┐   │
│                              │  Cloud GPU Dispatcher (optional)      │   │
│                              │  → Google Colab / Kaggle ngrok tunnel │   │
│                              │  → Falls back to local PyTorch models │   │
│                              └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Port | Responsibility |
|---|---|---|
| React + Vite | 5173 | UI: file dropzone, query input, results display |
| Spring Boot Gateway | 8080 | Lightweight proxy, CORS, request forwarding |
| FastAPI Orchestrator | 8000 | Business logic, routing, storage integration |
| MongoDB | 27017 | Query logs, execution history, spatial annotations |
| Redis | 6379 | Task cache (TTL 1h), session state |
| MinIO | 9000/9001 | Raw image storage, visual output persistence |

---

## Quick Start — Full Pipeline

### Prerequisites
- Docker Desktop (for MongoDB/Redis/MinIO)
- Java 17+ + Maven (for Spring Boot Gateway)
- Python 3.10+ (for FastAPI backend)
- Node.js 18+ (for frontend)

---

### Step 1: Start Storage Services (Docker)

```bash
cd sih_SatQuery
docker compose up -d
```

Verify services are running:
```
docker compose ps
```

Access MinIO console: http://localhost:9001  
(Login: `satquery_minio` / `satquery_minio_secret`)

---

### Step 2: Install Python Dependencies

```bash
# From sih_SatQuery/ root
pip install -r backend/requirements.txt
```

---

### Step 3: Start Python FastAPI Backend (Port 8000)

```bash
# Option A: Direct uvicorn (stable)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

# Option B: With hot reload (development)
npm run dev:backend:reload
```

Verify: http://localhost:8000/api/health

Expected response includes storage status:
```json
{
  "device": "cpu",
  "models": {...},
  "storage": {
    "redis":   "connected",
    "mongodb": "connected",
    "minio":   "connected",
    "cloudGpu": "mock_mode"
  }
}
```

---

### Step 4: Start Spring Boot API Gateway (Port 8080)

```bash
# Requires Java 17+ and Maven
npm run dev:gateway

# Or directly:
cd gateway-service
mvn spring-boot:run
```

Verify gateway: http://localhost:8080/gateway/health

---

### Step 5: Start React Frontend (Port 5173)

```bash
npm run dev:frontend
```

Open: http://localhost:5173

---

## Without Spring Boot (Simplified Mode)

If you don't have Java/Maven, you can bypass the gateway by changing your `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Then update `src/services/api.js` to use `/api/analyze` instead of `/api/v1/analyze`.

---

## New API Endpoints (v1)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/analyze` | Unified analysis (all query types) |
| `POST` | `/api/v1/upload` | Upload image to MinIO |
| `GET` | `/api/v1/history` | Recent query logs from MongoDB |
| `GET` | `/api/v1/status/{task_id}` | Task status from Redis |
| `GET` | `/api/v1/storage-status` | Storage service health |
| `GET` | `/api/health` | Full system health check |

---

## Cloud GPU Setup (Colab / Kaggle)

### On your Colab/Kaggle notebook:

```python
# Cell 1: Install dependencies
!pip install fastapi uvicorn pyngrok pillow torch torchvision

# Cell 2: Create the inference server
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
from pyngrok import ngrok
import threading

app = FastAPI()

@app.post("/infer")
async def infer(request: Request):
    payload = await request.json()
    # Load your model here and run inference
    # payload keys: image_url, image2_url, query, task_type, task_id
    result = your_model.infer(payload)
    return result

# Cell 3: Start the tunnel
public_url = ngrok.connect(8000)
print(f"CLOUD_GPU_ENDPOINT={public_url}")

# Start server in background
thread = threading.Thread(target=lambda: uvicorn.run(app, host="0.0.0.0", port=8000))
thread.start()
```

### On your local machine:

```bash
# Add to .env:
CLOUD_GPU_ENDPOINT=https://xxxx.ngrok.io

# Restart backend:
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

When `CLOUD_GPU_ENDPOINT` is empty (default), the system automatically uses **mock responses** — the frontend works immediately without any GPU.

---

## Storage Data Flow

```
User uploads image
    │
    ├─► MinIO (satquery-imagery bucket) ← raw image stored
    │
    └─► FastAPI /api/v1/analyze
            │
            ├─► CloudDispatcher (CLOUD_GPU_ENDPOINT set?)
            │       ├── YES → POST to Colab/Kaggle /infer
            │       └── NO  → Mock response returned
            │
            ├─► Redis: cache result (TTL 1 hour)
            ├─► MongoDB: log query + execution trace
            └─► Response → Spring Boot → React UI
```

---

## File Structure

```
sih_SatQuery/
├── docker-compose.yml          ← MongoDB + Redis + MinIO
├── docker/
│   └── mongo-init.js           ← MongoDB initial schema + indexes
├── gateway-service/            ← Spring Boot API Gateway (Java)
│   ├── pom.xml
│   └── src/main/java/com/satquery/gateway/
│       ├── GatewayApplication.java
│       ├── config/GatewayConfig.java     ← CORS + RestTemplate
│       └── controller/ProxyController.java ← Proxy all /api/**
├── backend/                    ← Python FastAPI Orchestrator
│   ├── main.py                 ← App entrypoint (port 8000)
│   ├── config.py               ← All env var config
│   ├── routes/
│   │   ├── v1_routes.py        ← NEW: /api/v1/* hybrid routes
│   │   ├── analyze_routes.py   ← Legacy /api/analyze (preserved)
│   │   ├── change_routes.py
│   │   └── vlm_routes.py
│   ├── storage/
│   │   ├── minio_client.py     ← NEW: MinIO upload/download
│   │   ├── mongo_client.py     ← NEW: Query log persistence
│   │   └── redis_client.py     ← NEW: Result cache + task status
│   └── services/
│       └── cloud_dispatcher.py ← NEW: Colab/Kaggle bridge
└── src/                        ← React + Vite Frontend
    └── services/
        └── api.js              ← Updated: v1 endpoints + upload
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Backend Unavailable` in UI | Start Python backend: `npm run dev:backend` |
| `MinIO not available` warning | Run `docker compose up -d` |
| `MongoDB not available` warning | Run `docker compose up -d` |
| `Redis not available` warning | Run `docker compose up -d` |
| Models not loading | Verify `.pth` files exist in `C:\Users\User\Downloads\SIH\` |
| CORS errors | Ensure Gateway is on 8080 and `.env` `VITE_API_BASE_URL=http://localhost:8080` |
| Java not found for Gateway | Install JDK 17+: https://adoptium.net or skip Gateway (see Simplified Mode) |
