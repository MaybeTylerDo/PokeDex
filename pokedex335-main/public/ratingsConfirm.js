//code to confirm ratings by ensuring no duplicates, allows empty spots, must be proper number or full name, 
// Ratings will give points based on positions (5-1). Sends ratingPoints to mongoDB where each pokemon has ratingPoints

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector("form");
    let validPokemon = {};

    try {
        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151&offset=0");
        const data = await res.json();
        data.results.forEach((entry, index) => {
            const name = entry.name.toLowerCase();
            const number = (index + 1).toString();
            validPokemon[name] = name;
            validPokemon[number] = name;
        });
    } catch (err) {
        console.error(err);
        alert("Error loading Pokémon validation. Please refresh.");
        return;
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const nameInput = document.getElementById("name");
        const name = nameInput.value.trim();
        if (!name) {
            alert("Please enter your name.");
            return;
        }

        const pokeInputs = [
            document.getElementById("first"),
            document.getElementById("second"),
            document.getElementById("third"),
            document.getElementById("fourth"),
            document.getElementById("fifth")
        ];

        const rawValues = pokeInputs.map(input => input.value.trim().toLowerCase());
        const filtered = rawValues.filter(v => v !== "");

        const normalized = filtered.map(val => {
            const num = parseInt(val);
            if (!isNaN(num)) {
                return num.toString();
            }
            return val;
        });

        const values = normalized.map(val => validPokemon[val]);

        if (values.includes(undefined)) {
            alert("Invalid Pokémon detected. Use a valid name or number (1–151).");
            return;
        }

        const unique = new Set(values);
        if (unique.size !== values.length) {
            alert("No duplicate Pokémon allowed.");
            return;
        }

        if (!values[0]) {
            alert("First choice is required.");
            return;
        }

        const points = [5, 4, 3, 2, 1];
        const ratings = {};

        normalized.forEach((val, i) => {
            if (val !== "") {
                const name = validPokemon[val];
                ratings[name] = points[i];
            }
        });

        fetch("/processRatingsForm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, ratings })
        }).then(response => {
            if (response.ok) {
                alert("Ratings submitted successfully!");
                form.reset();
            } else {
                alert("Failed to submit ratings.");
            }
        }).catch(err => {
            console.error("Error submitting ratings:", err);
        });
    });
});

