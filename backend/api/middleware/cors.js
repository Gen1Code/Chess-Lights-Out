import cors from 'cors';

const corsOptions = {
  production: {
    origin: "https://gen1code.github.io",
    credentials: true,
  },
  development: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  },
};

const getCorsConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return cors(corsOptions.production);
  }
  return cors(corsOptions.development);
};

export default getCorsConfig;
