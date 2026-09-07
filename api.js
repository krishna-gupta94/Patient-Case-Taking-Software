const localApiOrigin = 'http://127.0.0.1:5000';
const configuredApiOrigin = window.NIVARA_API_URL;
const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    || window.location.protocol === 'file:';
const API_BASE_URL = (configuredApiOrigin || (isLocalFrontend ? localApiOrigin : window.location.origin))
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

const api = {
    request: async (endpoint, options = {}) => {
        const token = localStorage.getItem('ayush_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            // Handle token expiration globally
            if (response.status === 401 && endpoint !== '/api/auth/login') {
                localStorage.removeItem('ayush_token');
                localStorage.removeItem('ayush_user');
                alert('Session expired or unauthorized. Please log in again.');
                window.location.href = 'index.html';
            }

            return { status: response.status, data };
        } catch (error) {
            console.error('API Request Error:', error);
            return { 
                status: 500, 
                data: { success: false, message: 'Server unavailable. Please try again later.' } 
            };
        }
    },
    get: (endpoint) => api.request(endpoint),
    post: (endpoint, body) => api.request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => api.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => api.request(endpoint, { method: 'DELETE' })
};

function checkAuthGuard() {
    const page = window.location.pathname.split('/').pop();
    const doctorOnlyPages = [
        'doctor-dashboard.html',
        'patients.html',
        'consultation.html',
        'settings.html'
    ];
    const patientOnlyPages = [
        'patient-dashboard.html',
        'patient-appointments.html',
        'patient-prescriptions.html',
        'patient-reports.html'
    ];
    const sharedPatientDoctorPages = [
        'appointments.html',
        'prescriptions.html',
        'reports.html'
    ];

    if (page === 'index.html' || page === '') {
        return;
    }

    document.documentElement.style.visibility = 'hidden';

    const redirectToLogin = () => {
        localStorage.removeItem('ayush_token');
        localStorage.removeItem('ayush_user');
        window.location.href = 'index.html';
    };

    const token = localStorage.getItem('ayush_token');
    if (!token) {
        redirectToLogin();
        return;
    }

    api.get('/api/auth/me').then((response) => {
        const user = response.data && response.data.data;
        const authenticated = response.status === 200 && response.data.success && user;

        if (!authenticated) {
            redirectToLogin();
            return;
        }

        let authorized = false;

        if (doctorOnlyPages.includes(page)) {
            authorized = user.role === 'Doctor';
        } else if (patientOnlyPages.includes(page)) {
            authorized = user.role === 'Patient';
        } else if (sharedPatientDoctorPages.includes(page)) {
            authorized = user.role === 'Doctor' || user.role === 'Patient';
        }

        if (!authorized) {
            redirectToLogin();
            return;
        }

        document.documentElement.style.visibility = '';
    }).catch(() => {
        redirectToLogin();
    });
}
