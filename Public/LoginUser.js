const loginForm = document.querySelector('#login-form');

// Add an event listener for form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('typeEmailX').value;
    const password = document.getElementById('typePasswordX').value;

    // Send a POST request to the server for login
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();

            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('userEmail', data.user.email);
            sessionStorage.setItem('username', data.user.username);
            alert('Login successful!');
            console.log('Redirecting...');
            window.location.href = '/todos';
        } else {
            alert('Invalid email or password. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});