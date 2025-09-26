const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
// Import modular router
const router1 = require("./routes/router1");
require("dotenv").config();
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_CONNECTION_STRING);
let collection;
class Pokemon {
    constructor(name, id, image, types) {
        this.name = name;
        this.id = id;
        this.image = image;
        this.types = types;
        //add ratingPoints?
    }
}

const app = express();
const portNumber = 3000; // Any port

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true }));
let pokemonList = [];

// Inject dependencies for router
app.locals.pokemonList = pokemonList;
app.locals.fetchPokemons = fetchPokemons;
app.locals.portNumber = portNumber;


async function fetchPokemons(){
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151&offset=0");
      
    if (!response.ok) {
        throw new Error("Failed to fetch Pokémon list.");
    }
    

    const data = await response.json();
    pokemonList = await Promise.all(
        data.results.map(async (entry) => {
            const pokeResponse = await fetch(entry.url);
            const pokeData = await pokeResponse.json();
      
            return new Pokemon(
                pokeData.name,
                pokeData.id,
                pokeData.sprites.front_default,
                pokeData.types.map(t => t.type.name)
                // add ratingPoints
            );
        })
    );
    app.locals.pokemonList = pokemonList;
    return pokemonList;
}

app.use("/", router1);

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const server = app.listen(portNumber, () => {
  console.log(`Web server started and running at http://localhost:${portNumber}`);
  console.log(`Type 'stop' to shutdown the server.`);
});

rl.on("line", (input) => {
  if (input.trim().toLowerCase() === "stop") {
    console.log("Shutting down the server...");
    server.close(() => {
      console.log("Server stopped.");
      process.exit(0);
    });
  }
});

async function connectToDB() {
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB_NAME);
        collection = db.collection(process.env.MONGO_COLLECTION);
    } catch (err) {
        console.error(err);
    }
}
async function connectToDBAndStartServer() {
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB_NAME);
        collection = db.collection(process.env.MONGO_COLLECTION);
        app.locals.collection = collection;
        app.locals.client = client;

        // Start the server only after DB is ready
        const server = app.listen(portNumber, () => {
            console.log(`Web server started and running at http://localhost:${portNumber}`);
            console.log(`Type 'stop' to shutdown the server.`);
        });

        rl.on("line", (input) => {
            if (input.trim().toLowerCase() === "stop") {
                console.log("Shutting down the server...");
                server.close(() => {
                    console.log("Server stopped.");
                    process.exit(0);
                });
            }
        });
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}
connectToDBAndStartServer();
