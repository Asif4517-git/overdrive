import { DEVELOPER } from "../game/credits";

/**
 * GitHub hosting configuration — single source of truth.
 *
 * If the repository is renamed, change REPO_NAME here and in:
 *   - README.md (Play Live button + Source badge)
 *   - index.html (og:url and structured data)
 *   - GITHUB_PAGES.md
 *   - REPO_DESCRIPTION.txt
 *   - working.txt
 */
export const REPO_OWNER = "asif4517-git";
export const REPO_NAME = "overdrive";

export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
export const LIVE_URL = `https://${REPO_OWNER.toLowerCase()}.github.io/${REPO_NAME}/`;
export const PAGES_URL = `${REPO_URL}/actions/workflows/deploy.yml`;
export const ISSUES_URL = `${REPO_URL}/issues`;

export const SITE = {
  name: "OVERDRIVE",
  tagline: "Real roads. Real machines. Pure driving.",
  description:
    "A realistic browser driving game with real production cars, manual and automatic gearboxes, dynamic weather, six circuits and a right-hand-drive cockpit. Runs entirely offline in the browser.",
  owner: REPO_OWNER,
  repo: REPO_NAME,
  repoUrl: REPO_URL,
  liveUrl: LIVE_URL,
  pagesUrl: PAGES_URL,
  issuesUrl: ISSUES_URL,
  developer: DEVELOPER,
} as const;

export const isDeployed = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith("github.io");
};
