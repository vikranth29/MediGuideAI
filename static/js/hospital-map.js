/**
 * MediGuide AI - Hospital Map & Facility Locator (hospital-map.js)
 * -----------------------------------------------------------------
 * Handles geolocation, address search, Leaflet map rendering,
 * and hospital search via /api/nearby-hospitals.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchForm = document.getElementById('hospitalSearchForm');
    const addressInput = document.getElementById('addressInput');
    const searchBtn = document.getElementById('searchBtn');
    const useLocationBtn = document.getElementById('useLocationBtn');
    const statusSpinner = document.getElementById('statusSpinner');
    const statusMessage = document.getElementById('statusMessage');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    const emptyState = document.getElementById('emptyState');
    const resultsSection = document.getElementById('resultsSection');
    const hospitalsList = document.getElementById('hospitalsList');
    const resultsCount = document.getElementById('resultsCount');
    const originLabel = document.getElementById('originLabel');

    // Leaflet Map state
    let map = null;
    let markersLayer = null;

    // Fix default Leaflet marker assets when loaded via CDN
    if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
    }

    /**
     * Initialize or update Leaflet map
     */
    function initOrUpdateMap(lat, lon, zoom = 13) {
        const mapContainer = document.getElementById('hospitalMap');
        if (!mapContainer || typeof L === 'undefined') return;

        if (!map) {
            map = L.map('hospitalMap', {
                scrollWheelZoom: false,
            }).setView([lat, lon], zoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
            }).addTo(map);

            markersLayer = L.featureGroup().addTo(map);
        } else {
            map.setView([lat, lon], zoom);
            if (markersLayer) {
                markersLayer.clearLayers();
            }
        }

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 150);
    }

    /**
     * Create custom Leaflet divIcons for User & Hospital markers
     */
    function createUserIcon() {
        return L.divIcon({
            className: 'custom-user-marker-wrapper',
            html: `
                <div class="user-marker-dot">
                    <span class="user-marker-pulse"></span>
                    <i class="bi bi-person-fill text-white"></i>
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18],
        });
    }

    function createHospitalIcon() {
        return L.divIcon({
            className: 'custom-hospital-marker-wrapper',
            html: `
                <div class="hospital-marker-pin shadow">
                    <i class="bi bi-hospital-fill text-white"></i>
                </div>
            `,
            iconSize: [34, 40],
            iconAnchor: [17, 40],
            popupAnchor: [0, -38],
        });
    }

    /**
     * UI State Helpers
     */
    function setLoading(isLoading, message = 'Searching for nearby hospitals...') {
        if (statusSpinner) {
            statusSpinner.classList.toggle('d-none', !isLoading);
        }
        if (statusMessage) {
            statusMessage.textContent = message;
        }
        if (searchBtn) searchBtn.disabled = isLoading;
        if (useLocationBtn) useLocationBtn.disabled = isLoading;

        if (isLoading) {
            hideError();
            if (emptyState) emptyState.classList.add('d-none');
        }
    }

    function showError(msg) {
        if (errorMessage) errorMessage.textContent = msg;
        if (errorAlert) errorAlert.classList.remove('d-none');
    }

    function hideError() {
        if (errorAlert) errorAlert.classList.add('d-none');
    }

    /**
     * Render the list of hospitals below the map
     */
    function renderHospitalsList(hospitals) {
        if (!hospitalsList) return;
        hospitalsList.innerHTML = '';

        hospitals.forEach((h, index) => {
            const card = document.createElement('div');
            card.className = 'col-12 col-md-6 col-lg-4';

            const phoneHtml = h.phone
                ? `<div class="d-flex align-items-center gap-2 text-secondary small mb-3">
                     <i class="bi bi-telephone-fill text-success"></i>
                     <a href="tel:${escapeHtml(h.phone)}" class="text-decoration-none text-secondary fw-medium">${escapeHtml(h.phone)}</a>
                   </div>`
                : '';

            const addressText = h.address ? escapeHtml(h.address) : 'Address not listed in directory';
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`;

            card.innerHTML = `
                <div class="card h-100 border-0 shadow-sm rounded-4 p-4 hospital-card bg-white position-relative">
                    <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
                        <h5 class="fw-bold mb-0 text-navy-800 text-truncate" title="${escapeHtml(h.name)}">
                            ${escapeHtml(h.name)}
                        </h5>
                        <span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fw-semibold flex-shrink-0">
                            <i class="bi bi-geo-alt-fill me-1"></i>${h.distance_km} km
                        </span>
                    </div>

                    <p class="text-secondary small mb-2 flex-grow-1">
                        <i class="bi bi-pin-map text-danger me-1"></i>${addressText}
                    </p>

                    ${phoneHtml}

                    <div class="d-flex gap-2 pt-3 border-top mt-auto">
                        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary rounded-pill btn-sm flex-grow-1 fw-semibold">
                            <i class="bi bi-arrow-up-right-circle me-1"></i> Get Directions
                        </a>
                        <button type="button" class="btn btn-outline-secondary rounded-pill btn-sm px-3 focus-marker-btn" data-index="${index}" title="Focus on map">
                            <i class="bi bi-map"></i>
                        </button>
                    </div>
                </div>
            `;

            hospitalsList.appendChild(card);
        });

        // Add click listener for "Focus on map" buttons
        hospitalsList.querySelectorAll('.focus-marker-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                if (!isNaN(idx) && hospitals[idx]) {
                    const hosp = hospitals[idx];
                    if (map) {
                        map.setView([hosp.lat, hosp.lon], 16);
                        if (hosp._marker) {
                            hosp._marker.openPopup();
                        }
                    }
                    const mapEl = document.getElementById('hospitalMap');
                    if (mapEl) {
                        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            });
        });
    }

    /**
     * Fetch nearby hospitals via POST /api/nearby-hospitals
     */
    async function fetchNearbyHospitals(payload) {
        setLoading(true, payload.address ? `Locating "${payload.address}"...` : 'Searching hospitals near your location...');
        hideError();

        try {
            const resp = await fetch('/api/nearby-hospitals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await resp.json();

            if (!resp.ok) {
                const errMsg = data && data.error ? data.error : `Search failed (Status ${resp.status})`;
                showError(errMsg);
                setLoading(false);
                return;
            }

            const origin = data.origin || {};
            const hospitals = Array.isArray(data.hospitals) ? data.hospitals : [];

            if (resultsSection) {
                resultsSection.classList.remove('d-none');
            }

            if (originLabel && origin.display_name) {
                originLabel.textContent = `Showing results near: ${origin.display_name}`;
            }

            if (resultsCount) {
                resultsCount.textContent = `${hospitals.length} hospital${hospitals.length === 1 ? '' : 's'} found within 5km`;
            }

            // Initialize map with origin coords
            if (origin.lat && origin.lon) {
                initOrUpdateMap(origin.lat, origin.lon);

                // Add User Marker
                if (typeof L !== 'undefined' && markersLayer) {
                    const userMarker = L.marker([origin.lat, origin.lon], { icon: createUserIcon() })
                        .bindPopup(`
                            <div class="text-center p-1">
                                <span class="badge bg-primary text-white rounded-pill px-2 py-1 mb-1">Your Location</span>
                                <p class="small text-muted mb-0">${escapeHtml(origin.display_name || 'Selected Search Origin')}</p>
                            </div>
                        `);
                    markersLayer.addLayer(userMarker);
                }
            }

            // Empty state check
            if (hospitals.length === 0) {
                if (emptyState) emptyState.classList.remove('d-none');
                if (hospitalsList) hospitalsList.innerHTML = '';
            } else {
                if (emptyState) emptyState.classList.add('d-none');

                // Add hospital markers
                if (typeof L !== 'undefined' && markersLayer) {
                    hospitals.forEach(h => {
                        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`;
                        const popupContent = `
                            <div class="p-1" style="min-width: 190px;">
                                <h6 class="fw-bold mb-1">${escapeHtml(h.name)}</h6>
                                <p class="small text-muted mb-1">${escapeHtml(h.address || 'Address not listed')}</p>
                                ${h.phone ? `<p class="small text-secondary mb-2"><i class="bi bi-telephone-fill text-success me-1"></i>${escapeHtml(h.phone)}</p>` : ''}
                                <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                    <span class="badge bg-primary-subtle text-primary rounded-pill px-2 py-1">${h.distance_km} km</span>
                                    <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary rounded-pill px-2 py-1 small text-white text-decoration-none">
                                        Directions <i class="bi bi-arrow-up-right"></i>
                                    </a>
                                </div>
                            </div>
                        `;

                        const marker = L.marker([h.lat, h.lon], { icon: createHospitalIcon() })
                            .bindPopup(popupContent);

                        h._marker = marker;
                        markersLayer.addLayer(marker);
                    });

                    // Fit bounds to show user + all hospitals
                    if (markersLayer.getLayers().length > 0) {
                        map.fitBounds(markersLayer.getBounds().pad(0.12));
                    }
                }

                renderHospitalsList(hospitals);
            }
        } catch (err) {
            console.error('Hospital search fetch error:', err);
            showError('Unable to connect to hospital service. Please check your network connection and try again.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Helper: Escape HTML strings to prevent XSS
     */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Event: Use My Location (Geolocation API)
     */
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                showError('Geolocation is not supported by your browser. Please use the address search bar.');
                return;
            }

            setLoading(true, 'Detecting your device location...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    fetchNearbyHospitals({
                        lat: lat,
                        lon: lon,
                        display_name: 'Current Location',
                    });
                },
                (error) => {
                    setLoading(false);
                    let msg = 'Could not retrieve your location. Please enter a city or address manually.';
                    if (error.code === error.PERMISSION_DENIED) {
                        msg = 'Location permission was denied. Please allow location access or type an address into the search box.';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        msg = 'Location information is currently unavailable. Please search with an address.';
                    } else if (error.code === error.TIMEOUT) {
                        msg = 'Location request timed out. Please try searching with an address.';
                    }
                    showError(msg);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                }
            );
        });
    }

    /**
     * Event: Search by Address Form Submit
     */
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const address = addressInput ? addressInput.value.trim() : '';
            if (!address) {
                showError('Please enter a city, area name, or address to search.');
                if (addressInput) addressInput.focus();
                return;
            }

            fetchNearbyHospitals({ address: address });
        });
    }
});
