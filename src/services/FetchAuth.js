// authFetch.js
// A wrapper around fetch() that adds Authorization and handles token refresh.

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  // Detect if the request body is FormData
  const isFormData = options.body instanceof FormData;

  // Initialize headers (ensure it's always an object)
  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`, // Always include the token
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }) // Let browser set Content-Type for FormData
  };

  // Perform initial request
  let response = await fetch(url, options);

  // Handle token expiration (HTTP 401) — try refreshing token once
  if (response.status === 401 && refreshToken) {
    try {
      // Attempt to refresh access token
      const refreshResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const newToken = data.access;

        // Store new access token
        localStorage.setItem('token', newToken);

        // Retry the original request with the new token
        options.headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, options);
      } else {
        // Refresh token is invalid or expired — log user out
        localStorage.clear();

        setTimeout(() => {
          window.location.href = '/login'; // Redirect after 4 seconds
        }, 4000);

        throw new Error(`Your session has expired. Please log in again.`);
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      throw new Error('Authentication error. Please login again.');
    }
  }

  return response;
}
