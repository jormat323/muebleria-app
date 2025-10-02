// Espera a que el contenido de la página se cargue
window.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupModal();
    setupCart();
});

// --- Lógica Principal de la Tienda ---

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
                <img src="${product.imagen}" alt="${product.nombre}">
                <h2>${product.nombre}</h2>
                <p class="description">${product.descripcion}</p>
                <p class="price">$${product.precio.toLocaleString('es-AR')}</p>
                <button onclick="addToCart('${product._id}', '${product.nombre}', ${product.precio}, '${product.imagen}')">Agregar al Carrito</button>
            `;
            container.appendChild(productCard);
        });
    } catch (error) {
        console.error('Error al cargar los productos:', error);
    }
}

// --- Lógica del Carrito y Notificaciones ---
let carrito = [];
const cartIcon = document.getElementById('cart-icon');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCartBtn = document.querySelector('#cart-sidebar .close-btn');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const checkoutBtnSidebar = document.getElementById('checkout-btn-sidebar');

function setupCart() {
    cartIcon.onclick = () => cartSidebar.classList.add('open');
    closeCartBtn.onclick = () => cartSidebar.classList.remove('open');
    checkoutBtnSidebar.onclick = () => {
        if (carrito.length > 0) {
            cartSidebar.classList.remove('open');
            checkoutModal.style.display = 'flex';
        } else {
            showToast("Tu carrito está vacío.", 'error');
        }
    };
}

function addToCart(productId, productName, productPrice, productImagen) {
    const existingProductIndex = carrito.findIndex(item => item.id === productId);

    if (existingProductIndex > -1) {
        carrito[existingProductIndex].cantidad++;
    } else {
        carrito.push({ id: productId, nombre: productName, precio: productPrice, cantidad: 1, imagen: productImagen });
    }
    
    showToast(`"${productName}" fue agregado al carrito.`);
    renderCart();
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let totalItems = 0;

    carrito.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.classList.add('cart-item');
        itemEl.innerHTML = `
            <img src="${item.imagen}" alt="${item.nombre}">
            <div class="cart-item-details">
                <h4>${item.nombre}</h4>
                <p class="price">$${item.precio.toLocaleString('es-AR')}</p>
                <p class="quantity">Cantidad: ${item.cantidad}</p>
                <a class="remove-btn" data-index="${index}">Eliminar</a>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
        total += item.precio * item.cantidad;
        totalItems += item.cantidad;
    });

    cartTotal.textContent = `$${total.toLocaleString('es-AR')}`;
    cartCount.textContent = totalItems;
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.onclick = (e) => removeFromCart(parseInt(e.target.dataset.index));
    });
}

function removeFromCart(index) {
    carrito.splice(index, 1);
    renderCart();
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    if (type === 'error') toast.style.backgroundColor = '#dc3545';
    
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}


// --- Lógica del Modal de Compra ---
const checkoutModal = document.getElementById('checkout-modal');
const checkoutForm = document.getElementById('checkout-form');
const closeButton = document.querySelector('.close-button'); // Declaración movida aquí

function setupModal() {
    closeButton.onclick = () => checkoutModal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == checkoutModal) checkoutModal.style.display = 'none';
    };
    checkoutForm.addEventListener('submit', placeOrder);
}

async function placeOrder(event) {
    event.preventDefault();

    const formData = new FormData(checkoutForm);
    const clienteData = Object.fromEntries(formData.entries());

    const orderData = {
        cliente: clienteData,
        productos: carrito,
        total: carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        if (!response.ok) throw new Error('La respuesta del servidor no fue exitosa.');

        const orderConfirmation = await response.json();
        
        checkoutModal.style.display = 'none';
        checkoutForm.reset();
        
        showToast(`¡Pedido #${orderConfirmation.id} realizado con éxito!`);
        
        carrito = [];
        renderCart();
    } catch (error) {
        showToast("Hubo un error al procesar tu pedido.", 'error');
        console.error('Error al realizar el pedido:', error);
    }
}