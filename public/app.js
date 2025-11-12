document.addEventListener('DOMContentLoaded', () => {
    
    // --- Configuration ---
    const config = document.body.dataset;
    const API_KEY = config.apiKey;
    const USER = config.user;
    const REFRESH_INTERVAL_MS = config.refreshIntervalMs || 15000;
    
    // Check if config was loaded
    if (!API_KEY || API_KEY.startsWith('%%')) {
        console.error("Configuration Error: API Key not loaded from server.");
        document.getElementById('now-playing').innerHTML = `<p class="error-message"><b>Configuration Error:</b> Could not load API Key.</p>`;
        return;
    }

    const API_URL = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USER}&api_key=${API_KEY}&format=json&limit=10`;

    const originalPageTitle = document.title;

    // DOM elements
    const nowPlayingContainer = document.getElementById('now-playing');
    const recentTracksList = document.getElementById('recent-tracks');

    async function fetchTracks() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.recenttracks && data.recenttracks.track) {
                updateUI(data.recenttracks.track);
            } else if (data.error) {
                throw new Error(`Last.fm API error: ${data.message}`);
            } 
            else {
                throw new Error("Invalid API response structure.");
            }

        } catch (error) {
            console.error("Error fetching Last.fm data:", error);
            nowPlayingContainer.innerHTML = `<p class="error-message"><b>Error:</b> ${error.message}</p>`;
            recentTracksList.innerHTML = '';
        }
    }

    function updateUI(tracks) {
        if (!tracks || tracks.length === 0) {
            nowPlayingContainer.innerHTML = `<p class="not-playing">No recent track data available for this user.</p>`;
            recentTracksList.innerHTML = '';
            if (document.title !== originalPageTitle) {
                document.title = originalPageTitle;
            }

            return;
        }
        
        const nowPlayingTrack = tracks.find(track => track['@attr'] && track['@attr'].nowplaying === 'true');
        
        if (nowPlayingTrack) {
            const trackTitle = nowPlayingTrack.name;
            const trackArtist = nowPlayingTrack.artist['#text'];
            const newPageTitle = `${trackTitle} - ${trackArtist}`;
            if (document.title !== newPageTitle) {
                document.title = newPageTitle;
            }
            nowPlayingContainer.innerHTML = createTrackHTML(nowPlayingTrack, true);
            nowPlayingContainer.classList.add('now-playing-card');
        } else {
            if (document.title !== originalPageTitle) {
                document.title = originalPageTitle;
            }
            nowPlayingContainer.innerHTML = `<p class="not-playing">Not playing anything right now.</p>`;
            nowPlayingContainer.classList.remove('now-playing-card');
        }
        
        const recentTracks = tracks.filter(track => !(track['@attr'] && track['@attr'].nowplaying === 'true'));
        recentTracksList.innerHTML = '';
        
        if (recentTracks.length > 0) {
            recentTracks.forEach(track => {
                const li = document.createElement('li');
                li.className = 'track-item';
                li.innerHTML = createTrackHTML(track, false);
                recentTracksList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.innerHTML = `<p style="padding: 15px 20px; color: #888;">No other recent tracks.</p>`;
            recentTracksList.appendChild(li);
        }
    }

    function createTrackHTML(track, isNowPlaying) {
    
        const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"%3E%3Cpath d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/%3E%3C/svg%3E';
        
        const imageSize = isNowPlaying ? 'extralarge' : 'large';
        const image = track.image.find(img => img.size === imageSize) || track.image[track.image.length - 1];
        const hasImage = (image && image['#text']);
        const imageUrl = hasImage ? image['#text'] : placeholderSvg;
        const imageClass = hasImage ? 'album-art' : 'album-art is-placeholder';
        
        const trackUrl = track.url;
        const title = track.name;
        const artist = track.artist['#text'];
        const album = track.album['#text'];
        const nowPlayingLabel = isNowPlaying ? '<span class="now-playing-label">Now Playing</span>' : '';
        let dateText = '';
        if (!isNowPlaying && track.date && track.date.uts) {

            const timestampInMs = Number(track.date.uts) * 1000;
            const scrobbleDate = new Date(timestampInMs);
            const formattedDate = scrobbleDate.toLocaleString(undefined, { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
            });
            
            dateText = `<p class="track-date">Scrobbled: ${formattedDate}</p>`;
        }

        return `
            <img src="${imageUrl}" alt="Album art for ${album}" class="${imageClass}">
            <div class="track-info">
                ${nowPlayingLabel}
                <a href="${trackUrl}" target="_blank" class="track-title">${title}</a>
                <p class="track-artist">${artist}</p>
                <p class="track-album">${album}</p>
                ${dateText}
            </div>`;
    }

    // --- Initialization ---
    fetchTracks();
    setInterval(fetchTracks, REFRESH_INTERVAL_MS);
});