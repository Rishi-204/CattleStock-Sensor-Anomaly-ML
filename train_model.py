
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report

# 1. Generate sample cattle sensor data
rng = np.random.default_rng(42)


def generate_data(n, add_anomalies=False):
    temperature = rng.normal(38.5, 0.25, n)
    activity = rng.normal(10.0, 1.5, n)
    labels = np.zeros(n, dtype=int)

    # Add unusual readings for software testing
    if add_anomalies:
        indices = rng.choice(n, size=n // 5, replace=False)
        temperature[indices] += rng.choice(
            [-2.5, 2.5], size=len(indices)
        )
        activity[indices] += rng.choice(
            [-8.0, 8.0], size=len(indices)
        )
        labels[indices] = 1

    return pd.DataFrame({
        "temperature_c": temperature,
        "activity": activity,
        "test_label": labels
    })


# 2. Create training and testing data
train_data = generate_data(1000)
test_data = generate_data(300, add_anomalies=True)

features = ["temperature_c", "activity"]

# 3. Train the anomaly detection model
model = IsolationForest(
    n_estimators=100,
    contamination="auto",
    random_state=42
)

model.fit(train_data[features])

# 4. Predict unusual readings
predictions = model.predict(test_data[features])

# Isolation Forest: -1 means anomaly, 1 means normal
test_data["prediction"] = (predictions == -1).astype(int)

# 5. Display sample results
print("\n--- CattleStock Anomaly Detection ---")
print(test_data.head(10).to_string(index=False))

print("\n--- Synthetic Test Evaluation ---")
print(classification_report(
    test_data["test_label"],
    test_data["prediction"],
    target_names=["Normal", "Injected anomaly"],
    zero_division=0
))

# 6. Save the trained model
import joblib

joblib.dump(model, "cattlestock_anomaly_model.joblib")
print("Model saved as cattlestock_anomaly_model.joblib")
