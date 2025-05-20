const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // Extract token from Authorization header ("Bearer <token>")
    const token = req.headers.authorization.split(" ")[1];

    // Verify and decode the token
    const decodedToken = jwt.verify(token, "A_very_long_string_for_our_secret");

    // Attach both email and userId from token to req.userData
    req.userData = { 
      email: decodedToken.email, 
      userId: decodedToken.userId 
    };

    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    res.status(401).json({ message: "You Are Not Authenticated!" });
  }
};
