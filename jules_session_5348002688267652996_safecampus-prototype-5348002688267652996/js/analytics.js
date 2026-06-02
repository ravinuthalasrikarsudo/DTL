let charts = {};

window.initCharts = function() {
    const incidents = Storage.getIncidents();
    const reports = Storage.getReports();
    const resolved = incidents.filter(i => i.status === 'Resolved');
    const pending = incidents.filter(i => i.status !== 'Resolved');

    // Destroy existing charts if any
    Object.values(charts).forEach(chart => chart.destroy());

    // 1. Incidents Pie Chart (SOS vs Reports)
    const ctxPie = document.getElementById('incidents-pie-chart').getContext('2d');
    charts.pie = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: ['SOS Alerts', 'Incident Reports'],
            datasets: [{
                data: [incidents.length, reports.length],
                backgroundColor: ['#dc3545', '#007bff'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Alert Distribution', color: '#fff' },
                legend: { labels: { color: '#fff' } }
            }
        }
    });

    // 2. Incident Categories Bar Chart
    const categories = {};
    reports.forEach(r => {
        categories[r.category] = (categories[r.category] || 0) + 1;
    });

    const ctxBar = document.getElementById('incident-categories-bar-chart').getContext('2d');
    charts.bar = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: Object.keys(categories).length ? Object.keys(categories) : ['None'],
            datasets: [{
                label: 'Reports by Category',
                data: Object.values(categories).length ? Object.values(categories) : [0],
                backgroundColor: '#ffa500',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#444' }, ticks: { color: '#fff' } },
                x: { grid: { color: '#444' }, ticks: { color: '#fff' } }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });

    // 3. Response Time Line Chart (Last 5 resolved)
    const lastResolved = resolved.slice(-5);
    const ctxLine = document.getElementById('response-time-line-chart').getContext('2d');
    charts.line = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: lastResolved.map(r => r.id.substr(-4)),
            datasets: [{
                label: 'Response Time (mins)',
                data: lastResolved.map(r => Math.round(r.responseTime / 1000 / 60)),
                borderColor: '#28a745',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#444' }, ticks: { color: '#fff' } },
                x: { grid: { color: '#444' }, ticks: { color: '#fff' } }
            },
            plugins: {
                title: { display: true, text: 'Recent Response Times', color: '#fff' },
                legend: { labels: { color: '#fff' } }
            }
        }
    });
};
