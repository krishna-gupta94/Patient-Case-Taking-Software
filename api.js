const API_BASE_URL = 'http://localhost:5000/api';

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
            if (response.status === 401 && endpoint !== '/auth/login') {
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
    // Basic frontend auth guard. The real security is on the backend.
    const token = localStorage.getItem('ayush_token');
    if (!token && window.location.pathname.indexOf('index.html') === -1) {
        window.location.href = 'index.html';
    }
}
