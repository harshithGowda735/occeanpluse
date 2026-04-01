# Hackathon Project

Team Name: EcoSort

## Problem Statement
The world's oceans are facing unprecedented levels of pollution, primarily due to inefficient waste management systems and lack of real-time monitoring. Improper disposal of plastic, organic, and hazardous waste leads to environmental degradation and health crises for marine life and coastal communities.

## Solution
EcoSort (OceanMind+) is an AI-powered smart waste management and ocean preservation platform. Our solution includes:
- **AI Waste Scanner**: Instant material identification and disposal guidance using Google Gemini 1.5 Flash.
- **Dynamic Command Center**: Real-time analytics on waste collection, recycling rates, and environmental health.
- **Pollution Monitoring**: Use of AI to analyze satellite/drone imagery for ocean pollution hotspots.
- **Smart Logistics**: Optimized routing for waste collection trucks based on bin fill levels.
- **Gamification**: Rewards and leaderboard systems to encourage community participation in ocean cleanup.

## Tech Stack
- **Frontend**: React, Vite, Leaflet (Maps), Chart.js, Recharts, Motion (Animations)
- **Backend**: Node.js, Express, tsx, Resend (Email Notifications)
- **Database**: MongoDB (Central Data), Firebase (Auth & Firestore)
- **AI Integration**: Google Gemini SDK (Gemini 2.0 Flash)

## How to Run
1. **Clone the Project**:
   ```bash
   git clone [your-repo-link]
   cd hack-main
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Set Environment Variables**:
   Create a `.env` file in the root directory and add:
   ```env
   GEMINI_API_KEY=your_google_ai_key
   MONGODB_URI=your_mongodb_connection_string
   RESEND_API_KEY=your_resend_api_key
   ```
4. **Run Locally**:
   ```bash
   npm run dev
   ```
   The backend will start on port 3000 and the Vite frontend will be available at [http://localhost:3000](http://localhost:3000).
