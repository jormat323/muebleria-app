document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores para GESTIÓN DE PRODUCTOS ---
    const productForm = document.getElementById('product-form');
    const formTitle = document.getElementById('form-title');
    const productsTableBody = document.getElementById('products-table-body');
    const productIdField = document.getElementById('product-id');
    const nombreField = document.getElementById('nombre');
    const descripcionField = document.getElementById('descripcion');
    const precioField = document.getElementById('precio');
    const imagenField = document.getElementById('imagen');

    // --- Selectores para GESTIÓN DE PEDIDOS ---
    const ordersTableBody = document.getElementById('orders-table-body');

    const API_PRODUCTS_URL = '/api/products';
    const API_ORDERS_URL = '/api/orders';

    // --- Función de ayuda para manejar las respuestas de fetch y redirecciones ---
    const handleFetchResponse = (response) => {
        if (response.redirected) {
            window.location.href = response.url;
            return null;
        }
        if (!response.ok) {
            throw new Error('La respuesta de la red no fue exitosa');
        }
        return response.json();
    };

    // --- LÓGICA PARA PRODUCTOS ---

    // Cargar y mostrar todos los productos
    const loadProducts = async () => {
        try {
            const response = await fetch(API_PRODUCTS_URL);
            const products = await handleFetchResponse(response);
            if (!products) return;

            productsTableBody.innerHTML = '';
            products.forEach(product => {
                const row = document.createElement('tr');
                // Usamos _id de MongoDB en lugar de id
                row.innerHTML = `
                    <td>${product.nombre}</td>
                    <td>$${product.precio.toLocaleString('es-AR')}</td>
                    <td>
                        <button class="btn-edit" data-id="${product._id}">Editar</button>
                        <button class="btn-delete" data-id="${product._id}">Eliminar</button>
                    </td>
                `;
                productsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error al cargar los productos:', error);
        }
    };

    // Manejar envío del formulario (Crear o Actualizar producto)
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = productIdField.value;
        const productData = {
            nombre: nombreField.value,
            descripcion: descripcionField.value,
            precio: parseInt(precioField.value),
            imagen: imagenField.value,
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_PRODUCTS_URL}/${id}` : API_PRODUCTS_URL;

        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
        });

        productForm.reset();
        productIdField.value = '';
        formTitle.textContent = 'Agregar Nuevo Producto';
        loadProducts();
    });

    // Manejar clicks en los botones de Editar y Eliminar productos
    productsTableBody.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;

        // Si se hace clic en Eliminar
        if (e.target.classList.contains('btn-delete')) {
            if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
                await fetch(`${API_PRODUCTS_URL}/${id}`, { method: 'DELETE' });
                loadProducts();
            }
        }

        // Si se hace clic en Editar
        if (e.target.classList.contains('btn-edit')) {
            const response = await fetch(API_PRODUCTS_URL);
            const products = await handleFetchResponse(response);
            const productToEdit = products.find(p => p._id === id);

            if (productToEdit) {
                formTitle.textContent = 'Editar Producto';
                productIdField.value = productToEdit._id;
                nombreField.value = productToEdit.nombre;
                descripcionField.value = productToEdit.descripcion;
                precioField.value = productToEdit.precio;
                imagenField.value = productToEdit.imagen;
                window.scrollTo(0, 0);
            }
        }
    });


    // --- LÓGICA PARA PEDIDOS ---

    // Cargar y mostrar todos los pedidos
    const loadOrders = async () => {
        try {
            const response = await fetch(API_ORDERS_URL);
            const orders = await handleFetchResponse(response);
            if (!orders) return;

            ordersTableBody.innerHTML = '';
            orders.forEach(order => {
                const row = document.createElement('tr');
                const orderDate = new Date(order.fecha).toLocaleString('es-AR');
                const total = order.total.toLocaleString('es-AR');

                // En la función loadOrders() de public/admin.js
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${orderDate}</td>
                    <td>${order.cliente.nombre} ${order.cliente.apellidos || ''}</td>
                    <td>$${total}</td>
                    <td><select class="status-select" data-id="${order.id}">
                    <option value="Procesando" ${order.estado === 'Procesando' ? 'selected' : ''}>Procesando</option>
                    <option value="Enviado" ${order.estado === 'Enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="Entregado" ${order.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
                   <option value="Cancelado" ${order.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                   </select> </td>
                   <td><a href="/api/orders/${order.id}/pdf" target="_blank" class="btn-edit">Ver PDF</a>
                   </td>`;
                ordersTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error al cargar los pedidos:', error);
        }
    };

    // Actualizar estado de un pedido
    ordersTableBody.addEventListener('change', async (e) => {
        if (e.target.classList.contains('status-select')) {
            const orderId = e.target.dataset.id;
            const newStatus = e.target.value;

            await fetch(`${API_ORDERS_URL}/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus }),
            });
        }
    });

    // --- LÓGICA DE LOGOUT ---
    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Cerrar Sesión';
    logoutButton.style.position = 'fixed';
    logoutButton.style.top = '20px';
    logoutButton.style.right = '20px';
    logoutButton.style.padding = '10px 15px';
    logoutButton.style.backgroundColor = '#dc3545';
    logoutButton.style.color = 'white';
    logoutButton.style.border = 'none';
    logoutButton.style.borderRadius = '5px';
    logoutButton.style.cursor = 'pointer';

    logoutButton.onclick = async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    };
    document.body.appendChild(logoutButton);

    // --- Carga inicial de datos ---
    loadProducts();
    loadOrders();
});