window.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupModal();
});

// Función para obtener y mostrar los productos.
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('No se pudo obtener la lista de productos.');
        
        const products = await response.json();
        const container = document.getElementById('product-container');
        container.innerHTML = '';

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.innerHTML = `
                <img src="${product.imagen}" alt="${product.nombre}" style="width:300; height:200">
                <h2>${product.nombre}</h2>
                <p class="description">${product.descripcion}</p>
                <p class="price">$${product.precio.toLocaleString('es-AR')}</p>
                <button onclick="addToCart(${product.id}, '${product.nombre}', ${product.precio})">Agregar al Carrito</button>
            `;
            container.appendChild(productCard);
        });
    } catch (error) {
        console.error('Error al cargar los productos:', error);
    }
}

// --- LÓGICA DEL CARRITO Y MODAL ---
let carrito = [];
const checkoutModal = document.getElementById('checkout-modal');
const checkoutForm = document.getElementById('checkout-form');
const closeButton = document.querySelector('.close-button');

function setupModal() {
    // Cierra el modal con el botón X
    closeButton.onclick = () => checkoutModal.style.display = 'none';
    
    // Cierra el modal si se hace clic fuera de él
    window.onclick = (event) => {
        if (event.target == checkoutModal) {
            checkoutModal.style.display = 'none';
        }
    };
    
    // Escucha el envío del formulario
    checkoutForm.addEventListener('submit', placeOrder);
}

function addToCart(productId, productName, productPrice) {
    const existingProduct = carrito.find(item => item.id === productId);

    if (existingProduct) {
        existingProduct.cantidad++;
    } else {
        carrito.push({ id: productId, nombre: productName, precio: productPrice, cantidad: 1 });
    }
    
    alert(`"${productName}" agregado al carrito.`);
    
    // Muestra el botón para finalizar la compra si no existe
    if (!document.getElementById('checkout-btn')) {
        const checkoutButton = document.createElement('button');
        checkoutButton.id = 'checkout-btn';
        checkoutButton.textContent = 'Finalizar Compra';
        // Al hacer clic, muestra el modal en lugar de llamar a placeOrder directamente
        checkoutButton.onclick = () => checkoutModal.style.display = 'flex';
        document.body.appendChild(checkoutButton);
        // Estilos del botón
        checkoutButton.style.position = 'fixed';
        checkoutButton.style.bottom = '20px';
        checkoutButton.style.right = '20px';
        checkoutButton.style.padding = '15px';
        checkoutButton.style.backgroundColor = '#28a745';
        checkoutButton.style.color = 'white';
        checkoutButton.style.border = 'none';
        checkoutButton.style.borderRadius = '5px';
        checkoutButton.style.cursor = 'pointer';
        checkoutButton.style.zIndex = '999';
    }
}

// Esta función ahora se activa al enviar el formulario del modal
async function placeOrder(event) {
    event.preventDefault(); // Evita que la página se recargue

    if (carrito.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    // Recolecta los datos desde el formulario
    const formData = new FormData(checkoutForm);
    const clienteData = Object.fromEntries(formData.entries());

    const orderData = {
        cliente: {
            nombre: clienteData.nombre,
            apellidos: clienteData.apellidos,
            direccion: clienteData.direccion,
            telefono: clienteData.telefono,
            horariosEntrega: clienteData.horarios,
            metodoPago: clienteData.pago
        },
        productos: carrito,
        total: carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
    };

    const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });

    if (response.ok) {
        const orderConfirmation = await response.json();
        checkoutModal.style.display = 'none'; // Oculta el modal
        checkoutForm.reset(); // Limpia el formulario
        alert(`¡Pedido realizado con éxito! Tu número de pedido es: ${orderConfirmation.id}`);
        
        carrito = []; // Limpia el carrito
        const checkoutButton = document.getElementById('checkout-btn');
        if (checkoutButton) checkoutButton.remove();
    } else {
        alert("Hubo un error al procesar tu pedido.");
    }
}