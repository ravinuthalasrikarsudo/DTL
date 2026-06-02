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
            updateDashboard();
        } else if (sectionId === 'live-alerts') {
            updateLiveAlerts();
        } else if (sectionId === 'assigned-cases') {
            updateAssignedCases();
        } else if (sectionId === 'analytics') {
            if (window.initCharts) window.initCharts();
        } else if (sectionId === 'resolved-cases') {
            updateResolvedCases();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Real-time Update Logic
    function updateDashboard() {
        const incidents = Storage.getIncidents();
        const reports = Storage.getReports();
        const resolved = incidents.filter(i => i.status === 'Resolved');
        
        const activeSOS = incidents.filter(i => i.status !== 'Resolved').length;
        const pendingReports = reports.filter(r => r.status === 'Pending').length;
        
        document.getElementById('active-alerts-val').textContent = activeSOS;
        document.getElementById('pending-reports-val').textContent = pendingReports;
        document.getElementById('total-resolved-val').textContent = resolved.length;

        // Calculate Average Response Time
        if (resolved.length > 0) {
            const totalResTime = resolved.reduce((acc, curr) => acc + (curr.responseTime || 0), 0);
            const avgTime = Math.round(totalResTime / resolved.length / 1000 / 60); // in minutes
            document.getElementById('avg-response-val').textContent = `${avgTime}m`;
        } else {
            document.getElementById('avg-response-val').textContent = '0m';
        }

        // Recent SOS Table
        const recentSOSBody = document.getElementById('recent-sos-body');
        const activeIncidents = incidents.filter(i => i.status !== 'Resolved').reverse();

        if (activeIncidents.length > 0) {
            recentSOSBody.innerHTML = activeIncidents.map(inc => `
                <tr>
                    <td>${inc.studentName}</td>
                    <td>${inc.time}</td>
                    <td>${inc.distance}m</td>
                    <td><span class="badge badge-priority-${inc.priority.toLowerCase()}">${inc.priority}</span></td>
                    <td><span class="badge badge-status-${inc.status.toLowerCase()}">${inc.status}</span></td>
                    <td>
                        ${inc.status === 'Pending' ? `<button class="btn btn-student accept-btn" data-id="${inc.id}">Accept</button>` : ''}
                        ${inc.status === 'Assigned' ? `<button class="btn btn-success resolve-btn" data-id="${inc.id}">Resolve</button>` : ''}
                    </td>
                </tr>
            `).join('');
            attachTableEvents();
        } else {
            recentSOSBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No active alerts.</td></tr>';
        }
    }

    function updateLiveAlerts() {
        const incidents = Storage.getIncidents();
        const activeIncidents = incidents.filter(i => i.status !== 'Resolved').reverse();
        const container = document.getElementById('live-alerts-list');

        if (activeIncidents.length > 0) {
            container.innerHTML = activeIncidents.map(inc => `
                <div class="card" style="margin-bottom: 1.5rem; border-left: 5px solid ${inc.status === 'Pending' ? 'var(--danger)' : 'var(--success)'};">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h2 style="color: var(--danger); margin-bottom: 0.5rem;"><i class="fas fa-exclamation-circle"></i> EMERGENCY ALERT</h2>
                            <p><strong>Student:</strong> ${inc.studentName} (${inc.studentId})</p>
                            <p><strong>Time:</strong> ${inc.time}</p>
                            <p><strong>Distance:</strong> ${inc.distance} meters from your station</p>
                            <p><strong>Assigned To:</strong> ${inc.assignedAuthority}</p>
                            <p><strong>Priority:</strong> <span class="badge badge-priority-critical">CRITICAL</span></p>
                            <p><strong>Status:</strong> <span class="badge badge-status-${inc.status.toLowerCase()}">${inc.status}</span></p>
                        </div>
                        <div style="text-align: right;">
                            ${inc.status === 'Pending' ? `
                                <button class="btn btn-student accept-btn" data-id="${inc.id}" style="display: block; width: 150px; margin-bottom: 0.5rem;">Accept Case</button>
                            ` : `
                                <button class="btn btn-authority open-route-btn" data-id="${inc.id}" style="display: block; width: 150px; margin-bottom: 0.5rem; background: #555;">Open Route</button>
                                <button class="btn btn-success resolve-btn" data-id="${inc.id}" style="display: block; width: 150px; background: var(--success); color: white;">Resolve Case</button>
                            `}
                        </div>
                    </div>
                </div>
            `).join('');
            attachTableEvents();
        } else {
            container.innerHTML = '<p style="text-align: center; padding: 3rem; color: #888;">No active emergency alerts.</p>';
        }
    }

    // Event listener for storage changes
    window.addEventListener('storage', () => {
        updateDashboard();
        if (document.getElementById('live-alerts-section').style.display !== 'none') {
            updateLiveAlerts();
        }
        if (document.getElementById('assigned-cases-section').style.display !== 'none') {
            updateAssignedCases();
        }
        
        // Simple alert for new SOS
        const incidents = Storage.getIncidents();
        const lastIncident = incidents[incidents.length - 1];
        if (lastIncident && lastIncident.status === 'Pending' && (new Date().getTime() - lastIncident.createdAt < 2000)) {
            const sound = document.getElementById('alert-sound');
            if (sound) sound.play().catch(e => console.log("Audio play blocked by browser"));
            alert(`EMERGENCY SOS: New alert from ${lastIncident.studentName}!`);
        }
    });

    // Initial Dashboard Update
    updateDashboard();

    function updateAssignedCases() {
        const incidents = Storage.getIncidents();
        const assigned = incidents.filter(i => i.status === 'Assigned').reverse();
        const body = document.getElementById('assigned-cases-body');

        if (assigned.length > 0) {
            body.innerHTML = assigned.map(inc => `
                <tr>
                    <td>${inc.id}</td>
                    <td>${inc.studentName}</td>
                    <td>${inc.lat.toFixed(4)}, ${inc.lon.toFixed(4)}</td>
                    <td>${new Date(inc.acceptedAt).toLocaleTimeString()}</td>
                    <td>
                        <button class="btn btn-authority open-route-btn" data-id="${inc.id}">Route</button>
                        <button class="btn btn-success resolve-btn" data-id="${inc.id}">Resolve</button>
                    </td>
                </tr>
            `).join('');
            attachTableEvents();
        } else {
            body.innerHTML = '<tr><td colspan="5" style="text-align: center;">No assigned cases.</td></tr>';
        }
    }

    function updateResolvedCases() {
        const incidents = Storage.getIncidents();
        const resolved = incidents.filter(i => i.status === 'Resolved').reverse();
        const body = document.getElementById('resolved-cases-body');

        if (resolved.length > 0) {
            body.innerHTML = resolved.map(inc => `
                <tr>
                    <td>${inc.id}</td>
                    <td>${inc.studentName}</td>
                    <td>SOS Emergency</td>
                    <td>${Math.round(inc.responseTime / 1000 / 60)} mins</td>
                    <td>${inc.date}</td>
                </tr>
            `).join('');
        } else {
            body.innerHTML = '<tr><td colspan="5" style="text-align: center;">No resolved cases.</td></tr>';
        }
    }

    function attachTableEvents() {
        document.querySelectorAll('.accept-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const incidents = Storage.getIncidents();
                const inc = incidents.find(i => i.id === id);
                if (inc) {
                    inc.status = 'Assigned';
                    inc.acceptedAt = new Date().getTime();
                    Storage.updateIncident(inc);
                    alert('Case accepted! Navigate to the location.');
                }
            };
        });

        document.querySelectorAll('.open-route-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const incidents = Storage.getIncidents();
                const inc = incidents.find(i => i.id === id);
                if (inc) {
                    const url = `https://www.google.com/maps/dir/${inc.authorityLat},${inc.authorityLon}/${inc.lat},${inc.lon}`;
                    window.open(url, '_blank');
                }
            };
        });

        document.querySelectorAll('.resolve-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const incidents = Storage.getIncidents();
                const inc = incidents.find(i => i.id === id);
                if (inc) {
                    const resolutionTime = new Date().getTime();
                    inc.status = 'Resolved';
                    inc.resolvedAt = resolutionTime;
                    inc.responseTime = resolutionTime - inc.createdAt;
                    Storage.updateIncident(inc);
                    alert('Case marked as resolved!');
                }
            };
        });
    }
});
