const AUTHORITIES = [
    {
        id: 'A',
        name: 'Security Officer A',
        lat: 12.9722,
        lon: 77.5950
    },
    {
        id: 'B',
        name: 'Security Officer B',
        lat: 12.9680,
        lon: 77.5920
    },
    {
        id: 'C',
        name: 'Security Officer C',
        lat: 12.9755,
        lon: 77.5990
    },
    {
        id: 'D',
        name: 'Security Officer D',
        lat: 12.9700,
        lon: 77.5900
    }
];

const DEFAULT_STUDENT_LOCATION = {
    lat: 12.9716,
    lon: 77.5946
};

// Haversine Formula to calculate distance between two points in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function findNearestAuthority(studentLat, studentLon) {
    let nearest = null;
    let minDistance = Infinity;

    const authoritiesWithDistance = AUTHORITIES.map(auth => {
        const distance = calculateDistance(studentLat, studentLon, auth.lat, auth.lon);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = auth;
        }
        return { ...auth, distance: (distance * 1000).toFixed(2) }; // distance in meters
    });

    // Sort by distance
    authoritiesWithDistance.sort((a, b) => a.distance - b.distance);

    return {
        nearest: authoritiesWithDistance[0],
        all: authoritiesWithDistance
    };
}

// LocalStorage Helpers
const Storage = {
    getIncidents: () => JSON.parse(localStorage.getItem('incidents')) || [],
    saveIncident: (incident) => {
        const incidents = Storage.getIncidents();
        incidents.push(incident);
        localStorage.setItem('incidents', JSON.stringify(incidents));
        // Trigger storage event manually for same-tab updates if needed
        window.dispatchEvent(new Event('storage'));
    },
    updateIncident: (updatedIncident) => {
        const incidents = Storage.getIncidents();
        const index = incidents.findIndex(i => i.id === updatedIncident.id);
        if (index !== -1) {
            incidents[index] = updatedIncident;
            localStorage.setItem('incidents', JSON.stringify(incidents));
            window.dispatchEvent(new Event('storage'));
        }
    },
    getReports: () => JSON.parse(localStorage.getItem('reports')) || [],
    saveReport: (report) => {
        const reports = Storage.getReports();
        reports.push(report);
        localStorage.setItem('reports', JSON.stringify(reports));
        window.dispatchEvent(new Event('storage'));
    }
};

// Utility to generate unique IDs
function generateId() {
    return 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}
