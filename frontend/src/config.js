const config = {
  apiBaseUrl:
    process.env.NODE_ENV === "production"
      ? "https://chess-lights-out.vercel.app"
      : "http://localhost:3000",
};

export default config;
