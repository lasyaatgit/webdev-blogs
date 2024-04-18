const express = require('express');
const app = express();
const { MongoClient } = require("mongodb");
const PORT = process.env.PORT || 8000;

// Database connection URL
const url = 'mongodb://localhost:27017';
const dbName = 'mernblog';

// Middleware
app.use(express.json());

// Function for reusability
const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect(url);
        const db = client.db(dbName);
        await operations(db);
        client.close(); // Close the client after the operations
    } catch (error) {
        console.error("Error connecting to database:", error);
        res.status(500).json({ message: "Error connecting to database" });
    }
}

// GET endpoint to fetch article by name
app.get('/api/articles/:name', async (req, res) => {
    const articleName = req.params.name;
    withDB(async (db) => {
        try {
            const articleInfo = await db.collection('articles').findOne({ name: articleName });
            if (!articleInfo) {
                res.status(404).json({ message: "Article not found" });
                return;
            }
            res.status(200).json(articleInfo);
        } catch (error) {
            console.error("Error fetching article:", error);
            res.status(500).json({ message: "Error fetching article" });
        }
    }, res); // Pass 'res' to 'withDB' function
});

// POST endpoint to add comments to an article
app.post('/api/articles/:name/add-comments', async (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        try {
            const articleInfo = await db.collection('articles').findOne({ name: articleName });
            if (!articleInfo) {
                res.status(404).json({ message: "Article not found" });
                return;
            }
            await db.collection('articles').updateOne({ name: articleName }, {
                $set: {
                    comments: articleInfo.comments.concat({ username, text }),
                },
            });
            const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
            res.status(200).json(updatedArticleInfo);
        } catch (error) {
            console.error("Error adding comment:", error);
            res.status(500).json({ message: "Error adding comment" });
        }
    }, res); // Pass 'res' to 'withDB' function
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
