// Initial Data & State Management
const app = {
    state: {
        user: {
            username: 'Guest',
            isJoined: false,
            favorites: [],
            history: []
        },
        settings: {
            logo: 'https://via.placeholder.com/40',
            appName: 'StreamMini',
            tgChannel: 'https://t.me/manus_ai',
            botToken: '',
            theme: 'dark'
        },
        ads: {
            inline: { enabled: true, code: '<div style="padding:10px;text-align:center;color:#aaa;">Sponsored Content</div>' },
            play: { enabled: true, code: '<div style="color:white;text-align:center;">5s Play Ad Content</div>' },
            download: { enabled: true, code: '' },
            overlay: { enabled: true, code: '<div style="padding:10px;background:#333;color:white;border-radius:5px;">Check this out!</div>' }
        },
        videos: [],
        categories: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi'],
        currentPage: 'home-page'
    },

    init() {
        this.loadData();
        this.initTelegram();
        this.bindEvents();
        this.render();
        // Channel join check disabled
    },

    loadData() {
        const savedData = localStorage.getItem('stream_mini_app_data');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            this.state.videos = parsed.videos || [];
            this.state.settings = { ...this.state.settings, ...parsed.settings };
            this.state.ads = { ...this.state.ads, ...parsed.ads };
        }
        
        const userData = localStorage.getItem('stream_mini_user_data');
        if (userData) {
            this.state.user = { ...this.state.user, ...JSON.parse(userData) };
        }
    },

    saveUserData() {
        localStorage.setItem('stream_mini_user_data', JSON.stringify(this.state.user));
    },

    initTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand();
            tg.ready();
            
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                this.state.user.username = tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name;
                document.getElementById('username').textContent = this.state.user.username;
            }
        }
    },

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const pageId = item.getAttribute('data-page');
                this.navigateTo(pageId);
            });
        });

        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Category Filter
        document.querySelector('.categories-scroll').addEventListener('click', (e) => {
            if (e.target.classList.contains('category')) {
                document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                this.filterByCategory(e.target.getAttribute('data-category'));
            }
        });

        // Favorite Toggle
        document.getElementById('favorite-btn').addEventListener('click', () => {
            this.toggleFavorite(this.state.currentVideoId);
        });

        // Download
        document.getElementById('download-btn').addEventListener('click', () => {
            this.handleDownload();
        });

        // Comment
        document.getElementById('post-comment').addEventListener('click', () => {
            this.addComment();
        });

        // Channel Join Check
        document.getElementById('check-join-btn').addEventListener('click', () => {
            // In a real app, you'd verify via bot API
            // For MVP, we'll just simulate success
            this.state.user.isJoined = true;
            this.saveUserData();
            document.getElementById('join-channel-overlay').classList.add('hidden');
        });
    },

    checkChannelJoin() {
        // Disabled - no channel join required
    },

    navigateTo(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        document.getElementById(pageId).classList.remove('hidden');
        
        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.toggle('active', n.getAttribute('data-page') === pageId);
        });

        this.state.currentPage = pageId;
        
        if (pageId === 'home-page') this.renderHome();
        if (pageId === 'favorites-page') this.renderFavorites();
        if (pageId === 'history-page') this.renderHistory();
        
        window.scrollTo(0, 0);
    },

    goBack() {
        this.navigateTo('home-page');
        document.getElementById('video-iframe').src = ''; // Stop video
    },

    render() {
        // Set basic settings
        document.getElementById('app-logo').src = this.state.settings.logo;
        document.getElementById('app-name').textContent = this.state.settings.appName;
        
        this.renderCategories();
        this.renderHome();
    },

    renderCategories() {
        const container = document.querySelector('.categories-scroll');
        container.innerHTML = '<div class="category active" data-category="all">All</div>';
        
        this.state.categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'category';
            div.setAttribute('data-category', cat);
            div.textContent = cat;
            container.appendChild(div);
        });
    },

    renderHome() {
        const trending = [...this.state.videos].sort((a, b) => b.views - a.views).slice(0, 5);
        const latest = [...this.state.videos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const mostViewed = [...this.state.videos].sort((a, b) => b.views - a.views);

        this.renderVideoGrid('trending-grid', trending, true);
        this.renderVideoGrid('latest-grid', latest);
        this.renderVideoGrid('most-viewed-grid', mostViewed);
        
        this.injectAds();
    },

    renderVideoGrid(containerId, videos, isHorizontal = false) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (videos.length === 0) {
            container.innerHTML = '<p style="padding:20px;color:#aaa;">No videos found.</p>';
            return;
        }

        videos.forEach((video, index) => {
            // Add inline ad every 8-10 videos for vertical grids
            if (!isHorizontal && index > 0 && index % 8 === 0) {
                const adDiv = document.createElement('div');
                adDiv.className = 'ad-container inline-ad';
                adDiv.innerHTML = this.state.ads.inline.enabled ? this.state.ads.inline.code : '';
                container.appendChild(adDiv);
            }

            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <div class="thumbnail-container">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    <span class="duration">${video.duration || '0:00'}</span>
                </div>
                <div class="video-card-info">
                    <h4>${video.title}</h4>
                    <div class="video-card-meta">
                        <span>${this.formatViews(video.views)} views</span> • 
                        <span>${this.formatDate(video.createdAt)}</span>
                    </div>
                </div>
            `;
            card.onclick = () => this.openPlayer(video.id);
            container.appendChild(card);
        });
    },

    openPlayer(videoId) {
        const video = this.state.videos.find(v => v.id === videoId);
        if (!video) return;

        this.state.currentVideoId = videoId;
        this.state.currentVideo = video;
        
        // Update View Count
        video.views = (video.views || 0) + 1;
        this.updateHistory(video);
        this.saveGlobalData();

        // UI Updates
        document.getElementById('player-title').textContent = video.title;
        document.getElementById('player-views').innerHTML = `<i class="fas fa-eye"></i> ${this.formatViews(video.views)} views`;
        document.getElementById('player-date').innerHTML = `<i class="fas fa-calendar"></i> ${this.formatDate(video.createdAt)}`;
        document.getElementById('player-description').textContent = video.description;
        
        // Tags
        const tagsContainer = document.getElementById('player-tags');
        tagsContainer.innerHTML = '';
        if (video.tags) {
            video.tags.split(',').forEach(tag => {
                const span = document.createElement('span');
                span.className = 'tag';
                span.textContent = `#${tag.trim()}`;
                tagsContainer.appendChild(span);
            });
        }

        // Favorites Button State
        const isFav = this.state.user.favorites.includes(videoId);
        document.getElementById('favorite-btn').classList.toggle('active', isFav);
        document.getElementById('favorite-btn').innerHTML = isFav ? '<i class="fas fa-heart"></i> Favorited' : '<i class="far fa-heart"></i> Favorite';

        // Ads
        this.showPlayAd(() => {
            document.getElementById('video-iframe').src = video.embedUrl;
        });

        const overlayAd = document.getElementById('player-overlay-ad');
        overlayAd.innerHTML = this.state.ads.overlay.enabled ? this.state.ads.overlay.code : '';
        overlayAd.classList.toggle('hidden', !this.state.ads.overlay.enabled);

        // Related Videos
        const related = this.state.videos.filter(v => v.id !== videoId && v.category === video.category).slice(0, 4);
        this.renderVideoGrid('related-grid', related);

        this.navigateTo('player-page');
    },

    showPlayAd(callback) {
        if (!this.state.ads.play.enabled) {
            callback();
            return;
        }

        const overlay = document.getElementById('play-ad-overlay');
        const countdown = document.getElementById('ad-countdown');
        const content = document.getElementById('play-ad-content');
        
        content.innerHTML = this.state.ads.play.code;
        overlay.classList.remove('hidden');
        
        let timeLeft = 5;
        countdown.textContent = timeLeft;
        
        const timer = setInterval(() => {
            timeLeft--;
            countdown.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timer);
                overlay.classList.add('hidden');
                callback();
            }
        }, 1000);
    },

    handleDownload() {
        if (this.state.currentVideo && this.state.currentVideo.downloadUrl) {
            // Show ad before download if enabled
            if (this.state.ads.download.enabled) {
                alert('Ad before download: ' + this.state.ads.download.code);
            }
            window.open(this.state.currentVideo.downloadUrl, '_blank');
        } else {
            alert('Download link not available.');
        }
    },

    toggleFavorite(videoId) {
        const index = this.state.user.favorites.indexOf(videoId);
        if (index > -1) {
            this.state.user.favorites.splice(index, 1);
        } else {
            this.state.user.favorites.push(videoId);
        }
        this.saveUserData();
        
        const isFav = this.state.user.favorites.includes(videoId);
        document.getElementById('favorite-btn').classList.toggle('active', isFav);
        document.getElementById('favorite-btn').innerHTML = isFav ? '<i class="fas fa-heart"></i> Favorited' : '<i class="far fa-heart"></i> Favorite';
    },

    updateHistory(video) {
        this.state.user.history = this.state.user.history.filter(id => id !== video.id);
        this.state.user.history.unshift(video.id);
        if (this.state.user.history.length > 20) this.state.user.history.pop();
        this.saveUserData();
    },

    renderFavorites() {
        const favs = this.state.videos.filter(v => this.state.user.favorites.includes(v.id));
        this.renderVideoGrid('favorites-grid', favs);
    },

    renderHistory() {
        const history = this.state.user.history.map(id => this.state.videos.find(v => v.id === id)).filter(v => v);
        this.renderVideoGrid('history-grid', history);
    },

    handleSearch(query) {
        if (!query) {
            this.renderHome();
            return;
        }
        const filtered = this.state.videos.filter(v => 
            v.title.toLowerCase().includes(query.toLowerCase()) || 
            v.tags.toLowerCase().includes(query.toLowerCase())
        );
        this.renderVideoGrid('latest-grid', filtered);
        document.getElementById('trending-section').classList.add('hidden');
        document.getElementById('most-viewed-section').classList.add('hidden');
    },

    filterByCategory(cat) {
        if (cat === 'all') {
            document.getElementById('trending-section').classList.remove('hidden');
            document.getElementById('most-viewed-section').classList.remove('hidden');
            this.renderHome();
        } else {
            const filtered = this.state.videos.filter(v => v.category === cat);
            this.renderVideoGrid('latest-grid', filtered);
            document.getElementById('trending-section').classList.add('hidden');
            document.getElementById('most-viewed-section').classList.add('hidden');
        }
    },

    injectAds() {
        const topAd = document.getElementById('top-ad');
        if (this.state.ads.inline.enabled) {
            topAd.innerHTML = this.state.ads.inline.code;
            topAd.classList.remove('hidden');
        } else {
            topAd.classList.add('hidden');
        }
    },

    formatViews(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num || 0;
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        return Math.floor(diff / 86400) + 'd ago';
    },

    saveGlobalData() {
        const data = {
            videos: this.state.videos,
            settings: this.state.settings,
            ads: this.state.ads
        };
        localStorage.setItem('stream_mini_app_data', JSON.stringify(data));
    },

    addComment() {
        const input = document.getElementById('new-comment');
        const text = input.value.trim();
        if (!text) return;
        
        const comment = {
            username: this.state.user.username,
            text: text,
            date: new Date()
        };
        
        if (!this.state.currentVideo.comments) this.state.currentVideo.comments = [];
        this.state.currentVideo.comments.unshift(comment);
        this.saveGlobalData();
        
        input.value = '';
        this.renderComments();
    },

    renderComments() {
        const list = document.getElementById('comments-list');
        list.innerHTML = '';
        const comments = this.state.currentVideo.comments || [];
        
        comments.forEach(c => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-avatar">${c.username[0].toUpperCase()}</div>
                <div class="comment-body">
                    <h5>${c.username}</h5>
                    <p>${c.text}</p>
                </div>
            `;
            list.appendChild(div);
        });
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
