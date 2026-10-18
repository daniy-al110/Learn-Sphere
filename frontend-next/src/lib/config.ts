/** Base URL of the Express backend. In same-host deployments, empty string "" calls relative /api routes directly. */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
