import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import RandomForestRegressor

# --- 1. Generate Synthetic Data ---
# We want to create relationships: 
# - More reports = slightly more waste
# - Higher temp = more waste
# - Weekends (day 5, 6) = much more waste
# - Evenings (hour 16-20) = more waste than mornings

np.random.seed(42)
n_samples = 1000

reports = np.random.randint(0, 50, n_samples)
temp = np.random.uniform(15.0, 35.0, n_samples)
day = np.random.randint(0, 7, n_samples)
hour = np.random.randint(0, 24, n_samples)

# Baseline waste
waste = 50.0 + (reports * 0.8) + (temp * 1.5)

# Weekend multiplier
weekend_mask = (day == 5) | (day == 6)
waste[weekend_mask] *= 1.4

# Hour multiplier (peak around 18:00)
def hour_multiplier(h):
    # standard deviation from 18, the closer to 18 the higher
    return 1.0 + 0.3 * np.exp(-0.5 * ((h - 18) / 3)**2)

for i in range(n_samples):
    waste[i] *= hour_multiplier(hour[i])

# Add some noise
waste += np.random.normal(0, 5, n_samples)

data = pd.DataFrame({
    'reports': reports,
    'temp': temp,
    'day': day,
    'hour': hour,
    'waste': waste
})

os.makedirs('data', exist_ok=True)
data.to_csv('data/waste_data.csv', index=False)
print("Saved synthesized historical data to data/waste_data.csv")

# --- 2. Train Model ---
X = data[['reports', 'temp', 'day', 'hour']]
y = data['waste']

print("Training Random Forest Regressor...")
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

# --- 3. Save Model ---
os.makedirs('models', exist_ok=True)
model_path = 'models/waste_model.pkl'
joblib.dump(model, model_path)
print(f"Model successfully saved to {model_path}")
