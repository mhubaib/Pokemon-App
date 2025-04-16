// Variabel global
let offset = 0;
const limit = 20;
let allPokemon = [];
let filteredPokemon = [];
let isLoading = false;

// Elemen DOM
const pokemonContainer = document.getElementById('pokemonContainer');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const modal = document.getElementById('pokemonModal');
const closeBtn = document.querySelector('.close-btn');
const pokemonDetail = document.getElementById('pokemonDetail');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadPokemon();
    
    searchInput.addEventListener('input', filterPokemon);
    typeFilter.addEventListener('change', filterPokemon);
    loadMoreBtn.addEventListener('click', loadMorePokemon);
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
});

// Fungsi untuk memuat Pokemon awal
async function loadPokemon() {
    isLoading = true;
    showLoadingIndicator();
    
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
        const data = await response.json();
        
        const pokemonPromises = data.results.map(async (pokemon) => {
            const pokemonData = await fetchPokemonData(pokemon.url);
            return pokemonData;
        });
        
        const pokemonData = await Promise.all(pokemonPromises);
        allPokemon = [...allPokemon, ...pokemonData];
        filteredPokemon = allPokemon;
        
        renderPokemon(pokemonData);
        offset += limit;
    } catch (error) {
        console.error('Error loading Pokemon:', error);
        showErrorMessage();
    } finally {
        hideLoadingIndicator();
        isLoading = false;
    }
}

// Fungsi untuk memuat lebih banyak Pokemon
function loadMorePokemon() {
    if (!isLoading) {
        loadPokemon();
    }
}

// Mengambil data detail Pokemon
async function fetchPokemonData(url) {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
        id: data.id,
        name: data.name,
        image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
        types: data.types.map(type => type.type.name),
        stats: data.stats.map(stat => ({
            name: stat.stat.name,
            value: stat.base_stat
        })),
        height: data.height / 10, // convert to meters
        weight: data.weight / 10, // convert to kg
        abilities: data.abilities.map(ability => ability.ability.name),
        speciesUrl: data.species.url
    };
}

// Render kartu Pokemon
function renderPokemon(pokemonList) {
    pokemonList.forEach((pokemon, index) => {
        const card = createPokemonCard(pokemon);
        pokemonContainer.appendChild(card);
        
        // Animasi delay berdasarkan indeks
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Membuat kartu Pokemon
function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.classList.add('pokemon-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    // Efek background berdasarkan tipe utama
    if (pokemon.types.length > 0) {
        card.style.boxShadow = `0 5px 15px rgba(var(--${pokemon.types[0]}-color), 0.3)`;
    }
    
    const typeHTML = pokemon.types.map(type => 
        `<span class="pokemon-type type-${type}">${type}</span>`
    ).join('');
    
    card.innerHTML = `
        <div class="pokemon-id">#${pokemon.id}</div>
        <img src="${pokemon.image}" alt="${pokemon.name}">
        <h3>${formatPokemonName(pokemon.name)}</h3>
        <div class="pokemon-types">
            ${typeHTML}
        </div>
    `;
    
    // Event untuk membuka modal detail
    card.addEventListener('click', () => {
        showPokemonDetails(pokemon);
    });
    
    return card;
}

// Menampilkan detail Pokemon dalam modal
async function showPokemonDetails(pokemon) {
    // Tambahkan deskripsi spesies jika belum ada
    if (!pokemon.description) {
        try {
            const speciesResponse = await fetch(pokemon.speciesUrl);
            const speciesData = await speciesResponse.json();
            
            // Cari deskripsi bahasa Inggris
            const description = speciesData.flavor_text_entries.find(
                entry => entry.language.name === 'en'
            )?.flavor_text.replace(/\f/g, ' ') || 'No description available.';
            
            pokemon.description = description;
        } catch (error) {
            console.error('Error fetching species data:', error);
            pokemon.description = 'Failed to load description.';
        }
    }
    
    const typeHTML = pokemon.types.map(type => 
        `<span class="pokemon-type type-${type}">${type}</span>`
    ).join('');
    
    const statsHTML = pokemon.stats.map(stat => {
        const statPercentage = (stat.value / 255) * 100; // 255 adalah nilai stat maksimum
        return `
            <div class="stat-bar">
                <div class="stat-name">${formatStatName(stat.name)}</div>
                <div class="stat-value">${stat.value}</div>
                <div class="stat-progress">
                    <div class="stat-progress-bar" style="width: ${statPercentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
    
    const abilitiesHTML = pokemon.abilities.map(ability => 
        `<li>${formatPokemonName(ability)}</li>`
    ).join('');
    
    pokemonDetail.innerHTML = `
        <div class="pokemon-detail">
            <img src="${pokemon.image}" alt="${pokemon.name}">
            <h2>${formatPokemonName(pokemon.name)} <span class="pokemon-id">#${pokemon.id}</span></h2>
            
            <div class="pokemon-detail-types">
                ${typeHTML}
            </div>
            
            <p class="pokemon-description">${pokemon.description}</p>
            
            <div class="pokemon-details">
                <h3>Detail</h3>
                <div class="pokemon-details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Height</span>
                        <span class="detail-value">${pokemon.height} m</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Weight</span>
                        <span class="detail-value">${pokemon.weight} kg</span>
                    </div>
                </div>
            </div>
            
            <div class="pokemon-abilities">
                <h3>Abilities</h3>
                <ul>
                    ${abilitiesHTML}
                </ul>
            </div>
            
            <div class="stat-container">
                <h3>Base Stats</h3>
                ${statsHTML}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Mencegah scrolling
}

// Menutup modal
function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Mengembalikan scrolling
}

// Memfilter Pokemon berdasarkan input pencarian dan filter tipe
function filterPokemon() {
    const searchValue = searchInput.value.toLowerCase();
    const typeValue = typeFilter.value.toLowerCase();
    
    filteredPokemon = allPokemon.filter(pokemon => {
        const matchesSearch = pokemon.name.toLowerCase().includes(searchValue);
        const matchesType = typeValue === '' || pokemon.types.includes(typeValue);
        return matchesSearch && matchesType;
    });
    
    renderFilteredPokemon();
}

// Render Pokemon yang telah difilter
function renderFilteredPokemon() {
    pokemonContainer.innerHTML = '';
    
    if (filteredPokemon.length === 0) {
        pokemonContainer.innerHTML = '<div class="no-results">Tidak ada Pokemon yang ditemukan</div>';
        return;
    }
    
    renderPokemon(filteredPokemon);
}

// Utility function untuk memformat nama Pokemon
function formatPokemonName(name) {
    return name.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Memformat nama stat
function formatStatName(statName) {
    const statNames = {
        'hp': 'HP',
        'attack': 'Attack',
        'defense': 'Defense',
        'special-attack': 'Sp. Atk',
        'special-defense': 'Sp. Def',
        'speed': 'Speed'
    };
    
    return statNames[statName] || statName;
}

// Menampilkan indikator loading
function showLoadingIndicator() {
    loadMoreBtn.textContent = 'Loading...';
    loadMoreBtn.disabled = true;
}

// Menyembunyikan indikator loading
function hideLoadingIndicator() {
    loadMoreBtn.textContent = 'Tampilkan Lebih Banyak';
    loadMoreBtn.disabled = false;
}

// Menampilkan pesan error
function showErrorMessage() {
    const errorMessage = document.createElement('div');
    errorMessage.classList.add('error-message');
    errorMessage.textContent = 'Gagal memuat data Pokemon. Silakan coba lagi nanti.';
    pokemonContainer.appendChild(errorMessage);
}

// Efek ambient untuk tema alam liar
function createAmbientEffects() {
    const container = document.querySelector('.container');
    
    // Membuat efek partikel daun
    for (let i = 0; i < 10; i++) {
        const leaf = document.createElement('div');
        leaf.classList.add('ambient-leaf');
        
        // Posisi dan animasi random
        leaf.style.left = `${Math.random() * 100}%`;
        leaf.style.animationDuration = `${Math.random() * 10 + 5}s`;
        leaf.style.animationDelay = `${Math.random() * 5}s`;
        
        container.appendChild(leaf);
    }
}

// Inisialisasi efek ambient
// createAmbientEffects();