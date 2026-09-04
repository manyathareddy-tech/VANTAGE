from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes import auth, dashboard, forecast, inventory, suggestions, upload, chatbot

init_db()
app = FastAPI(title="VANTAGE Backend", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(dashboard.router)
app.include_router(forecast.router)
app.include_router(inventory.router)
app.include_router(suggestions.router)
app.include_router(chatbot.router)


@app.get("/health")
def health():
    return {"status": "ok"}
