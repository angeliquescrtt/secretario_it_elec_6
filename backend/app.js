const express = require ('express');
const mongoose = require ('mongoose');

const app = express();
const bodyParser =require('body-parser');

const Post = require('./models/post');

mongoose.connect("mongodb+srv://secretarioanglique:aEisYJyeyMflqUf3@cluster0.grq7b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
.then(() => {
    console.log('Connected to database');
})
.catch(() => {
    console.log('Connection Failed');
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", 
        "Origin, X-Requested-With, Content-Type, Accept");
        
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    next();
});

app.post("/api/posts", (req, res, next)=> {
    const post = new Post ({
     title: req.body.title,
     content: req.body.content
    });

    post.save();
    res.status(201).json({
        message: 'Post added Successfully'
    });
})


app.get("/api/posts", (req, res, next) => {
    Post.find()
        .then(documents => {
            res.status(200).json({
                message: 'Post successfully fetched',
                posts: documents
            });
        });
});

app.delete("/api/posts/:id", (req, res, next) => {
    Post.deleteOne({_id: req.params.id }).then(result => {
        console.log(result);
        console.log(req.params.id);
        res.status(200).json({message: "Post deleted"});
    })
});

// app.use('/api/posts',(req, res, next) => {
//     const posts = [
//     {
//     id: "eoiyaruia",
//     title: "first title from server-side",
//     content: "first content from server-side"
//    }, 

//    {
//     id: "jasjdjad",
//     title: "second title from server-side",
//     content: "second content from server-side"
//    }, 
//     ];
    
//     res.status(200).json({
//         message: 'Posts Successfully fetched',
//         posts: posts
//     });
    

// });

module.exports = app;