let allPokemons = [];

function displayPokeDex(pokemonList){

    let display = "<div>";
    
    pokemonList.forEach(pokemon => {
        display += `<div class='cards'>`;
        display += `<img src='${pokemon.image}' alt='${pokemon.name} image'<br>`;
        display += `<strong>${pokemon.name}</strong><br>`
        display += `${pokemon.id}<br>`;
        display += `${pokemon.types}<br>`;
        display += `</div>`;
    });
    display += "</div>";
    document.getElementById("display").innerHTML = display;
    
}


window.addEventListener("DOMContentLoaded", () => { // Can be revised??? ???
    fetch("/pokemon-data")
        .then(res => res.json())
        .then(pokemons => {
            allPokemons = pokemons;
            displayPokeDex(allPokemons);
        })
        .catch(err => console.error("Failed to load Pokémon data", err));
    document.getElementById("sort").addEventListener("change", () => {
        const sortValue = document.getElementById("sort").value;
        console.log(sortValue);
        //let newPokemons = [...allPokemons];
        if (sortValue === "lowerNumber"){
            allPokemons.sort((a,b) => a.id - b.id);
        }
        else if (sortValue === "higherNumber"){
            allPokemons.sort((a,b) => b.id - a.id);
        }
        else if (sortValue === "A-Z"){
            allPokemons.sort((a,b) => a.name.localeCompare(b.name));
        }
        else if (sortValue === "Z-A"){
            allPokemons.sort((a,b) => b.name.localeCompare(a.name));
        }
        //allPokemons = [...newPokemons];
        displayPokeDex(allPokemons);
    });



    // Code for the search bar filter?
    const searchBar = document.getElementById("search");
    const searchButton = document.getElementById("searchButton");
    function filterPokemons(){
        const query = searchBar.value.trim().toLowerCase();
        const filtered = allPokemons.filter(pokemon => {
            return (
                pokemon.name.toLowerCase().includes(query) || pokemon.id === Number(query)
            );
        });
        return displayPokeDex(filtered);
    }
    
    searchBar.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            filterPokemons();
        }
    });
    searchButton.addEventListener("click", filterPokemons);
});