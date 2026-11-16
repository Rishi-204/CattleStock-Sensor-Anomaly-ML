
import joblib
import pandas as pd

# Load the trained model
model = joblib.load("cattlestock_anomaly_model.joblib")

print("=== CattleStock Sensor Anomaly Detector ===")

try:
    temperature = float(input("Enter temperature (°C): "))
    activity = float(input("Enter activity value: "))

    # Prepare the readings in the same format used during training
    readings = pd.DataFrame([{
        "temperature_c": temperature,
        "activity": activity
    }])

    # Predict
    result = model.predict(readings)[0]

    if result == -1:
        print("\nALERT: Unusual sensor readings detected!")
    else:
        print("\nStatus: No anomaly detected.")

    print(f"Temperature: {temperature} °C")
    print(f"Activity: {activity}")

except ValueError:
    print("Invalid input. Please enter numerical values.")
