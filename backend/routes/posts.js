const express = require("express");
const multer = require("multer");  
const Post = require("../models/post");

const router = express.Router();

const MIME_TYPE_MAP = {  
  "image/png": "png",  
  "image/jpeg": "jpg",  
  "image/jpg": "jpg"  
};  

const storage = multer.diskStorage({  
  destination: (req, file, cb) => {  
    const isValid = MIME_TYPE_MAP[file.mimetype];  
    const error = isValid ? null : new Error("Invalid Mime Type");  
    cb(error, "backend/images");  
  },
  filename: (req, file, cb) => {  
    const name = file.originalname.toLowerCase().split(" ").join("_"); 
    const ext = MIME_TYPE_MAP[file.mimetype]; 
    cb(null, `${name}-${Date.now()}.${ext}`);   
  }    
});  

const upload = multer({ storage });

// Create a new post
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const url = `${req.protocol}://${req.get("host")}`;  
    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      imagePath: `${url}/images/${req.file.filename}`
    });

    const result = await post.save();  

    res.status(201).json({ 
      message: "Post added successfully", 
      post: { 
        id: result._id,  
        title: result.title,  
        content: result.content,  
        imagePath: result.imagePath  
      }  
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add post", error });
  }
});

router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    let imagePath = req.body.imagePath;   
    if (req.file) {  
      const url = `${req.protocol}://${req.get("host")}`;  
      imagePath = `${url}/images/${req.file.filename}`;
    }  

    const result = await Post.updateOne(
      { _id: req.params.id }, 
      { title: req.body.title, content: req.body.content, imagePath }
    );

    if (result.matchedCount > 0) {
      res.status(200).json({ message: "Update Successful!" });
    } else {
      res.status(404).json({ message: "Post not found!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Updating post failed!", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json({ message: "Posts successfully fetched", posts });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post", error });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await Post.deleteOne({ _id: req.params.id });
    if (result.deletedCount > 0) {
      res.status(200).json({ message: "Post deleted successfully" });
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Deleting post failed", error });
  }
});

module.exports = router;
