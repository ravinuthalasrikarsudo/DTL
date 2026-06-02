document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    function showSection(sectionId) {
        sections.forEach(s => s.style.display = 'none');
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Update active nav link
        navLinks.forEach(link => {
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        if (sectionId === 'dashboard') {
            updateDashboardStats();
        } else if (sectionId === 'my-reports') {
            updateReportsTable();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // SOS Functionality
    const sosBtn = document.getElementById('sos-btn');
    const sosModal = document.getElementById('sos-modal');
    const confirmSosBtn = document.getElementById('confirm-sos');
    const cancelSosBtn = document.getElementById('cancel-sos');

    sosBtn.addEventListener('click', () => {
        sosModal.style.display = 'flex';
    });

    cancelSosBtn.addEventListener('click', () => {
        sosModal.style.display = 'none';
    });

    confirmSosBtn.addEventListener('click', () => {
        handleSOS();
        sosModal.style.display = 'none';
    });

    async function handleSOS() {
        // 1. Get Location
        let location = { ...DEFAULT_STUDENT_LOCATION };
        
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            location = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
        } catch (error) {
            console.warn("Geolocation denied or failed, using simulated coordinates.", error);
        }

        // 2. Find Nearest Authority
        const { nearest } = findNearestAuthority(location.lat, location.lon);

        // 3. Create Incident
        const incident = {
            id: generateId(),
            studentName: 'Student User',
            studentId: '1RV24ET040',
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            lat: location.lat,
            lon: location.lon,
            status: 'Pending',
            priority: 'Critical',
            assignedAuthority: nearest.name,
            authorityLat: nearest.lat,
            authorityLon: nearest.lon,
            distance: nearest.distance,
            createdAt: new Date().getTime()
        };

        // 4. Store Incident
        Storage.saveIncident(incident);

        // 5. Show Success Screen
        document.getElementById('assigned-auth-name').textContent = nearest.name;
        document.getElementById('assigned-auth-dist').textContent = `${nearest.distance} meters`;
        document.getElementById('assigned-auth-status').textContent = 'Awaiting Response';
        
        showSection('sos-success');
    }

    // Dashboard Stats
    function updateDashboardStats() {
        const incidents = Storage.getIncidents();
        const reports = Storage.getReports();
        
        const sosAlerts = incidents.length;
        const totalReports = reports.length;
        const pending = incidents.filter(i => i.status !== 'Resolved').length;
        const resolved = incidents.filter(i => i.status === 'Resolved').length;

        document.getElementById('total-reports-val').textContent = totalReports;
        document.getElementById('sos-alerts-val').textContent = sosAlerts;
        document.getElementById('pending-cases-val').textContent = pending;
        document.getElementById('resolved-cases-val').textContent = resolved;

        // Recent Activity
        const recentActivityList = document.getElementById('recent-activity-list');
        const allActivity = [
            ...incidents.map(i => ({ ...i, type: 'SOS' })),
            ...reports.map(r => ({ ...r, type: 'Report' }))
        ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        if (allActivity.length > 0) {
            recentActivityList.innerHTML = allActivity.slice(0, 5).map(activity => `
                <div style="padding: 0.8rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${activity.type === 'SOS' ? 'SOS Alert' : activity.category}</strong>
                        <p style="font-size: 0.8rem; color: #888;">${activity.date} ${activity.time || ''}</p>
                    </div>
                    <span class="badge badge-status-${activity.status.toLowerCase()}">${activity.status}</span>
                </div>
            `).join('');
        } else {
            recentActivityList.innerHTML = '<p style="color: #888; padding: 1rem 0;">No recent activity found.</p>';
        }
    }

    // Incident Reporting
    const incidentForm = document.getElementById('incident-form');
    if (incidentForm) {
        incidentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const report = {
                id: generateId(),
                category: document.getElementById('category').value,
                description: document.getElementById('description').value,
                location: document.getElementById('location').value,
                priority: document.getElementById('priority').value,
                date: document.getElementById('date').value,
                status: 'Pending',
                createdAt: new Date().getTime()
            };

            Storage.saveReport(report);
            alert('Incident report submitted successfully!');
            incidentForm.reset();
            showSection('dashboard');
        });
    }

    function updateReportsTable() {
        const reports = Storage.getReports();
        const tableBody = document.getElementById('reports-table-body');
        
        if (reports.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No reports found.</td></tr>';
            return;
        }

        tableBody.innerHTML = reports.reverse().map(report => `
            <tr>
                <td>${report.id}</td>
                <td>${report.category}</td>
                <td><span class="badge badge-priority-${report.priority.toLowerCase()}">${report.priority}</span></td>
                <td>${report.date}</td>
                <td><span class="badge badge-status-${report.status.toLowerCase()}">${report.status}</span></td>
            </tr>
        `).join('');
    }

    // Safe Walk
    const startSafeWalkBtn = document.getElementById('start-safe-walk');
    const stopSafeWalkBtn = document.getElementById('stop-safe-walk');
    const safeWalkForm = document.getElementById('safe-walk-form-container');
    const safeWalkActive = document.getElementById('safe-walk-active');

    if (startSafeWalkBtn) {
        startSafeWalkBtn.addEventListener('click', () => {
            safeWalkForm.style.display = 'none';
            safeWalkActive.style.display = 'block';
        });
    }

    if (stopSafeWalkBtn) {
        stopSafeWalkBtn.addEventListener('click', () => {
            safeWalkActive.style.display = 'none';
            safeWalkForm.style.display = 'block';
            alert('Safe Walk ended. Glad you reached safely!');
        });
    }

    // Initial load
    updateDashboardStats();

    // Listen for storage changes to update stats in real-time
    window.addEventListener('storage', () => {
        updateDashboardStats();
        if (document.getElementById('my-reports-section').style.display !== 'none') {
            updateReportsTable();
        }
    });
});
