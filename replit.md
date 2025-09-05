# Voice-Enabled Rap Battle Game

## Overview
This project is a real-time, voice-enabled rap battle application designed for immersive battles against AI opponents. It leverages advanced AI for speech recognition, rap generation, and text-to-speech, aiming to create an authentic and dynamic battle rap experience. The application includes a sophisticated scoring system, character selection with distinct voices, and monetization features, positioning it as a unique entertainment platform in the voice AI gaming market. The ambition is to provide a highly engaging and technically advanced rap battle simulation.

## User Preferences
- Focus on functional implementation over extensive documentation
- Prioritize working features and error-free operation
- Use TypeScript for better type safety
- Implement responsive design for mobile and desktop
- Use authentic data from real API calls, no mock/placeholder data
- Include user's Replit referral link for new users signing up to Replit

## System Architecture
The application is built with a clear separation between frontend and backend services. The UI/UX features a modern single-page application (SPA) design with React and Vite, styled responsively using Tailwind CSS, and enhanced with Framer Motion for smooth animations. Key technical implementations include real-time voice recording with instant transcription, AI-powered rap generation with adjustable difficulty and complexity levels (e.g., "paper-folded 9,393,939 times" skill with multiple rhyme schemes), profanity filtering, and a comprehensive battle scoring system that evaluates rhyme density, flow quality, and creativity. Character avatars are AI-generated and feature advanced lip-sync using ARTalk for photorealistic animations. The system also includes a robust monetization model with subscription tiers and secure payment processing via Stripe, managed with Replit Auth and a PostgreSQL database.

## Recent Changes (September 5, 2025)
### Stripe Webhook Improvements
- **Database Performance**: Added index on `users.stripeCustomerId` for optimal webhook performance during user lookups
- **Defensive Customer ID Handling**: Enhanced webhook to handle both string and expanded customer objects from Stripe API
- **Idempotency Protection**: Implemented event ID tracking to prevent duplicate processing of webhook events
- **Enhanced Error Handling**: Added comprehensive logging and error handling with proper HTTP status codes for Stripe retry logic
- **Improved Observability**: Enhanced webhook logging with emojis and structured error messages for better debugging

### Technical Implementations:
- **Backend**: Express.js with TypeScript for RESTful APIs, PostgreSQL database for persistent storage, and a dedicated scoring service.
- **Frontend**: React + Vite, Tailwind CSS, TanStack Query for data management, Wouter for routing, and Framer Motion for animations.
- **Rap Generation**: Utilizes Groq's Llama model, optimized with advanced prompting for complex lyrical techniques, multi-syllabic rhymes, and battle tactics. Output is clean, focusing solely on rap verses.
- **Scoring System**: Analyzes rhyme density (end, internal, multi-syllabic), flow quality (syllable count, rhythm), and creativity (wordplay, metaphors, originality).
- **Audio & Voice**: Instant transcription (500ms response), user-managed API key system for OpenAI gpt-4o-mini-tts (2025) with steerability features, Groq PlayAI TTS models (10x real-time), intelligent TTS routing with system fallbacks (Bark TTS + Typecast), and ARTalk for speech-driven 3D head animation and lip sync. FFmpeg is used for audio processing.
- **User API Management**: Secure storage of personal API keys for OpenAI and Groq services, preference-based TTS selection, comprehensive settings interface, automatic fallback to system keys.
- **Monetization**: Replit Auth for user authentication, PostgreSQL for user and battle data, Stripe for secure subscription payments (Free, Premium, Pro tiers).
- **Security**: Robust input validation, enhanced error handling to prevent information leakage, content moderation (Llama Guard 4), encrypted API key storage, and secure handling of audio files (format validation, size limits).

## External Dependencies
- **Groq API**: For instant speech-to-text (Whisper), AI rap generation (Llama), and PlayAI TTS models.
- **OpenAI API**: For gpt-4o-mini-tts (2025) with steerability features for authentic rapper voices.
- **Typecast.ai**: For text-to-speech generation using specific voice IDs (system fallback).
- **ARTalk**: For advanced speech-driven 3D head animation and lip-sync.
- **Stripe**: For secure payment processing and subscription management.
- **Replit Auth**: For user authentication and management.
- **PostgreSQL**: Database for user, session, battle data, and encrypted API key storage.
- **FFmpeg**: For audio and video processing capabilities.