import { defineEventHandler, handleCors } from "h3";

export default defineEventHandler((event) => {
  if (
    handleCors(event, {
      origin: [
        "https://dashboard.atmagaming.com",
        "https://atma-dashboard.vercel.app",
        "https://atmagaming.com",
        "http://localhost:5173",
        "http://localhost:3000",
      ],
      allowHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    })
  )
    return;
});
