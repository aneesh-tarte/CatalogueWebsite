document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'https://catalogue-website-ten.vercel.app/api'; // Production backend
    const SUPABASE_URL = 'https://dyxcukchextjinfrkxdo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5eGN1a2NoZXh0amluZnJreGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDE3OTgsImV4cCI6MjA5OTc3Nzc5OH0.KNraxiSl9365LOWSUaLx0hA_Z-9ozhOL5ctfC2_8Qh8'; // IMPORTANT: Replace with your actual anon key!

    // DOM Elements
    const searchInput = document.getElementById('global-search');
    const searchResults = document.getElementById('search-results');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const libraryContent = document.getElementById('library-content');
    const newsCarousel = document.getElementById('news-carousel');
    const authBtn = document.getElementById('auth-btn');

    // Nav & Profile Elements
    const appNav = document.getElementById('app-nav');
    const navDashboard = document.getElementById('nav-dashboard');
    const navProfile = document.getElementById('nav-profile');
    const dashboardView = document.getElementById('dashboard-view');
    const profileView = document.getElementById('profile-view');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileUsername = document.getElementById('profile-username');
    const profileBio = document.getElementById('profile-bio');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeEditProfileModal = document.getElementById('close-edit-profile-modal');
    const editProfileForm = document.getElementById('edit-profile-form');
    const editUsername = document.getElementById('edit-username');
    const editAvatar = document.getElementById('edit-avatar');
    const editBio = document.getElementById('edit-bio');
    const editProfileError = document.getElementById('edit-profile-error');

    // Chat Elements
    const chatHistory = document.getElementById('chat-history');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

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
    const detailsGenres = document.getElementById('details-genres');
    const detailsAddBtn = document.getElementById('details-add-btn');
    const detailsNewsBtn = document.getElementById('details-news-btn');

    // State
    let currentTab = 'In Progress';
    let libraryData = []; // Will hold the user's library
    let authToken = localStorage.getItem('token') || null;
    let currentSearchResults = [];
    let currentSelectedMedia = null;
    let currentSelectedId = null;

    // Initialize
    init();

    function init() {
        setupEventListeners();
        fetchNews();
        if (authToken) {
            authBtn.textContent = 'Sign Out';
            appNav.classList.remove('hidden');
            fetchLibrary();
        } else {
            libraryContent.innerHTML = `<div class="loader">Please Sign In to view your library.</div>`;
            appNav.classList.add('hidden');
        }
    }

    function setupEventListeners() {
        // Live Search as you type with Debounce
        function debounce(func, delay) {
            let timeoutId;
            return function (...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        }

        const debouncedSearch = debounce((query) => {
            performSearch(query);
        }, 400); // 400ms delay

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (query === '') {
                searchResults.innerHTML = '';
                searchResults.classList.add('hidden');
                return;
            }

            // Show loading state while waiting for debounce and fetch
            searchResults.innerHTML = `<div class="search-item">Searching...</div>`;
            searchResults.classList.remove('hidden');

            debouncedSearch(query);
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
                appNav.classList.add('hidden');
                switchToView('dashboard');
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
                appNav.classList.remove('hidden');
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

        detailsNewsBtn.addEventListener('click', () => {
            if (!currentSelectedMedia) return;
            const query = encodeURIComponent(`${currentSelectedMedia.title} ${currentSelectedMedia.type.toLowerCase()}`);
            window.open(`https://news.google.com/search?q=${query}`, '_blank');
        });

        const submitCommentBtn = document.getElementById('submit-comment-btn');
        const newCommentInput = document.getElementById('new-comment-input');

        submitCommentBtn.addEventListener('click', async () => {
            if (!authToken) {
                openAuthModal();
                return;
            }
            const content = newCommentInput.value.trim();
            if (!content || !currentSelectedId) return;

            const originalText = submitCommentBtn.textContent;
            submitCommentBtn.textContent = 'Posting...';
            submitCommentBtn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/catalog/${currentSelectedId}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ content })
                });

                if (res.ok) {
                    newCommentInput.value = '';
                    fetchAndRenderComments(currentSelectedId);
                } else {
                    alert('Failed to post comment.');
                }
            } catch (err) {
                console.error(err);
                alert('Error posting comment.');
            } finally {
                submitCommentBtn.textContent = originalText;
                submitCommentBtn.disabled = false;
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
            const response = await fetch(`${API_BASE}/catalog/search?q=${encodeURIComponent(query)}`);
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

                    currentSelectedId = id;
                    currentSelectedMedia = {
                        apiId: id,
                        title: item.title,
                        type: item.type || item.mediaType || 'ANIME',
                        imageUrl: item.coverImageUrl || item.image || item.coverImage
                    };

                    detailsImage.src = item.coverImageUrl || item.image || item.coverImage || '';
                    detailsTitle.textContent = item.title || 'Unknown Title';
                    detailsType.textContent = item.type || item.mediaType || 'Media';
                    detailsRelease.textContent = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'Unknown Year';
                    detailsGenres.innerHTML = (item.genres || []).map(g => `<span class="genre-badge">${g}</span>`).join('');

                    detailsModal.classList.remove('hidden');
                    searchResults.classList.add('hidden');

                    // Fetch Reviews and Rating
                    const detailsRating = document.getElementById('details-rating');
                    const detailsReviewsList = document.getElementById('details-reviews-list');
                    detailsRating.textContent = 'Loading...';
                    detailsReviewsList.innerHTML = '<div class="loader">Loading reviews...</div>';

                    try {
                        const reviewsRes = await fetch(`${API_BASE}/catalog/${id}/reviews`);
                        if (reviewsRes.ok) {
                            const data = await reviewsRes.json();
                            const averageScore = data.averageScore;
                            const reviews = data.reviews;

                            detailsRating.textContent = averageScore ? `${parseFloat(averageScore).toFixed(1)} / 100` : 'N/A';

                            if (reviews && reviews.length > 0) {
                                detailsReviewsList.innerHTML = reviews.map(r => `
                                    <div class="review-card">
                                        <div class="review-meta">${r.user?.email || 'Anonymous'} • Score: ${r.personalScore || 'N/A'}</div>
                                        <div class="review-text">${r.reviewText}</div>
                                    </div>
                                `).join('');
                            } else {
                                detailsReviewsList.innerHTML = '<div class="search-item" style="border:none; padding:1rem 0;">No reviews yet. Be the first to review!</div>';
                            }
                        } else {
                            detailsRating.textContent = 'N/A';
                            detailsReviewsList.innerHTML = '<div class="search-item" style="border:none;">Failed to load reviews.</div>';
                        }
                    } catch (error) {
                        console.error('Error fetching reviews:', error);
                        detailsRating.textContent = 'N/A';
                        detailsReviewsList.innerHTML = '<div class="search-item" style="border:none;">Error loading reviews.</div>';
                    }

                    fetchAndRenderComments(id);
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

    let carouselInterval;

    function renderNews(newsItems) {
        if (!newsItems || newsItems.length === 0) {
            newsCarousel.innerHTML = `<div class="loader">No recent news.</div>`;
            return;
        }

        newsCarousel.innerHTML = newsItems.map(item => {
            const bgImage = item.imageUrl || item.image || 'https://placehold.co/350x200/3b82f6/ffffff?text=News';
            return `
            <a href="${item.sourceUrl || item.url}" target="_blank" class="news-hero-card">
                <img src="${bgImage}" alt="${item.headline || item.title}" class="news-hero-image" />
                <div class="news-hero-overlay">
                    <div class="news-hero-meta">
                        <span>${item.publisher || item.source}</span>
                        <span>${new Date(item.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="news-hero-title">${item.headline || item.title}</div>
                </div>
            </a>
            `;
        }).join('');

        setupCarouselAutoScroll();
    }

    function setupCarouselAutoScroll() {
        if (carouselInterval) clearInterval(carouselInterval);

        const scrollStep = () => {
            if (!newsCarousel) return;
            const cardWidth = 350 + 16; // 350px width + 1rem (16px) gap
            const maxScroll = newsCarousel.scrollWidth - newsCarousel.clientWidth;

            if (newsCarousel.scrollLeft >= maxScroll - 10) {
                newsCarousel.scrollLeft = 0;
            } else {
                newsCarousel.scrollLeft += cardWidth;
            }
        };

        carouselInterval = setInterval(scrollStep, 5000);

        newsCarousel.addEventListener('mouseenter', () => clearInterval(carouselInterval));
        newsCarousel.addEventListener('mouseleave', () => {
            clearInterval(carouselInterval);
            carouselInterval = setInterval(scrollStep, 5000);
        });
    }

    function renderMockNews() {
        const mockNews = [
            { source: 'AnimeNewsNetwork', publishedAt: new Date().toISOString(), title: 'Demon Slayer Season 4 Premiere Date Announced', url: '#', imageUrl: 'https://placehold.co/350x200/8b5cf6/fff?text=Demon+Slayer' },
            { source: 'IGN', publishedAt: new Date(Date.now() - 86400000).toISOString(), title: 'The Last of Us Season 2 Casts Abby', url: '#', imageUrl: 'https://placehold.co/350x200/3b82f6/fff?text=TLOU' },
            { source: 'Crunchyroll', publishedAt: new Date(Date.now() - 172800000).toISOString(), title: 'Solo Leveling Episode 5 Breaks Records', url: '#', imageUrl: 'https://placehold.co/350x200/1e293b/fff?text=Solo+Leveling' },
            { source: 'Kotaku', publishedAt: new Date(Date.now() - 259200000).toISOString(), title: 'Elden Ring DLC Gameplay Revealed', url: '#', imageUrl: 'https://placehold.co/350x200/0f172a/fff?text=Elden+Ring' }
        ];
        renderNews(mockNews);
    }

    // --- Real-Time Community Chat Logic ---
    const supabase = typeof window.supabase !== 'undefined' ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
    let sessionUsername = null;

    if (supabase && chatHistory && chatForm) {
        // Fetch existing messages
        fetch(`${API_BASE}/chat`)
            .then(res => res.json())
            .then(data => {
                if (data.messages) {
                    data.messages.forEach(msg => appendChatMessage(msg));
                }
            })
            .catch(err => console.error('Failed to load chat history:', err));

        // Subscribe to real-time broadcasts
        const channel = supabase.channel('global-chat');
        channel
            .on('broadcast', { event: 'chatMessage' }, (payload) => {
                appendChatMessage(payload.payload);
            })
            .subscribe();

        function appendChatMessage(msg) {
            const isSelf = msg.username === sessionUsername;
            const bubble = document.createElement('div');
            bubble.className = `chat-message ${isSelf ? 'self' : ''}`;
            const timeString = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            bubble.innerHTML = `
                <div class="meta">
                    <strong>${msg.username}</strong>
                    <span>${timeString}</span>
                </div>
                <div class="chat-bubble">${msg.content}</div>
            `;
            chatHistory.appendChild(bubble);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }

        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = chatInput.value.trim();
            if (!content) return;

            if (!sessionUsername) {
                sessionUsername = prompt("Enter a username for the chat:") || 'Guest';
            }

            const msgObj = {
                username: sessionUsername,
                content: content,
                timestamp: new Date().toISOString()
            };

            // Broadcast instantly to others
            channel.send({
                type: 'broadcast',
                event: 'chatMessage',
                payload: msgObj
            });

            // Show locally
            appendChatMessage(msgObj);
            chatInput.value = '';

            // Save to database asynchronously
            fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: sessionUsername, content: content })
            }).catch(err => console.error('Failed to save message:', err));
        });
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

    async function fetchAndRenderComments(id) {
        const commentsList = document.getElementById('details-comments-list');
        commentsList.innerHTML = '<div class="loader">Loading comments...</div>';

        try {
            const res = await fetch(`${API_BASE}/catalog/${id}/comments`);
            if (res.ok) {
                const data = await res.json();
                const comments = data.data || [];

                if (comments.length === 0) {
                    commentsList.innerHTML = '<div class="search-item" style="border:none;">No comments yet. Start the conversation!</div>';
                    return;
                }

                commentsList.innerHTML = comments.map(c => renderCommentThread(c)).join('');

                // Attach reply listeners
                document.querySelectorAll('.reply-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const parentId = e.target.getAttribute('data-id');
                        const existingForm = document.getElementById(`reply-form-${parentId}`);
                        if (existingForm) {
                            existingForm.remove();
                            return;
                        }

                        const formHtml = `
                            <div class="reply-form-container" id="reply-form-${parentId}">
                                <textarea class="reply-input" id="reply-input-${parentId}" placeholder="Write a reply..."></textarea>
                                <button class="btn btn-secondary btn-small submit-reply-btn" style="margin-top:0.5rem;" data-parent="${parentId}">Reply</button>
                            </div>
                        `;
                        e.target.closest('.comment-thread').insertAdjacentHTML('beforeend', formHtml);

                        document.querySelector(`.submit-reply-btn[data-parent="${parentId}"]`).addEventListener('click', async (evt) => {
                            if (!authToken) {
                                openAuthModal();
                                return;
                            }
                            const replyBtn = evt.target;
                            const input = document.getElementById(`reply-input-${parentId}`);
                            const content = input.value.trim();
                            if (!content) return;

                            replyBtn.textContent = '...';
                            replyBtn.disabled = true;

                            try {
                                const postRes = await fetch(`${API_BASE}/catalog/${currentSelectedId}/comments`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${authToken}`
                                    },
                                    body: JSON.stringify({ content, parentId })
                                });

                                if (postRes.ok) {
                                    fetchAndRenderComments(currentSelectedId);
                                } else {
                                    alert('Failed to post reply.');
                                    replyBtn.textContent = 'Reply';
                                    replyBtn.disabled = false;
                                }
                            } catch (err) {
                                console.error(err);
                                alert('Error posting reply.');
                                replyBtn.textContent = 'Reply';
                                replyBtn.disabled = false;
                            }
                        });
                    });
                });
            } else {
                commentsList.innerHTML = '<div class="search-item" style="border:none;">Failed to load comments.</div>';
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            commentsList.innerHTML = '<div class="search-item" style="border:none;">Error loading comments.</div>';
        }
    }

    function renderCommentThread(comment) {
        const repliesHtml = (comment.replies || []).map(r => `
            <div class="comment-reply">
                <div class="comment-meta"><strong>${r.author?.email || 'Anonymous'}</strong> • ${new Date(r.createdAt).toLocaleDateString()}</div>
                <div class="comment-text">${r.content}</div>
            </div>
        `).join('');

        return `
            <div class="comment-thread">
                <div class="comment-card">
                    <div class="comment-meta"><strong>${comment.author?.email || 'Anonymous'}</strong> • ${new Date(comment.createdAt).toLocaleDateString()}</div>
                    <div class="comment-text">${comment.content}</div>
                    <div class="comment-actions">
                        <button class="reply-btn" data-id="${comment.id}">Reply</button>
                    </div>
                </div>
                ${repliesHtml}
            </div>
        `;
    }

    // --- Profile Hub Logic ---
    function switchToView(viewName) {
        if (viewName === 'dashboard') {
            dashboardView.classList.remove('hidden');
            profileView.classList.add('hidden');
            navDashboard.classList.add('active');
            navProfile.classList.remove('active');
        } else if (viewName === 'profile') {
            dashboardView.classList.add('hidden');
            profileView.classList.remove('hidden');
            navDashboard.classList.remove('active');
            navProfile.classList.add('active');
            fetchProfile();
        }
    }

    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        switchToView('dashboard');
    });

    navProfile.addEventListener('click', (e) => {
        e.preventDefault();
        switchToView('profile');
    });

    async function fetchProfile() {
        if (!authToken) return;
        try {
            const res = await fetch(`${API_BASE}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const { user } = await res.json();
                profileUsername.textContent = user.username || user.email.split('@')[0];
                profileBio.textContent = user.bio || "No bio available. Click 'Edit Profile' to add one.";
                if (user.avatarUrl) {
                    profileAvatar.src = user.avatarUrl;
                } else {
                    profileAvatar.src = `https://placehold.co/150x150/1e293b/ffffff?text=${(user.username || user.email).charAt(0).toUpperCase()}`;
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    }

    editProfileBtn.addEventListener('click', () => {
        editProfileModal.classList.remove('hidden');
    });

    closeEditProfileModal.addEventListener('click', () => {
        editProfileModal.classList.add('hidden');
        editProfileError.classList.add('hidden');
    });

    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = editUsername.value.trim();
        const avatarUrl = editAvatar.value.trim();
        const bio = editBio.value.trim();

        const payload = {};
        if (username) payload.username = username;
        if (avatarUrl) payload.avatarUrl = avatarUrl;
        if (bio) payload.bio = bio;

        try {
            const res = await fetch(`${API_BASE}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                editProfileModal.classList.add('hidden');
                editProfileError.classList.add('hidden');
                fetchProfile(); // Refresh UI
            } else {
                editProfileError.textContent = data.error || 'Failed to update profile.';
                editProfileError.classList.remove('hidden');
            }
        } catch (error) {
            editProfileError.textContent = 'An error occurred while saving.';
            editProfileError.classList.remove('hidden');
        }
    });
});
