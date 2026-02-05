# Remote Configs

This repository serves as a centralized "Dashboard" for managing Remote Configurations across multiple mobile applications.

## How it Works
1. Configs are stored as JSON files in the `/configs` directory.
2. Each app has its own JSON file (e.g., `connect_3d.json`).
3. The files are served globally via **jsDelivr CDN**.

## App Access URLs (Production)
- **Connect_3D**: `https://cdn.jsdelivr.net/gh/SahajDigitalSync/AppConfigs/configs/connect_3d.json`
- **DoctorDocs**: `https://cdn.jsdelivr.net/gh/SahajDigitalSync/AppConfigs/configs/doctor_docs.json`

## Deployment & Maintenance
- **To Update**: Edit the JSON file on GitHub.com and commit.
- **Automation**: A GitHub Action is configured to automatically purge the jsDelivr CDN cache for any changed file on every push. Your changes will go live globally in seconds.
- **Troubleshooting**: If an update isn't appearing, you can manually visit: `https://purge.jsdelivr.net/gh/SahajDigitalSync/AppConfigs/configs/<filename>.json`
