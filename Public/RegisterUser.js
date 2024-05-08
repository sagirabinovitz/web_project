const registerForm = document.querySelector('#register-form');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get the form data
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const confirmPassword = document.getElementById('repeatPass').value;
    const username = document.getElementById('username').value;

    const errors = [];

    // Check if the password is at least 8 characters long and contains numbers
    const passwordRegex = /^(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        errors.push('Password must be at least 8 characters long and contain numbers');
    }

    // Check if the passwords match
    if (password !== confirmPassword) {
        errors.push('Passwords do not match');
    }

    // If there are errors, display them and return
    if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
    }

    // Send a POST request to the server for registration
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, username })
        });

        if (response.ok) {
            alert('Registration successful! Please log in.');
            window.location.href = '/login';
        } else {
            const data = await response.json();
            alert(`Registration failed: ${data.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});