const userCookieMiddleware = (req, res, next) => {
  // Allow the authing to be accessed without a cookie
  if (req.path === "/auth/") return next();

  if (req.cookies.user_id) {
    req.userId = req.cookies.user_id;
  } else if (req.headers.authorization && req.headers.authorization.split(" ")[1] !== undefined){
    req.userId = req.headers.authorization.split(" ")[1];
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};

export default userCookieMiddleware;
