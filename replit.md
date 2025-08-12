# Voice-Enabled Rap Battle Game

A real-time rap battle application using Groq's speech recognition, AI language models, and Typecast.ai text-to-speech for immersive voice battles against AI opponents.

## Project Architecture

### Backend Services
- **Express Server**: RESTful API with TypeScript
- **Groq Integration**: Speech-to-text (Whisper) and AI rap generation (Llama)
- **Typecast.ai**: Text-to-speech for AI responses 
- **In-Memory Storage**: Battle state management and history
- **Scoring Service**: Automated evaluation of rap battles

### Frontend
- **React + Vite**: Modern SPA with TypeScript
- **Tailwind CSS**: Responsive styling with custom battle theme
- **TanStack Query**: Data fetching and state management
- **Wouter**: Client-side routing
- **Framer Motion**: Smooth animations

### Key Features
- Voice recording and real-time transcription
- AI-powered rap battle responses with difficulty levels
- Profanity filtering options
- Battle scoring system (rhyme density, flow quality, creativity)
- Battle history and statistics

## API Endpoints

### Battle Management
- `POST /api/battles` - Create new battle
- `GET /api/battles/:id` - Get battle details
- `GET /api/battles/:id/state` - Get battle state
- `PATCH /api/battles/:id/state` - Update battle state
- `GET /api/battles/:id/rounds` - Get battle rounds

### Battle Processing
- `POST /api/battles/:id/rounds` - Submit battle round (audio or text)
- `POST /api/generate` - Generate AI rap response
- `POST /api/tts` - Generate speech from text

## Environment Variables

Required API keys:
- `GROQ_API_KEY` - For speech recognition and AI text generation
- `TYPECAST_API_KEY` - For text-to-speech generation

## Recent Changes

### 2025-08-12 - Initial Setup & Bug Fixes
- ✅ Fixed Groq API integration (corrected endpoints and request format)
- ✅ Resolved schema circular reference errors
- ✅ Fixed storage type mismatches
- ✅ Corrected frontend mutation handling
- ✅ Added proper error handling for API calls
- ✅ Fixed battleHistory array display issues
- ✅ All LSP diagnostics resolved

### Technical Details
- **Groq API**: Updated to use `/chat/completions` endpoint with proper OpenAI-compatible format
- **Database Schema**: Fixed circular references between Battle and BattleRound types
- **Frontend State**: Improved async mutation handling with proper error states
- **Storage Layer**: Added null coalescing for required fields

## User Preferences
- Focus on functional implementation over extensive documentation
- Prioritize working features and error-free operation
- Use TypeScript for better type safety
- Implement responsive design for mobile and desktop

## Development Status
- ✅ Server running successfully on port 5000
- ✅ All TypeScript compilation errors resolved
- ✅ API endpoints functional and tested
- 🔄 Testing battle round processing with external API calls