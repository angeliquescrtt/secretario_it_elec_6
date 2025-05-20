const express = require("express");
const multer = require("multer");
const Post = require("../models/post");
const checkAuth = require("../middleware/check-auth");

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

// CREATE POST
router.post(
  "",
  checkAuth,
  upload.single("image"),
  (req, res, next) => {
    const url = `${req.protocol}://${req.get("host")}`;
    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      imagePath: `${url}/images/${req.file.filename}`,
      creator: req.userData.userId
    });

    post.save()
      .then(result => {
        res.status(201).json({
          message: "Post added successfully",
          post: {
            id: result._id,
            title: result.title,
            content: result.content,
            imagePath: result.imagePath,
            creator: result.creator
          }
        });
      })
      .catch(error => {
        res.status(500).json({
          message: "Creating a post failed!"
        });
      });
  }
);

// UPDATE POST (with nModified check)
router.put(
  "/:id",
  checkAuth,
  upload.single("image"),
  (req, res, next) => {
    let imagePath = req.body.imagePath;
    if (req.file) {
      const url = `${req.protocol}://${req.get("host")}`;
      imagePath = `${url}/images/${req.file.filename}?t=${Date.now()}`;
    }

    const post = {
      _id: req.body.id,
      title: req.body.title,
      content: req.body.content,
      imagePath: imagePath,
      creator: req.userData.userId   
    };

    Post.updateOne({ _id: req.params.id, creator: req.userData.userId }, post)
    .then(result => {
      if (result.matchedCount > 0) {
        res.status(200).json({
          message: "Update successful!",
          post: post  // This includes the new imagePath with ?t=timestamp
        });
      } else {
        res.status(401).json({ message: "Not authorized!" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Couldn't update post!"
      });
    });
  }
);

// GET POSTS (with pagination, creator & comments)
router.get("/", async (req, res, next) => {
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.currentpage;

  try {
    let postQuery = Post.find()
      .populate("creator", "email")
      .populate("comments.userId", "email");

    if (pageSize && currentPage) {
      postQuery = postQuery
        .skip(pageSize * (currentPage - 1))
        .limit(pageSize);
    }

    const posts = await postQuery;
    const count = await Post.countDocuments();

    const formattedPosts = posts.map(post => ({
      id: post._id,
      title: post.title,
      content: post.content,
      imagePath: post.imagePath,
      creator: post.creator?._id,
      creatorEmail: post.creator?.email || "Unknown",
      comments: post.comments.map(c => ({
        id: c._id,
        comment: c.comment,
        userId: c.userId?._id,
        userEmail: c.userId?.email || "Anonymous"
      }))
    }));

    res.status(200).json({
      posts: formattedPosts,
      maxPosts: count
    });

  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      message: "Fetching posts failed!"
    });
  }
});

// GET SINGLE POST (with creator & comments emails)
router.get("/:id", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("creator", "email")
      .populate("comments.userId", "email");

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    const formattedPost = {
      id: post._id,
      title: post.title,
      content: post.content,
      imagePath: post.imagePath,
      creator: post.creator?._id,
      creatorEmail: post.creator?.email || "Unknown",
      comments: post.comments.map(c => ({
        id: c._id,
        comment: c.comment,
        userId: c.userId?._id,
        userEmail: c.userId?.email || "Anonymous"
      }))
    };

    res.status(200).json(formattedPost);

  } catch (error) {
    res.status(500).json({
      message: "Fetching post failed!"
    });
  }
});

// DELETE POST (with creator check)
router.delete("/:id", checkAuth, (req, res, next) => {
  Post.deleteOne({ _id: req.params.id, creator: req.userData.userId })
    .then(result => {
      if (result.deletedCount > 0) {
        res.status(200).json({ message: "Delete successful!" });
      } else {
        res.status(401).json({ message: "Not authorized!" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Deletion failed!"
      });
    });
});

// ADD COMMENT
router.post("/:id/comments", checkAuth, async (req, res, next) => {
  const postId = req.params.id;
  const commentText = req.body.comment;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    const newComment = {
      userId: req.userData.userId,
      comment: commentText,
    };

    post.comments.push(newComment);
    await post.save();

    // Populate user emails for comments
    await post.populate({
      path: 'comments.userId',
      select: 'email'
    });

    return res.status(201).json({
      message: "Comment added successfully!",
      comments: post.comments.map(c => ({
        id: c._id,
        comment: c.comment,
        userId: c.userId?._id,
        userEmail: c.userId?.email || "Anonymous"
      }))
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({
      message: "Adding comment failed!"
    });
  }
});

// GET COMMENTS
router.get("/:id/comments", async (req, res, next) => {
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId)
      .populate({
        path: "comments.userId",
        select: "email"
      });

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    return res.status(200).json({
      message: "Comments fetched successfully",
      comments: post.comments.map(c => ({
        id: c._id,
        comment: c.comment,
        userId: c.userId?._id,
        userEmail: c.userId?.email || "Anonymous"
      }))
    });

  } catch (error) {
    console.error("Error in GET /:id/comments:", error);
    res.status(500).json({
      message: "Fetching comments failed!"
    });
  }
});

// UPDATE COMMENT
router.put("/:postId/comments/:commentId", checkAuth, async (req, res, next) => {
  const { postId, commentId } = req.params;
  const newCommentText = req.body.comment;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found!" });

    // Find the comment by id
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found!" });

    // Check if current user is the comment owner
    if (comment.userId.toString() !== req.userData.userId) {
      return res.status(401).json({ message: "Not authorized!" });
    }

    // Update comment text
    comment.comment = newCommentText;

    await post.save();

    return res.status(200).json({
      message: "Comment updated successfully",
      comment: {
        id: comment._id,
        comment: comment.comment,
        userId: comment.userId
      }
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return res.status(500).json({ message: "Updating comment failed!" });
  }
});


router.delete('/:postId/comments/:commentId', checkAuth, async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Log all comment IDs to verify commentId exists
    console.log("All comment IDs in post:", post.comments.map(c => c._id.toString()));

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Log to debug user match
    console.log("Comment userId:", comment.userId?.toString());
    console.log("Post creator userId:", post.creator?.toString());
    console.log("Authenticated userId:", req.userData.userId);

    const isCommentOwner = comment.userId?.toString() === req.userData.userId;
    const isPostOwner = post.creator?.toString() === req.userData.userId;

    if (!isCommentOwner && !isPostOwner) {
      return res.status(401).json({ message: "Unauthorized to delete this comment" });
    }

    // Use .filter() instead of .remove() for more control
    post.comments = post.comments.filter(
      c => c._id.toString() !== commentId
    );

    await post.save();

    res.status(200).json({ message: "Comment deleted successfully" });

  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

router.post('/:postId/react', checkAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid postId' });
    }
    console.log("User reacting:", req.userData);

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.reactions) post.reactions = [];

    if (!req.userData.userId || !mongoose.Types.ObjectId.isValid(req.userData.userId)) {
      return res.status(401).json({ message: 'Invalid user ID' });
    }

    const userId = mongoose.Types.ObjectId(req.userData.userId);

    const existingReactionIndex = post.reactions.findIndex(r => r.userId.equals(userId));

    if (existingReactionIndex !== -1) {
      post.reactions.splice(existingReactionIndex, 1);
    } else {
      post.reactions.push({
        userId: userId,
        userEmail: req.userData.email || "Unknown"
      });
    }

    await post.save();

    await post.populate('reactions.userId', 'email');

    res.status(200).json({ reactions: post.reactions });

  } catch (error) {
    console.error("Error in reaction route:", error);
    res.status(500).json({ message: "Reacting failed!", error: error.message });
  }
});





module.exports = router;
