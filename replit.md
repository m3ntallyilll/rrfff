# Voice-Enabled Rap Battle Game

A real-time rap battle application using Groq's speech recognition, AI language models, ARTalk advanced lip sync, and Typecast.ai text-to-speech for immersive voice battles against AI opponents.

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

### 2025-08-17 - Voice System Verification + Payment Integration Complete
- ✅ **ALL CHARACTER VOICES VERIFIED**: MC Razor (female), MC Venom (male), MC Silk (male black rapper) - All using authentic rapper voice IDs
- ✅ **UNCENSORED MODE ENHANCED**: Strong profanity (shit, fuck, damn, bitch, ass, hell) enabled when profanity filter disabled
- ✅ **AUTHENTIC STREET LANGUAGE**: Battle rap mode uses raw, unfiltered aggressive language for maximum impact
- ✅ **TTS SYSTEM FUNCTIONAL**: All three character voices generating audio successfully with proper voice mappings
- ✅ **PAYMENT SYSTEM VERIFIED**: Stripe integration fully functional with Premium ($9.99) and Pro ($19.99) tiers
- ✅ **SUBSCRIBE PAGE COMPLETE**: Stripe Elements integration with secure authentication protection
- ✅ **TOURNAMENT FOUNDATION**: Database schema and API routes implemented for multi-round elimination brackets
- ✅ **AI CONTENT MODERATION**: Integrated Llama Guard 4 for professional-grade content safety
- ✅ **SMART SAFETY LEVELS**: Strict (family-friendly) vs Moderate (battle rap appropriate) filtering
- ✅ **LYRIC COMPLEXITY SLIDERS**: 0-100% complexity and style intensity controls
- ✅ **DYNAMIC AI RESPONSES**: Sliders directly influence vocabulary, wordplay, and aggression levels

### 2025-08-14 - Account Upgraded to Pro + Authentication Fixes
- ✅ **ACCOUNT UPGRADE**: User account upgraded to Pro tier with unlimited battles
- ✅ **AUTHENTICATION FIXES**: Resolved issues with users not getting 3 free battles initially
- ✅ **BATTLE LIMITS**: Fixed daily battle reset functionality and proper limit tracking
- ✅ **USER EXPERIENCE**: Enhanced battle creation with proper error handling and user feedback

### 2025-08-14 - Complete Monetization System + Authentication + Stripe Integration
- ✅ **COMPLETE BUSINESS MODEL**: Implemented full monetization system with user accounts and Stripe payments
- ✅ **USER AUTHENTICATION**: Replit Auth integration with PostgreSQL database for user management
- ✅ **SUBSCRIPTION TIERS**: Free (3 battles/day), Premium ($9.99/month, 25 battles/day), Pro ($19.99/month, unlimited)
- ✅ **STRIPE PAYMENTS**: Secure subscription processing with automatic billing and cancellation
- ✅ **LANDING PAGE**: Beautiful pricing page for unauthenticated users with referral link
- ✅ **USER DASHBOARD**: Authenticated home page showing stats, battle limits, and subscription status
- ✅ **BATTLE LIMITS**: Daily limits that reset automatically, with upgrade prompts when exceeded
- ✅ **PAYMENT FLOW**: Complete subscription upgrade process with Stripe Elements integration
- ✅ **DATABASE SCHEMA**: Users, sessions, battles tables with proper relations and constraints
- ✅ **PROTECTED ROUTES**: Battle creation requires authentication and respects subscription limits

### 2025-08-12 - Complete System Enhancement + ARTalk Integration + TTS SUCCESS
- ✅ Fixed Groq API integration (corrected endpoints and request format)
- ✅ Resolved schema circular reference errors and fixed storage type mismatches
- ✅ Corrected frontend mutation handling with proper error states
- ✅ Fixed battleHistory array display issues and LSP diagnostics
- ✅ Updated Typecast API implementation with correct payload structure
- ✅ **MAJOR**: Enhanced rap generation system covering every aspect of rap mastery
- ✅ **MAJOR**: Comprehensive scoring system evaluating all rap elements
- ✅ **CRITICAL**: Fixed audio playback infinite loops and React errors
- ✅ **CRITICAL**: Implemented stable audio controls with proper loading states
- ✅ **MAJOR**: Created comprehensive battle rap training dataset with 30 advanced examples
- ✅ **UPGRADED MODEL**: Now using Groq's `openai/gpt-oss-120b` model with `reasoning_effort="medium"` for superior rap generation with internal reasoning
- ✅ **30-SECOND VERSES**: Enhanced to generate 8-12 lines of battle rap (30 seconds at ~150 BPM) with advanced lyrical techniques
- ✅ **CLEAN OUTPUT**: Model reasons internally about rhyme schemes and wordplay but outputs only clean rap verses for TTS
- ✅ **NEW**: Generated 3 unique battle character avatars with distinct personalities
- ✅ **NEW**: Implemented character selection system with voice ID mapping  
- ✅ **NEW**: Added character profiles: MC Razor (female, hardcore), MC Venom (male, aggressive), MC Silk (male, smooth)
- ✅ **ADVANCED**: Implemented MuseTalk-inspired real-time lip sync with multi-band frequency analysis
- ✅ **ADVANCED**: Added phoneme-aware mouth shape detection and facial animation system
- ✅ **PHOTOREALISTIC**: Created ultra-realistic character avatars with detailed facial features
- ✅ **AI-GENERATED**: Generated high-quality photorealistic portraits using advanced AI image generation
- ✅ **INTEGRATION**: Migrated from MuseTalk to ARTalk - advanced speech-driven 3D head animation
- ✅ **ARCHITECTURE**: Added ARTalk service layer with FLAME-based facial modeling support  
- ✅ **INFRASTRUCTURE**: ARTalk system with 3D head motions, lip sync, expressions, and head poses
- ✅ **REAL AVATAR SYNC**: Enhanced browser animation with ARTalk-inspired lip sync integration
- ✅ **ENHANCED ANIMATION**: Avatar faces scale and brighten with speech intensity for visible lip sync
- ✅ **SIMULATION MODE**: ARTalk runs in enhanced simulation mode with full model support available
- ✅ **FFmpeg**: FFmpeg and Python 3.11 installed for ARTalk video processing capabilities
- ✅ **TTS BREAKTHROUGH**: Typecast API now generating audio successfully (1.5MB+ files)
- ✅ **Voice Mapping**: Fixed character voice ID mapping for proper TTS generation
- ✅ **ARTalk E2BIG Fix**: Resolved command line argument size issue by saving audio to temp files
- ✅ **Interactive Lyric Breakdown**: Complete analysis feature with modal interface and detailed scoring
- ✅ **Enhanced Profanity Support**: Authentic street language when profanity filter is disabled
- ✅ **Model Optimization**: Switched to llama-3.3-70b-versatile for faster, direct responses
- ✅ **Mobile Microphone Fix**: Enhanced permission handling and codec fallbacks for mobile browsers
- ✅ **Reasoning Analysis System**: Integrated openai/gpt-oss-120b for comprehensive phonetic analysis
- ✅ **Enhanced Voice Mapping**: Updated to correct rapper-type voice IDs for all characters  
- ✅ **Character Updates**: MC Silk now properly identified as black male rapper with correct voice
- ✅ **Performance Optimization**: Added caching system for analysis results and battle responses
- ✅ **Advanced Components**: Created battle settings, stats dashboard, and real-time visualizer
- ✅ **Battle Engine**: Comprehensive battle processing with context-aware responses
- ✅ **Enhanced Audio**: Mobile-optimized recording with better quality and codec fallbacks
- ✅ **Profanity Unleashed**: Default uncensored mode with authentic street rap language
- ✅ **Real-time Visualization**: Audio frequency analysis with beat detection
- ✅ **Advanced Settings**: Configurable AI aggressiveness, analysis depth, and battle parameters
- ✅ **ADVANCED RAP SKILLS**: Internal rhyming, rhyme stacking, and rhyme juggling techniques
- ✅ **Technical Mastery**: Multi-syllabic rhymes, consonance/assonance patterns, complex flow structures
- ✅ **Battle AI Enhancement**: Advanced rhyme engine with pattern analysis and technique detection

### Technical Details
- **Groq API**: Updated to use `/chat/completions` endpoint with proper OpenAI-compatible format
- **Typecast API**: All three rapper voices verified and functional (WORKING):
  - `tc_6178a6758972cb5bb66f1295` (MC Razor - Female rapper, hardcore style)
  - `tc_67d237f1782cabcc6155272f` (MC Venom - Male rapper, aggressive style)  
  - `tc_685ca2dcfa58f44bdbe60d65` (MC Silk - Male black rapper, smooth style)
- **Audio Generation**: Successfully generating 1.5MB+ audio files per battle round
- **Database Schema**: Fixed circular references between Battle and BattleRound types
- **Frontend State**: Improved async mutation handling with proper error states
- **Storage Layer**: Added null coalescing for required fields
- **Error Handling**: Added graceful fallbacks for TTS failures to prevent battle interruption

### Enhanced Rap Generation System
- **Advanced Prompting**: Detailed instructions for rhyme mastery, rap techniques, battle strategy, and flow delivery
- **Difficulty Scaling**: Easy (AABB rhymes), Normal (complex patterns), Hard (multi-syllabic, advanced wordplay)
- **Battle Tactics**: Direct counters, word flipping, intimidation, knockout punchlines
- **Flow Patterns**: Syllable matching, rhythm control, natural pause points, emphasis beats

### Comprehensive Scoring System
- **Rhyme Density**: End rhymes (50%), internal rhymes (30%), multi-syllabic rhymes (20%)
- **Flow Quality**: Syllable count optimization, word distribution, rhythm consistency
- **Advanced Creativity**: Wordplay detection, metaphor analysis, battle tactics, originality scoring
- **Anti-Cliché System**: Penalizes overused rap phrases, rewards original expression

## User Preferences
- Focus on functional implementation over extensive documentation
- Prioritize working features and error-free operation
- Use TypeScript for better type safety
- Implement responsive design for mobile and desktop
- Use authentic data from real API calls, no mock/placeholder data
- Include user's Replit referral link for new users signing up to Replit

## Development Status
- ✅ Server running successfully on port 5000
- ✅ All TypeScript compilation errors resolved
- ✅ API endpoints functional and tested
- ✅ Groq API integration working correctly with enhanced rap prompting
- ✅ **TTS FULLY FUNCTIONAL**: All 3 character voices verified as rapper voices generating audio successfully
- ✅ **PROFANITY SYSTEM VERIFIED**: Uncensored mode uses authentic street rap language with strong profanity
- ✅ Advanced scoring system evaluating all rap elements
- ✅ Audio playback system stable and error-free
- ✅ Character voice mapping working: Nia (female), Walter & Wade (male voices)
- ✅ ARTalk running in enhanced simulation mode with browser animation
- ✅ **PRODUCTION READY**: Complete end-to-end rap battle functionality with working audio
- ✅ **BREAKTHROUGH**: Real voice generation working for all battle characters