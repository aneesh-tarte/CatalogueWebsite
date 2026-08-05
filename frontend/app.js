document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const API_BASE = 'https://catalogue-website-ten.vercel.app/api'; // Adjust for production

    // DOM Elements
    const searchInput = document.getElementById('global-search');
    const searchResults = document.getElementById('search-results');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const libraryContent = document.getElementById('library-content');
    const newsStream = document.getElementById('news-stream');
    const authBtn = document.getElementById('auth-btn');
    
    // Modal Elements
    const authModal = document.getElementById('auth-modal');
    const closeAuthModal = document.getElementById('close-auth-modal');
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authError = document.getElementById('auth-error');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authModalTitle = document.getElementById('auth-modal-title');
    const authSwitchLink = document.getElementById('auth-switch-link');
    const authSwitchText = document.getElementById('auth-switch-text');

    const detailsModal = document.getElementById('details-modal');
    const closeDetailsModal = document.getElementById('close-details-modal');
    const detailsImage = document.getElementById('details-image');
    const detailsTitle = document.getElementById('details-title');
    const detailsType = document.getElementById('details-type');
    const detailsRelease = document.getElementById('details-release');
    const detailsSynopsis = document.getElementById('details-synopsis');
    const detailsAddBtn = document.getElementById('details-add-btn');

    // State
    let currentTab = 'In Progress';
    let libraryData = []; // Will hold the user's library
    let authToken = localStorage.getItem('token') || null;
    let currentSearchResults = [];
    let currentSelectedMedia = null;

    // Initialize
    init();

    function init() {
        setupEventListeners();
        fetchNews();
        if (authToken) {
            authBtn.textContent = 'Sign Out';
            fetchLibrary();
        } else {
            libraryContent.innerHTML = `<div class="loader">Please Sign In to view your library.</div>`;
        }
    }

    function setupEventListeners() {
        // Search on Enter Key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();

                if (query.length < 3) {
                    searchResults.classList.add('hidden');
                    return;
                }

                performSearch(query);
            }
        });

        // Close search results on outside click
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.add('hidden');
            }
        });

        // Tab Switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentTab = e.target.getAttribute('data-status');
                renderLibrary();
            });
        });

        // Auth Button
        authBtn.addEventListener('click', () => {
            if (authToken) {
                localStorage.removeItem('token');
                authToken = null;
                authBtn.textContent = 'Sign In';
                libraryData = [];
                libraryContent.innerHTML = `<div class="loader">Please Sign In to view your library.</div>`;
            } else {
                openAuthModal();
            }
        });

        // Modal close
        closeAuthModal.addEventListener('click', closeAuthModalFunc);
        window.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModalFunc();
        });

        // Switch Auth Mode
        let isLogin = true;
        authSwitchLink.addEventListener('click', (e) => {
            e.preventDefault();
            isLogin = !isLogin;
            authModalTitle.textContent = isLogin ? 'Sign In' : 'Register';
            authSubmitBtn.textContent = isLogin ? 'Sign In' : 'Register';
            authSwitchText.textContent = isLogin ? 'Need an account?' : 'Already have an account?';
            authSwitchLink.textContent = isLogin ? 'Register' : 'Sign In';
            authError.classList.add('hidden');
        });

        // Handle Auth Submit
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            authError.classList.add('hidden');
            const email = authEmail.value;
            const password = authPassword.value;
            const endpoint = isLogin ? '/auth/login' : '/auth/register';

            const originalText = authSubmitBtn.textContent;
            authSubmitBtn.textContent = 'Processing...';
            authSubmitBtn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Authentication failed');
                }

                authToken = data.token;
                localStorage.setItem('token', authToken);
                closeAuthModalFunc();
                authBtn.textContent = 'Sign Out';
                fetchLibrary();
            } catch (err) {
                authError.textContent = err.message;
                authError.classList.remove('hidden');
            } finally {
                authSubmitBtn.textContent = originalText;
                authSubmitBtn.disabled = false;
            }
        });

        // Details Modal
        function closeDetailsModalFunc() {
            detailsModal.classList.add('hidden');
            currentSelectedMedia = null;
        }

        closeDetailsModal.addEventListener('click', closeDetailsModalFunc);
        window.addEventListener('click', (e) => {
            if (e.target === detailsModal) closeDetailsModalFunc();
        });

        detailsAddBtn.addEventListener('click', async () => {
            if (!authToken) {
                closeDetailsModalFunc();
                openAuthModal();
                return;
            }

            if (!currentSelectedMedia) return;

            const originalText = detailsAddBtn.textContent;
            detailsAddBtn.textContent = 'Adding...';
            detailsAddBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE}/library`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(currentSelectedMedia)
                });

                if (response.ok) {
                    searchInput.value = '';
                    closeDetailsModalFunc();

                    // Automatically switch to 'Plan to Track' and refresh
                    currentTab = 'Plan to Track';
                    tabBtns.forEach(t => t.classList.remove('active'));
                    const activeTabBtn = Array.from(tabBtns).find(btn => btn.getAttribute('data-status') === currentTab);
                    if (activeTabBtn) activeTabBtn.classList.add('active');

                    await fetchLibrary();
                } else {
                    const errData = await response.json().catch(() => ({}));
                    console.error('Failed to add item:', errData);
                    alert("Failed to add item: " + (errData.error || response.statusText));
                }
            } catch (error) {
                console.error('Error adding item:', error);
                alert("Network error while adding item.");
            } finally {
                detailsAddBtn.textContent = originalText;
                detailsAddBtn.disabled = false;
            }
        });
    }

    function openAuthModal() {
        authModal.classList.remove('hidden');
        authEmail.value = '';
        authPassword.value = '';
        authError.classList.add('hidden');
    }

    function closeAuthModalFunc() {
        authModal.classList.add('hidden');
    }

    // --- Search Module ---
    async function performSearch(query) {
        try {
            const searchType = document.getElementById('search-type')?.value || 'ANIME';
            const response = await fetch(`${API_BASE}/catalog/search?q=${encodeURIComponent(query)}&type=${searchType}`);
            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            const resultsArray = data.data || data;
            renderSearchResults(resultsArray);
        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = `<div class="search-item">Error fetching results.</div>`;
            searchResults.classList.remove('hidden');
        }
    }

    function renderSearchResults(results) {
        currentSearchResults = results || [];
        if (!results || !Array.isArray(results) || results.length === 0) {
            searchResults.innerHTML = `<div class="search-item">No results found.</div>`;
        } else {
            // Assuming results have { title, mediaType, year }
            searchResults.innerHTML = results.slice(0, 5).map(item => `
                <div class="search-item clickable-result" 
                     data-id="${item.id || item.apiId || item.externalId || ''}" 
                     data-title="${(item.title || '').replace(/"/g, '&quot;')}" 
                     data-type="${item.mediaType || item.type || 'ANIME'}" 
                     data-image="${item.image || item.coverImage || item.coverImageUrl || ''}">
                    <strong>${item.title || 'Unknown Title'}</strong>
                    <small>${item.mediaType || item.type || 'Media'} • ${item.releaseDate ? new Date(item.releaseDate).getFullYear() : (item.year || '')}</small>
                </div>
            `).join('');

            document.querySelectorAll('.clickable-result').forEach(el => {
                el.addEventListener('click', async (e) => {
                    const target = e.currentTarget;
                    const id = target.getAttribute('data-id');
                    const item = currentSearchResults.find(i => (i.id || i.apiId || i.externalId) == id);
                    if (!item) return;

                    currentSelectedMedia = {
                        apiId: id,
                        title: item.title,
                        type: item.type || item.mediaType || 'ANIME',
                        imageUrl: item.coverImageUrl || item.image || item.coverImage
                    };

                    detailsImage.src = item.coverImageUrl || item.image || item.coverImage || 'https://via.placeholder.com/200x300';
                    detailsTitle.textContent = item.title || 'Unknown Title';
                    detailsType.textContent = item.type || item.mediaType || 'Media';
                    detailsRelease.textContent = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'Unknown Year';
                    detailsSynopsis.textContent = item.synopsis || item.description || 'No description available.';

                    detailsModal.classList.remove('hidden');
                    searchResults.classList.add('hidden');
                });
            });
        }
        searchResults.classList.remove('hidden');
    }

    // --- News Module ---
    async function fetchNews() {
        try {
            // Using a placeholder API route, implement the actual backend if it exists
            const response = await fetch(`${API_BASE}/news`);
            if (!response.ok) {
                // Fallback mockup if endpoint isn't fully implemented yet
                renderMockNews();
                return;
            }
            const result = await response.json();
            renderNews(result.data);
        } catch (error) {
            console.warn('News endpoint not found, using fallback.');
            renderMockNews();
        }
    }

    function renderNews(newsItems) {
        if (!newsItems || newsItems.length === 0) {
            newsStream.innerHTML = `<div class="loader">No recent news.</div>`;
            return;
        }

        newsStream.innerHTML = newsItems.map(item => `
            <article class="news-card">
                <div class="news-meta">
                    <span>${item.publisher || item.source}</span>
                    <span>${new Date(item.publishedAt).toLocaleDateString()}</span>
                </div>
                <a href="${item.sourceUrl || item.url}" target="_blank" class="news-title">${item.headline || item.title}</a>
                <p class="news-snippet">${item.snippet || ''}</p>
            </article>
        `).join('');
    }

    function renderMockNews() {
        const mockNews = [
            { source: 'AnimeNewsNetwork', publishedAt: new Date().toISOString(), title: 'Demon Slayer Season 4 Premiere Date Announced', url: '#' },
            { source: 'IGN', publishedAt: new Date(Date.now() - 86400000).toISOString(), title: 'The Last of Us Season 2 Casts Abby', url: '#' },
            { source: 'Crunchyroll', publishedAt: new Date(Date.now() - 172800000).toISOString(), title: 'Solo Leveling Episode 5 Breaks Records', url: '#' }
        ];
        renderNews(mockNews);
    }

    // --- Library Module ---
    async function fetchLibrary() {
        try {
            const response = await fetch(`${API_BASE}/library`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error('Failed to fetch library');
            }

            const data = await response.json();
            libraryData = data.library || [];
            renderLibrary();
        } catch (error) {
            console.error('Library error:', error);
            if (error.message === 'Unauthorized') {
                libraryContent.innerHTML = `<div class="loader">Session expired. Please sign in again.</div>`;
            } else {
                libraryContent.innerHTML = `<div class="loader">Error loading library. Using mock data for demo.</div>`;
                // Load mock data for UI demonstration purposes
                libraryData = [
                    { id: '1', catalogItemId: { title: 'Attack on Titan' }, trackStatus: 'In Progress', progress: 85, total: 87 },
                    { id: '2', catalogItemId: { title: 'Jujutsu Kaisen' }, trackStatus: 'In Progress', progress: 45, total: 47 },
                    { id: '3', catalogItemId: { title: 'Breaking Bad' }, trackStatus: 'Completed', progress: 62, total: 62 },
                    { id: '4', catalogItemId: { title: 'One Piece' }, trackStatus: 'Plan to Track', progress: 0, total: 1100 }
                ];
                renderLibrary();
            }
        }
    }

    function renderLibrary() {
        const tabToStatusMap = {
            'In Progress': 'IN_PROGRESS',
            'Plan to Track': 'PLAN_TO_TRACK',
            'Completed': 'COMPLETED',
            'Dropped': 'DROPPED'
        };
        const mappedStatus = tabToStatusMap[currentTab];
        const filtered = libraryData.filter(item => item.status === mappedStatus || item.trackStatus === currentTab);

        if (filtered.length === 0) {
            libraryContent.innerHTML = `<div class="loader">No items in ${currentTab}.</div>`;
            return;
        }

        libraryContent.innerHTML = filtered.map(item => `
            <div class="library-card" data-id="${item.id}">
                <h3>${item.mediaItem?.title || item.catalogItemId?.title || 'Unknown Title'}</h3>
                <div class="progress-control">
                    <span>Progress:</span>
                    <input type="number" class="progress-input" value="${item.progress || 0}" min="0" max="${item.total || 9999}" data-id="${item.id}">
                    <span>/ ${item.total || '?'}</span>
                    <button class="btn btn-primary btn-small update-progress-btn" data-id="${item.id}">Save</button>
                </div>
            </div>
        `).join('');

        // Attach listeners to new save buttons
        document.querySelectorAll('.update-progress-btn').forEach(btn => {
            btn.addEventListener('click', handleProgressUpdate);
        });
    }

    async function handleProgressUpdate(e) {
        const btn = e.target;
        const itemId = btn.getAttribute('data-id');
        const input = document.querySelector(`input.progress-input[data-id="${itemId}"]`);
        const newProgress = parseInt(input.value, 10);

        const originalText = btn.textContent;
        btn.textContent = '...';
        btn.disabled = true;

        try {
            // PATCH request to update progress
            const response = await fetch(`${API_BASE}/library/update`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    libraryItemId: itemId,
                    updates: { progress: newProgress }
                })
            });

            if (!response.ok) throw new Error('Update failed');

            // Update local state
            const item = libraryData.find(i => i.id === itemId || i._id === itemId);
            if (item) item.progress = newProgress;

            btn.textContent = 'Saved!';
            setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2000);

        } catch (error) {
            console.error('Progress update error:', error);
            btn.textContent = 'Error';
            setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2000);
        }
    }
});
