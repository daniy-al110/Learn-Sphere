/** Base URL of the Express backend. Override with NEXT_PUBLIC_API_URL in .env.local. */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
