#!/bin/bash

# WARNING: This script deletes EVERYTHING related to the app.
# Use only if you want to start 100% fresh.

echo "💥 WARNING: This will delete ALL data, databases, and files for iawarrior-tech."
read -p "Are you sure? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo "🛑 Stopping containers..."
cd /opt/iawarrior-tech/instances/main 2>/dev/null || cd /opt/iawarrior-tech 2>/dev/null
docker compose down -v 2>/dev/null

echo "🧹 Cleaning up Docker leftovers..."
# Stop all running containers (just in case)
docker stop $(docker ps -q --filter name=main-*) 2>/dev/null
# Remove containers
docker rm $(docker ps -aq --filter name=main-*) 2>/dev/null
# Remove volumes (CRITICAL for fresh DB)
docker volume rm $(docker volume ls -q --filter name=main_*) 2>/dev/null

echo "🗑️  Deleting project files..."
cd /root
rm -rf /opt/iawarrior-tech

echo "✨ System Cleaned. You can now re-run the install command."
