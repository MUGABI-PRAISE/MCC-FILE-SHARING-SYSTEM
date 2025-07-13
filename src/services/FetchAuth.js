// defines a function to fetch a refresh token when the login expires.
// authFetch.js
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  // Add Authorization header
  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  let response = await fetch(url, options);

  // If access token expired, try refreshing
  if (response.status === 401 && refreshToken) {
    // Attempt to get a new access token
    const refreshResponse = await fetch('http://localhost:8000/api/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      const newToken = data.access;

      // Store new token and retry original request
      localStorage.setItem('token', newToken);
      options.headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, options);
    } else {
      // Refresh failed: clear storage and redirect to login
      localStorage.clear();

      // ✅ Schedule redirect in 4 seconds (non-blocking)
      // notice the magic here. we are making the redirect to be the one to wait. because if we
      //throw an error, the functino exits. so at this point, we have alread redirected even before
      //throwing the error, but we delay it. so the error comes, the funciton stopos, but the redirect
      // which has already happened will be shown four seconds later.
      setTimeout(() => {
        window.location.href = '/login';
      }, 10000);

      // ✅ Immediately throw error to show in UI
      throw new Error(`you're session has expired. you're required to login again`);
      
    }
  }

  return response;
}
