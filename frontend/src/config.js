const config = {
  apiBaseUrl:
    process.env.NODE_ENV === "production"
      ? "https://chess-lights-out.vercel.app"
      : "http://localhost:3000",

  socketUrl:
    process.env.NODE_ENV === "production"
      ? "https://chess-lights-out.vercel.app:4000"
      : "http://localhost:4000",
};

export default config;
