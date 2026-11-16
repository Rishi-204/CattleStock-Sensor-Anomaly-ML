
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# SQLite database location
DATABASE_URL = "sqlite:///./cattlestock.db"

# Create database engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Create database session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for database tables
Base = declarative_base()


# Sensor readings table
class SensorRecord(Base):
    __tablename__ = "sensor_records"

    id = Column(Integer, primary_key=True, index=True)

    cattle_id = Column(String, default="DEMO-001")

    temperature_c = Column(Float, nullable=False)

    activity = Column(Float, nullable=False)

    status = Column(String, nullable=False)

    message = Column(String)

    timestamp = Column(DateTime, default=datetime.utcnow)


# Create database tables
def create_tables():
    Base.metadata.create_all(bind=engine)
