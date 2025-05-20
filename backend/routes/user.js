const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();
const User = require("../models/user");

// SIGNUP
router.post("/signup", (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const newUser = new User({
        email: req.body.email,
        password: hash
      });

      newUser.save()
        .then(result => {
          res.status(201).json({
            message: "User Created",
            result: result
          });
        })
        .catch(err => {
          res.status(500).json({
            message: "Invalid Authentication Credentials!"  
          });
        });
    })
    .catch(err => {
      const error = new Error("Hashing failed");
      error.statusCode = 500;
      error.message = err.message || "Error occurred while hashing password.";
      next(error);  // Pass error to global handler
    });
});

// LOGIN
router.post("/login", (req, res, next) => {
  let fetchedUser;

  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        const error = new Error("Auth failed: User not found");
        error.statusCode = 401;
        next(error);  // Pass error to global handler
      }
      fetchedUser = user;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then(isPasswordCorrect => {
      if (!isPasswordCorrect) {
        const error = new Error("Auth failed: Incorrect password");
        error.statusCode = 401;
        next(error);  // Pass error to global handler
      }

      const token = jwt.sign(
        { email: fetchedUser.email, userId: fetchedUser._id },
        "A_very_long_string_for_our_secret", 
        { expiresIn: "1h" }
      );

      res.status(200).json({
        token: token,
        expiresIn: 3600, 
        userId: fetchedUser._id 
      });
    })
    .catch(err => {
      return res.status(401).json({
        message: "Invalid Authentication Credentials!"  
      });
    });
});

module.exports = router;
