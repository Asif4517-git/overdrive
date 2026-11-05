#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# OVERDRIVE — set GitHub repository description, homepage and topics.
#
# Requirements:
#   - GitHub CLI installed:  https://cli.github.com/
#   - Authenticated:         gh auth login
#   - Permission to edit the repository (owner or admin).
#
# Usage:
#   chmod +x scripts/set-repo-metadata.sh
#   ./scripts/set-repo-metadata.sh
#
# Override defaults with environment variables:
#   OWNER=asif4517-git REPO=overdrive ./scripts/set-repo-metadata.sh
# ---------------------------------------------------------------------------
set -euo pipefail

OWNER="${OWNER:-asif4517-git}"
REPO="${REPO:-overdrive}"
FULL_NAME="${OWNER}/${REPO}"
LIVE_URL="https://${OWNER}.github.io/${REPO}/"
REPO_URL="https://github.com/${FULL_NAME}"
DESCRIPTION="Realistic browser driving game by Asif. 11 cars, manual gearbox, weather, 6 circuits and a 3D garage. React + Three.js. Live: ${LIVE_URL} Portfolio: https://asif4517-git.github.io/ · Instagram @asif_xrk · asifsrk4517@gmail.com"

TOPICS=(
  driving-game
  racing-game
  car-simulator
  threejs
  react
  typescript
  vite
  webgl
  github-pages
  browser-game
  procedural-generation
  game-development
  asif4517-git
)

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is not installed."
  echo "Install it from https://cli.github.com/ then run: gh auth login"
  echo
  echo "Alternatively paste the description from REPO_DESCRIPTION.txt into"
  echo "GitHub -> repository -> About -> Edit repository details."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

if ! gh repo view "$FULL_NAME" >/dev/null 2>&1; then
  echo "Repository ${FULL_NAME} was not found or is not accessible."
  echo "Create it first (public), then push this project to main:"
  echo "  gh repo create ${REPO} --public --source=. --remote=origin --push"
  exit 1
fi

echo "Updating ${FULL_NAME} ..."
echo "  Homepage: ${LIVE_URL}"

TOPIC_ARGS=()
for topic in "${TOPICS[@]}"; do
  TOPIC_ARGS+=(--add-topic "$topic")
done

gh repo edit "$FULL_NAME" \
  --homepage "$LIVE_URL" \
  --description "$DESCRIPTION" \
  "${TOPIC_ARGS[@]}"

echo
echo "Done. Repository metadata:"
gh repo view "$FULL_NAME" --json name,description,homepageUrl,repositoryTopics,url \
  --template '  Name:        {{.name}}{{"\n"}}  Description: {{.description}}{{"\n"}}  Homepage:    {{.homepageUrl}}{{"\n"}}  URL:         {{.url}}{{"\n"}}'

echo
echo "Next steps:"
echo "  1. Settings -> Pages -> Source -> GitHub Actions"
echo "  2. Actions -> Deploy OVERDRIVE to GitHub Pages -> Run workflow"
echo "  3. Open ${LIVE_URL}"
echo
echo "Creator: Asif"
echo "Portfolio: https://asif4517-git.github.io/"
echo "Instagram: @asif_xrk"
echo "Email: asifsrk4517@gmail.com"
