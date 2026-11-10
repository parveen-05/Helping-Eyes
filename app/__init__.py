from fastapi import FastAPI

app = FastAPI(
    title="Helping Eyes",
    description="An AI-powered assistive reading application",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "Welcome to Helping Eyes!",
        "status": "Application is running"
    }