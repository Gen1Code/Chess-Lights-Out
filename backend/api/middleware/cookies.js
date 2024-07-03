const userCookieMiddleware = (req, res, next) => {
  // Allow the authing to be accessed without a cookie
  if(req.path === "/auth/") return next();

  // Check if the user_id cookie is set
  if (!req.cookies.user_id) {
    console.log("No user_id cookie found");
    return res.status(401).send("Unauthorized");
  } else {
    req.userId = req.cookies.user_id;
  }
  next();
};

export default userCookieMiddleware;