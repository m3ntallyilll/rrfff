# Optimized Cloud Run Deployment Guide

## Overview
This project has been optimized for Cloud Run deployments with image sizes under the 8 GiB limit. The deployment process includes aggressive cleanup and size optimization.

## Quick Deployment Commands

### Option 1: Use the optimized production build script
```bash
chmod +x build-production.sh
./build-production.sh
```

### Option 2: Use the enhanced cleanup script directly
```bash
chmod +x cleanup-deployment.sh
./cleanup-deployment.sh
```

## What Gets Removed During Deployment

### Large ML Model Directories (~3-5 GB)
- `ARTalk/` - Speech animation models
- `bark/` - Text-to-speech models  
- `MuseTalk/` - Video generation models

### Development Files (~500 MB - 1 GB)
- All TypeScript source files (`client/src/`, `server/`, `shared/`)
- Development dependencies and DevOps files
- Test files (`test_*.py`, `*_test.js`, etc.)
- Configuration files (`tsconfig.json`, `vite.config.ts`, etc.)

### Large Asset Directories (~500 MB)
- `attached_assets/` - User uploaded assets
- `temp_audio/` - Temporary audio files
- `tmp/` - Temporary processing files

### Documentation and Training Data (~100 MB)
- All `.md` files and documentation
- `battle_rap_training_data.*` files
- Build and setup scripts

### Development Tools and Cache (~200-500 MB)
- Python environments (`.pythonlibs/`, `.uv/`, `venv/`)
- Node.js caches (`.npm/`, `.yarn/`, `.cache/`)
- Build artifacts and logs

## Production Package.json

The deployment uses `package.prod.json` which contains only essential runtime dependencies:

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.37.0",
    "@neondatabase/serverless": "^0.10.4", 
    "express": "^4.21.2",
    "groq-sdk": "^0.30.0",
    "openai": "^5.12.2",
    "stripe": "^18.4.0",
    // ... other runtime essentials only
  }
}
```

## Dockerignore Configuration

The `.dockerignore` file excludes:
- All ML model directories
- Development files and configurations
- Python environments and caches
- Large media files (`.wav`, `.mp3`, `.mp4`)
- Documentation and training data
- Temporary and build artifacts

## Build Process

1. **Pre-build Cleanup**: Removes large directories and unnecessary files
2. **Production Dependencies**: Installs only runtime dependencies  
3. **Application Build**: Creates optimized bundles
4. **Post-build Cleanup**: Removes source files, keeping only build artifacts
5. **Size Verification**: Ensures the final image is under 8 GiB

## Manual Deployment Steps

If you need to run the deployment process manually:

```bash
# 1. Clean large directories
rm -rf ARTalk/ bark/ MuseTalk/ attached_assets/ temp_audio/

# 2. Install production dependencies
npm ci --only=production --no-audit --no-fund

# 3. Build the application  
NODE_ENV=production npm run build

# 4. Verify build outputs
ls -la dist/
ls -la client/dist/
```

## Expected Final Image Size

After optimization, the deployment image should be approximately:
- Core application: ~50-100 MB
- Production dependencies: ~200-400 MB  
- Build artifacts: ~50-100 MB
- **Total: ~300-600 MB (well under 8 GiB limit)**

## Troubleshooting

If deployment still fails due to size:

1. Check if large files remain: `find . -size +100M`
2. Verify cleanup ran: `ls -la` (should not see ARTalk/, bark/, MuseTalk/)
3. Check node_modules size: `du -sh node_modules/`
4. Use the enhanced cleanup: `./cleanup-deployment.sh`

## Environment Variables

The cleanup scripts respect these environment variables:
- `KEEP_ARTALK=true` - Preserve ARTalk directory
- `KEEP_BARK=true` - Preserve bark directory  
- `KEEP_MUSETALK=true` - Preserve MuseTalk directory
- `KEEP_ASSETS=true` - Preserve attached_assets directory

**Note**: Setting these to `true` will increase deployment size significantly.