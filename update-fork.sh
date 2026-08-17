#!/bin/bash

# Script to update your fork with the latest changes from upstream
# Usage: ./update-fork.sh [branch-name]

echo "🔄 Updating fork with latest upstream changes..."

# Check if upstream remote exists
if ! git remote | grep -q upstream; then
    echo "➕ Adding upstream remote..."
    git remote add upstream https://github.com/singhalansh/pikachu-05.git
fi

# Fetch latest changes from upstream
echo "📥 Fetching latest changes from upstream..."
git fetch upstream

# Update main branch
echo "🔄 Updating main branch..."
git checkout main
git merge upstream/main
git push origin main

# If a branch name is provided, update that branch too
if [ ! -z "$1" ]; then
    echo "🔄 Updating feature branch: $1"
    git checkout "$1"
    git merge main
    git push origin "$1"
    echo "✅ Branch $1 updated successfully!"
fi

echo "✅ Fork updated successfully!"
echo "📊 Current status:"
git status
