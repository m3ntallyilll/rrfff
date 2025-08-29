# Deployment Size Optimization Guide

This project has been optimized to reduce deployment image size from over 8 GiB to a much smaller footprint suitable for Cloud Run deployments.

## Applied Optimizations

### 1. Docker Ignore Configuration
- Created `.dockerignore` to exclude large directories and unnecessary files
- Excludes ARTalk, bark, MuseTalk directories (ML models)
- Excludes development files, build artifacts, and cached files

### 2. Build Cleanup
- `cleanup-build.sh`: Removes old artifacts and large development directories
- Supports environment variables to preserve specific directories if needed
- Removes node_modules for clean dependency installation

### 3. Production-Optimized Docker Build
- `Dockerfile.production`: Multi-stage build for minimal production image
- Uses Alpine Linux for smaller base image
- Separate stages for dependencies, building, and final runtime
- Only includes production dependencies in final image

### 4. Deployment Scripts
- `deploy.sh`: Complete deployment preparation script
- Automatically cleans artifacts and installs only production dependencies
- Verifies build output before deployment

## Usage

### For Local Testing
```bash
# Clean build artifacts
./cleanup-build.sh

# Prepare for deployment
./deploy.sh
```

### For Cloud Run Deployment
Use the production Dockerfile:
```bash
docker build -f Dockerfile.production -t rap-battle-app .
```

### Environment Variables for Directory Preservation
If you need to keep specific directories in production:
```bash
export KEEP_ARTALK=true    # Preserves ARTalk directory
export KEEP_BARK=true      # Preserves bark directory  
export KEEP_MUSETALK=true  # Preserves MuseTalk directory
export KEEP_ASSETS=true    # Preserves attached_assets directory
```

## Size Reduction Impact

The optimizations remove:
- **ARTalk directory**: ~2-3 GB (ML models and assets)
- **bark directory**: ~1-2 GB (TTS models with many language speakers)
- **attached_assets**: ~500 MB (various files and images)
- **Development dependencies**: ~200-500 MB
- **Build artifacts and cache**: ~100-200 MB
- **Documentation and unnecessary files**: ~50-100 MB

**Total estimated reduction**: 4-6 GB, bringing deployment size well under the 8 GiB limit.

## Production Considerations

1. **ML Model Loading**: If you need ARTalk/bark models in production, consider:
   - Downloading models at runtime from cloud storage
   - Using model serving services instead of bundling models
   - Implementing lazy loading for models

2. **Asset Management**: For attached_assets:
   - Move to cloud storage (AWS S3, Google Cloud Storage)
   - Implement dynamic asset loading
   - Use CDN for static assets

3. **Monitoring**: Monitor actual deployment size after optimization to ensure it stays under limits.

## Troubleshooting

If deployment still fails with size issues:
1. Run `./cleanup-build.sh` to ensure all artifacts are removed
2. Check for additional large directories with `du -sh */ | sort -hr`
3. Consider excluding additional directories in `.dockerignore`
4. Use docker multi-stage builds more aggressively