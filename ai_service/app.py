from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import os

app = FastAPI()

# Load the model
# Using absolute path logic in case it's run from different directories
model_path = os.path.join(os.path.dirname(__file__), "models", "waste_model.pkl")

# If the model isn't built yet, we mock for now safely so uvicorn doesn't crash on boot
if os.path.exists(model_path):
    model = joblib.load(model_path)
    print(f"Loaded model from {model_path}")
else:
    model = None
    print(f"Warning: Model not found at {model_path}. Please run train_model.py first.")

class PredictionInput(BaseModel):
    reports: int
    temp: float
    day: int
    hour: int

@app.post("/predict-waste")
def predict(data: PredictionInput):
    if model is None:
        return {"error": "Model not loaded. Train the model first."}
    
    values = [
        data.reports,
        data.temp,
        data.day,
        data.hour
    ]
    
    # Predict takes a 2D array: [[col1, col2, col3, col4]]
    prediction = model.predict([values])
    
    return {
        "prediction": float(prediction[0])
    }
