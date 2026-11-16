
from fastapi import FastAPI
from pydantic import BaseModel, Field
from fastapi.staticfiles import StaticFiles
import pandas as pd
import joblib

# Load our trained anomaly detection model
model = joblib.load("cattlestock_anomaly_model.joblib")

# Create the API application
app = FastAPI(
    title="CattleStock Anomaly Detection API",
    description="Detects unusual synthetic or incoming cattle sensor readings.",
    version="1.0.0"
)

app.mount(
    "/frontend",
    StaticFiles(directory="frontend", html=True),
    name="frontend"
)

# Define the input format
class SensorReading(BaseModel):
    temperature_c: float = Field(..., description="Temperature in Celsius")
    activity: float = Field(..., description="Activity sensor value")


# Home endpoint
@app.get("/")
def home():
    return {
        "message": "CattleStock Anomaly Detection API is running"
    }


# Health check endpoint
@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": True}


# Prediction endpoint
@app.post("/predict")
def predict(reading: SensorReading):
    data = pd.DataFrame([{
        "temperature_c": reading.temperature_c,
        "activity": reading.activity
    }])

    prediction = model.predict(data)[0]

    if prediction == -1:
        status = "anomaly_detected"
        message = "Unusual sensor readings detected"
    else:
        status = "normal"
        message = "No anomaly detected"

    return {
        "temperature_c": reading.temperature_c,
        "activity": reading.activity,
        "status": status,
        "message": message
    }
