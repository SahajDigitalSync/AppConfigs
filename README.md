# Remote Configs

This repository serves as a centralized "Dashboard" for managing Remote Configurations across multiple mobile applications.

## How it Works
1. Configs are stored as JSON files in the `/configs` directory.
2. Each app has its own JSON file (e.g., `connect_3d.json`).
3. The files are served globally via **jsDelivr CDN**.

## App Access URLs (Production)
- **Connect_3D**: `https://cdn.jsdelivr.net/gh/SahajDigitalSync/AppConfigs/configs/connect_3d.json`

## Deployment & Maintenance
- **To Update**: Edit the JSON file on GitHub.com and commit.
- **To Add New App**: Upload a new JSON file to `/configs/`.
- **Caching**: jsDelivr might cache files for up to 24 hours. For immediate updates during testing, use the `raw` URL or append a version/hash query param.
