# Remove Server Backend and Use Localhost Only

## Goal
Eliminate all Zoho Catalyst server‑function code and reconfigure the React/Next.js app to call a local API (http://localhost:5000) only. This will simplify the project for local development and remove the need for Catalyst deployment.

## Changes Required
1. **Delete the `functions/server` directory** – this contains the Express backend that we no longer need.
2. **Remove Catalyst configuration files**:
   - Delete `.catalystrc`
   - Delete `catalyst.json` (if present) and any Catalyst‑specific entries.
3. **Update API URL helper** (`src/apiConfig.js` or similar):
   - Hard‑code the base URL to `http://localhost:5000`.
   - Remove any logic that switches between development and production URLs.
4. **Adjust environment files**:
   - Remove `NEXT_PUBLIC_API_URL` from `.env.production` (or delete the file entirely).
   - Ensure any other Catalyst‑specific env vars are removed.
5. **Update component imports** (if they reference Catalyst utilities) to use the new API helper.
6. **Update `next.config.mjs`**:
   - Keep `output: 'export'` for static export.
   - Remove any references to Catalyst Slate.
7. **Update `package.json` scripts**:
   - Remove any `catalyst`‑related scripts (e.g., `catalyst deploy`).
   - Keep `dev`, `build`, `start` for the Next.js app.
8. **Commit the deletions and changes** and push to the repo.
9. **Verify locally**:
   - Run `npm run dev` – the app should now call `http://localhost:5000/api/...`.
   - Ensure the backend (if you still run it locally) is started separately (`node functions/server/index.js` is no longer needed).

## Open Questions
- Do you still need the Express server running locally on port 5000 for API calls? (If yes, keep `functions/server` but rename it to a regular local folder, otherwise you can delete it entirely.)

## Verification Plan
- After changes, open the app in the browser (`http://localhost:3000`).
- Open DevTools → Network and confirm all API requests go to `http://localhost:5000` and return `200`.
- Ensure no Catalyst‑related errors appear in the console.
- Run `npm run build` to confirm the production build succeeds.

## Implementation Steps
1. Delete `functions/server` folder.
2. Delete `.catalystrc` and `catalyst.json`.
3. Edit `src/apiConfig.js` to return `http://localhost:5000`.
4. Remove `NEXT_PUBLIC_API_URL` from `.env.production` (or delete the file).
5. Update `next.config.mjs` if needed.
6. Adjust `package.json` scripts.
7. Commit and push.
8. Test locally.

---
**User approval received. Proceeding with execution.**
