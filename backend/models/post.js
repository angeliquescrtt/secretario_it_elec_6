const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imagePath: { type: String, required: true },  
  creator: {type: mongoose.Schema.Types.ObjectId,   
    ref: "User", required: true},  
  comments: [
    {
      comment: { type: String, required: true },
      userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    }
  ],
  reactions: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      userEmail: { type: String }
    }
  ]


});

module.exports = mongoose.model("Post", postSchema);
