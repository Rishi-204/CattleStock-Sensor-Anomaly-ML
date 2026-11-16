
from fastapi import FastAPI, Query
from pydantic import BaseModel, Field
from fastapi.staticfiles import StaticFiles
from sqlalchemy import desc
import pandas as pd
import joblib

from database import SessionLocal, SensorRecord, create_tables


# Load trained anomaly detection model
model = joblib.load("cattlestock_anomaly_model.joblib")

# Create database tables if they do not exist
create_tables()

# Create FastAPI application
app = FastAPI(
    title="CattleStock Anomaly Detection API",
    description="Detects unusual cattle sensor readings and stores predictions.",
    version="1.1.0"
)

# Serve frontend
app.mount(
    "/frontend",
    StaticFiles(directory="frontend", html=True),
    name="frontend"
)


# Define incoming sensor data
class SensorReading(BaseModel):
    cattle_id: str = Field(
        default="DEMO-001",
        description="Unique cattle identification"
    )
    temperature_c: float = Field(
        ...,
        description="Temperature in Celsius"
    )
    activity: float = Field(
        ...,
        description="Activity sensor value"
    )


# Home endpoint
@app.get("/")
def home():
    return {
        "message": "CattleStock Anomaly Detection API is running"
    }


# Health check endpoint
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": True,
        "database": "connected"
    }


# Prediction endpoint with database storage
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

    # Save prediction to SQLite
    db = SessionLocal()

    try:
        new_record = SensorRecord(
            cattle_id=reading.cattle_id,
            temperature_c=reading.temperature_c,
            activity=reading.activity,
            status=status,
            message=message
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        return {
            "record_id": new_record.id,
            "cattle_id": new_record.cattle_id,
            "temperature_c": new_record.temperature_c,
            "activity": new_record.activity,
            "status": new_record.status,
            "message": new_record.message,
            "timestamp": new_record.timestamp.isoformat()
        }

    finally:
        db.close()


# Retrieve saved sensor readings
@app.get("/records")
def get_records(
    limit: int = Query(default=100, ge=1, le=500)
):

    db = SessionLocal()

    try:
        records = (
            db.query(SensorRecord)
            .order_by(desc(SensorRecord.timestamp), desc(SensorRecord.id))
            .limit(limit)
            .all()
        )

        return {
            "total": len(records),
            "records": [
                {
                    "id": record.id,
                    "cattle_id": record.cattle_id,
                    "temperature_c": record.temperature_c,
                    "activity": record.activity,
                    "status": record.status,
                    "message": record.message,
                    "timestamp": (
                        record.timestamp.isoformat()
                        if record.timestamp else None
                    )
                }
                for record in records
            ]
        }

    finally:
        db.close()
