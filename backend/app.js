const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());



app.use("/api/posts", (req, res, next) => {
    const posts = 
        [
            {
                id: "angexoxo",
                title: "First title from server side",
                content: "First content from server side"
            },
            {
                id: "jackychan",
                title: "Second title from server side",
                content: "Second content from server side"
            }
        ];

    res.status(200).json({
        message: 'posts succesfully fetch',
        posts: posts
    });
});


module.exports = app;