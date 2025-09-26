const express = require('express');
const router = express.Router();

// Home page
router.get("/", async (req, res) => {
    try {
        if (req.app.locals.pokemonList.length === 0) {
            console.log("Fetching Pokémon list...");
            req.app.locals.pokemonList = await req.app.locals.fetchPokemons(); 
        }
        res.render("pokedex", { pokemonList: req.app.locals.pokemonList });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching Pokémon data");
    }
});

// Get all pokemon data (JSON)
router.get("/pokemon-data", async (req, res) => {
    try {
        if (req.app.locals.pokemonList.length === 0) {
            console.log("Fetching Pokémon list...");
            req.app.locals.pokemonList = await req.app.locals.fetchPokemons(); 
        }
        res.json(req.app.locals.pokemonList); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching Pokémon data");
    }
});

// Ratings form page
router.get("/ratingsForm", (req, res) => {
    res.render("ratingsForm", { portNumber: req.app.locals.portNumber });
});

// Process ratings form
router.post("/processRatingsForm", express.json(), async (req, res) => {
    const { name, ratings } = req.body;
    const collection = req.app.locals.collection;
    const client = req.app.locals.client;
    try {
        // Store user favorites in a new collection
        let userFavorites;
        try {
            userFavorites = client.db().collection("userFavorites");
        } catch (err) {
            return res.status(500).json({ error: "Failed to get userFavorites collection.", details: err.message });
        }
        try {
            await userFavorites.updateOne(
                { name },
                { $set: { ratings } },
                { upsert: true }
            );
        } catch (err) {
            return res.status(500).json({ error: "Failed to update userFavorites.", details: err.message });
        }
        // Update ratingPoints for each pokemon
        for (const [poke, score] of Object.entries(ratings)) {
            const query = isNaN(poke) ? { name: poke } : { id: parseInt(poke) };
            try {
                await collection.updateOne(
                    query,
                    { $inc: { ratingPoints: score } },
                    { upsert: true }
                );
            } catch (err) {
                return res.status(500).json({ error: `Failed to update ratingPoints for ${JSON.stringify(query)}`, details: err.message });
            }
        }
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: "Unknown error in processing ratings.", details: err.message });
    }
});
router.get("/ratingsForm", (req, res) => {
    res.render("ratingsForm", { portNumber: req.app.locals.portNumber });
});

// Process ratings form
router.post("/processRatingsForm", express.json(), async (req, res) => {
    const { name, ratings } = req.body;
    const collection = req.app.locals.collection;
    const client = req.app.locals.client;
    if (!collection) {
        return res.status(500).send("Database not initialized.");
    }
    try {
        // Store user favorites in a new collection
        const userFavorites = client.db().collection("userFavorites");
        await userFavorites.updateOne(
            { name },
            { $set: { ratings } },
            { upsert: true }
        );
        // Existing logic to update ratingPoints for each pokemon
        for (const [poke, score] of Object.entries(ratings)) {
            const query = isNaN(poke) ? { name: poke } : { id: parseInt(poke) };
            await collection.updateOne(
                query,
                { $inc: { ratingPoints: score } },
                { upsert: true }
            );
        }
        res.sendStatus(200);
    } catch (err) {
        res.sendStatus(500);
    }
});

// Search favorites page
router.get("/searchFavorites", (req, res) => {
    res.render("searchFavorites", { favorites: null, user: null });
});

// Get user favorites
router.post("/getUserFavorites", express.urlencoded({ extended: true }), async (req, res) => {
    const searchName = req.body.searchName;
    if (!searchName) {
        return res.render("searchFavorites", { favorites: null, user: null });
    }
    const client = req.app.locals.client;
    try {
        const userFavorites = client.db().collection("userFavorites");
        const entry = await userFavorites.find({ name: searchName })
            .sort({ _id: -1 })
            .limit(1)
            .toArray();
        if (entry.length > 0) {
            res.render("searchFavorites", { favorites: entry[0].ratings, user: searchName });
        } else {
            res.render("searchFavorites", { favorites: null, user: searchName });
        }
    } catch (err) {
        console.error("Error fetching user favorites:", err);
        res.render("searchFavorites", { favorites: null, user: searchName });
    }
});

module.exports = router;
