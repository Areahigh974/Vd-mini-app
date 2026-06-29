const admin = {
    data: {
        videos: [],
        settings: {},
        ads: {}
    },

    init() {
        this.loadData();
        this.bindEvents();
        this.render();
    },

    loadData() {
        const savedData = localStorage.getItem('stream_mini_app_data');
        if (savedData) {
            this.data = JSON.parse(savedData);
        } else {
            // Default empty state if no data exists
            this.data = {
                videos: [],
                settings: {
                    logo: 'https://via.placeholder.com/40',
                    appName: 'StreamMini',
                    tgChannel: 'https://t.me/manus_ai',
                    botToken: '',
                    theme: 'dark'
                },
                ads: {
                    inline: { enabled: true, code: '' },
                    play: { enabled: true, code: '' },
                    download: { enabled: true, code: '' },
                    overlay: { enabled: true, code: '' }
                }
            };
        }
    },

    saveData() {
        localStorage.setItem('stream_mini_app_data', JSON.stringify(this.data));
        alert('Data saved successfully!');
    },

    bindEvents() {
        // Tab Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const tabId = link.getAttribute('data-tab');
                document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
                document.getElementById(tabId).classList.remove('hidden');
                
                if (tabId === 'dashboard-tab') this.renderDashboard();
                if (tabId === 'manage-videos-tab') this.renderVideosList();
            });
        });

        // Add Video Form
        document.getElementById('add-video-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addVideo();
        });

        // Ads Save
        document.getElementById('save-ads-btn').addEventListener('click', () => {
            this.saveAds();
        });

        // Settings Save
        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
    },

    render() {
        this.renderDashboard();
        this.renderCategoriesSelect();
        this.fillSettings();
        this.fillAds();
    },

    renderDashboard() {
        document.getElementById('total-videos').textContent = this.data.videos.length;
        
        const totalViews = this.data.videos.reduce((sum, v) => sum + (v.views || 0), 0);
        document.getElementById('total-views').textContent = totalViews;
        
        // Mock data for others
        document.getElementById('total-downloads').textContent = Math.floor(totalViews * 0.1);
        document.getElementById('active-users').textContent = Math.floor(totalViews * 0.05) + 1;

        // Top Videos
        const topVideos = [...this.data.videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
        const list = document.getElementById('top-videos-list');
        list.innerHTML = '';
        
        topVideos.forEach(v => {
            const div = document.createElement('div');
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.innerHTML = `<strong>${v.title}</strong> - ${v.views || 0} views`;
            list.appendChild(div);
        });
    },

    renderCategoriesSelect() {
        const select = document.getElementById('video-category');
        const categories = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Documentary'];
        select.innerHTML = '';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });
    },

    addVideo() {
        const newVideo = {
            id: 'v' + Date.now(),
            title: document.getElementById('video-title').value,
            category: document.getElementById('video-category').value,
            duration: document.getElementById('video-duration').value || '0:00',
            embedUrl: document.getElementById('video-embed').value,
            thumbnail: document.getElementById('video-thumb').value,
            downloadUrl: document.getElementById('video-download').value,
            tags: document.getElementById('video-tags').value,
            description: document.getElementById('video-desc').value,
            views: 0,
            createdAt: new Date().toISOString()
        };

        this.data.videos.unshift(newVideo);
        this.saveData();
        document.getElementById('add-video-form').reset();
    },

    renderVideosList() {
        const tbody = document.getElementById('videos-list-body');
        tbody.innerHTML = '';

        this.data.videos.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${v.thumbnail}" class="table-thumb"></td>
                <td>${v.title}</td>
                <td>${v.category}</td>
                <td>${v.views || 0}</td>
                <td class="actions-cell">
                    <button class="btn-edit" onclick="admin.editVideo('${v.id}')">Edit</button>
                    <button class="btn-delete" onclick="admin.deleteVideo('${v.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    deleteVideo(id) {
        if (confirm('Are you sure you want to delete this video?')) {
            this.data.videos = this.data.videos.filter(v => v.id !== id);
            this.saveData();
            this.renderVideosList();
        }
    },

    editVideo(id) {
        const v = this.data.videos.find(v => v.id === id);
        if (!v) return;
        
        // Fill form with data
        document.getElementById('video-title').value = v.title;
        document.getElementById('video-category').value = v.category;
        document.getElementById('video-duration').value = v.duration;
        document.getElementById('video-embed').value = v.embedUrl;
        document.getElementById('video-thumb').value = v.thumbnail;
        document.getElementById('video-download').value = v.downloadUrl;
        document.getElementById('video-tags').value = v.tags;
        document.getElementById('video-desc').value = v.description;
        
        // Change button to update
        const submitBtn = document.querySelector('#add-video-tab .btn-submit');
        submitBtn.textContent = 'Update Video';
        
        // Remove old video and add new one on submit (simplest way for MVP)
        this.data.videos = this.data.videos.filter(vid => vid.id !== id);
        
        // Switch tab
        document.querySelector('[data-tab="add-video-tab"]').click();
    },

    fillAds() {
        const ads = this.data.ads;
        document.getElementById('ad-inline-toggle').checked = ads.inline.enabled;
        document.getElementById('ad-inline-code').value = ads.inline.code;
        
        document.getElementById('ad-play-toggle').checked = ads.play.enabled;
        document.getElementById('ad-play-code').value = ads.play.code;
        
        document.getElementById('ad-download-toggle').checked = ads.download.enabled;
        document.getElementById('ad-download-code').value = ads.download.code;
        
        document.getElementById('ad-overlay-toggle').checked = ads.overlay.enabled;
        document.getElementById('ad-overlay-code').value = ads.overlay.code;
    },

    saveAds() {
        this.data.ads = {
            inline: { enabled: document.getElementById('ad-inline-toggle').checked, code: document.getElementById('ad-inline-code').value },
            play: { enabled: document.getElementById('ad-play-toggle').checked, code: document.getElementById('ad-play-code').value },
            download: { enabled: document.getElementById('ad-download-toggle').checked, code: document.getElementById('ad-download-code').value },
            overlay: { enabled: document.getElementById('ad-overlay-toggle').checked, code: document.getElementById('ad-overlay-code').value }
        };
        this.saveData();
    },

    fillSettings() {
        const s = this.data.settings;
        document.getElementById('setting-app-name').value = s.appName || '';
        document.getElementById('setting-logo-url').value = s.logo || '';
        document.getElementById('setting-tg-channel').value = s.tgChannel || '';
        document.getElementById('setting-bot-token').value = s.botToken || '';
        document.getElementById('setting-theme').value = s.theme || 'dark';
    },

    saveSettings() {
        this.data.settings = {
            appName: document.getElementById('setting-app-name').value,
            logo: document.getElementById('setting-logo-url').value,
            tgChannel: document.getElementById('setting-tg-channel').value,
            botToken: document.getElementById('setting-bot-token').value,
            theme: document.getElementById('setting-theme').value
        };
        this.saveData();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    admin.init();
});
