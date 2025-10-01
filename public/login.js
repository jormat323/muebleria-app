document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        errorMessage.textContent = ''; // Limpiar errores previos

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                // Si el login es exitoso, redirigir al panel de admin
                window.location.href = '/admin.html';
            } else {
                const data = await response.json();
                errorMessage.textContent = data.message || 'Error en el login.';
            }
        } catch (error) {
            errorMessage.textContent = 'No se pudo conectar con el servidor.';
        }
    });
});