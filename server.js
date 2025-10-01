// --- 1. IMPORTACIONES ---
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const Product = require('./models/product');
const Order = require('./models/order');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 3000;
const DATABASE_URL = process.env.DATABASE_URL;

// --- 2. CONEXIÓN A MONGODB ---
mongoose.connect(DATABASE_URL);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('✅ Conectado a la base de datos MongoDB'));

// --- 3. MIDDLEWARES ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'un-secreto-muy-largo-y-dificil-de-adivinar',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// --- 4. LÓGICA DE LOGIN Y SEGURIDAD ---
const adminUser = {
    username: 'admin',
    passwordHash: '$2a$12$bPK4bAYoUMu5GWVWMy9G9u4WFDPdaeWpZCNY1NvueHsKmdpNUO25W' // admin123
};

const requireLogin = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.redirect('/login.html');
    }
};

// --- 5. RUTAS DE AUTENTICACIÓN ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (username === adminUser.username && await bcrypt.compare(password, adminUser.passwordHash)) {
        req.session.userId = adminUser.username;
        res.json({ success: true, message: 'Login exitoso' });
    } else {
        res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// ===========================================
// --- API PARA PRODUCTOS (USANDO MONGODB) ---
// ===========================================
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/products', requireLogin, async (req, res) => {
    const product = new Product({
        nombre: req.body.nombre,
        precio: req.body.precio,
        imagen: req.body.imagen,
        descripcion: req.body.descripcion
    });
    try {
        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/products/:id', requireLogin, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/products/:id', requireLogin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json({ message: 'Producto eliminado con éxito' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// =================================================
// --- API PARA PEDIDOS (USANDO MONGODB) ---
// =================================================

app.post('/api/orders', async (req, res) => {
    const orderData = req.body;
    const order = new Order({
        id: Date.now(),
        cliente: orderData.cliente,
        productos: orderData.productos,
        total: orderData.total
    });
    try {
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findOne({ id: req.params.id });
        if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/orders', requireLogin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ fecha: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/orders/:id', requireLogin, async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { id: req.params.id },
            { estado: req.body.estado },
            { new: true }
        );
        if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/orders/:id/pdf', requireLogin, async (req, res) => {
    try {
        const order = await Order.findOne({ id: req.params.id });
        if (!order) {
            return res.status(404).send('Pedido no encontrado');
        }

        const doc = new PDFDocument({ size: 'A4', margin: 40 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=presupuesto-${order.id}.pdf`);
        doc.pipe(res);

        const generateHeader = () => {
            doc.fontSize(20).text(`Presupuesto (${order.id})`, { align: 'center' });
            doc.moveDown(2);
            doc.fontSize(10).text('Datos Empresa', 50, 120, { underline: true });
            doc.text('Mueblería "El Buen Descanso"', 50, 135);
            doc.text('Av. Siempre Viva 123, Formosa', 50, 150);
            doc.text('Teléfono: 370-4123456', 50, 165);
            doc.text('Datos Cliente', 320, 120, { underline: true });
            doc.text(`${order.cliente.nombre} ${order.cliente.apellidos}`, 320, 135);
            doc.text(`Dirección: ${order.cliente.direccion}`, 320, 150);
            doc.text(`Teléfono: ${order.cliente.telefono}`, 320, 165);
            doc.moveDown(3);
        };
        
        const generateTableRow = (y, item) => {
            doc.fontSize(10)
                .text(item.nombre, 52, y, { width: 220 })
                .text(item.cantidad, 280, y, { width: 90, align: 'center' })
                .text(`$${item.precio.toLocaleString('es-AR')}`, 370, y, { width: 90, align: 'center' })
                .text(`$${(item.precio * item.cantidad).toLocaleString('es-AR')}`, 460, y, { width: 90, align: 'center' });
        };
        
        generateHeader();

        const tableTop = 220;
        const itemTopMargin = 15;
        
      doc.font('Helvetica-Bold');
        doc.fontSize(10)
            .text('Descripción', 52, tableTop, { width: 220 })
            .text('Unidades', 280, tableTop, { width: 90, align: 'center' })
            .text('Precio', 370, tableTop, { width: 90, align: 'center' })
            .text('Total', 460, tableTop, { width: 90, align: 'center' });
        doc.rect(50, tableTop - 5, 510, itemTopMargin + 5).stroke();
        doc.font('Helvetica');

        // 2. Dibuja las filas de los productos (con cálculos)
        let i = 0;
        order.productos.forEach(item => {
            const y = tableTop + (i + 1) * (itemTopMargin + 5);
            generateTableRow(y, item); // La función original ahora solo se usa para productos
            doc.rect(50, y - 5, 510, itemTopMargin + 5).stroke();
            i++;
        });

        const tableBottom = tableTop + (i + 1) * (itemTopMargin + 5) - 5;
        doc.moveTo(275, tableTop - 5).lineTo(275, tableBottom).stroke();
        doc.moveTo(365, tableTop - 5).lineTo(365, tableBottom).stroke();
        doc.moveTo(455, tableTop - 5).lineTo(455, tableBottom).stroke();

        const summaryTop = tableBottom + 20;
        const summaryX = 370;
        const iva = order.total * 0.21;
        const subtotal = order.total - iva;

        doc.font('Helvetica-Bold').text('SUB-TOTAL:', summaryX, summaryTop, { width: 90, align: 'right' });
        doc.text('IVA (21%):', summaryX, summaryTop + 15, { width: 90, align: 'right' });
        doc.text('TOTAL PRESUPUESTO:', summaryX, summaryTop + 30, { width: 90, align: 'right' });

        doc.font('Helvetica');
        doc.text(`$${subtotal.toLocaleString('es-AR')}`, summaryX + 100, summaryTop, { align: 'right' });
        doc.text(`$${iva.toLocaleString('es-AR')}`, summaryX + 100, summaryTop + 15, { align: 'right' });
        doc.text(`$${order.total.toLocaleString('es-AR')}`, summaryX + 100, summaryTop + 30, { align: 'right' });

        const signatureTop = summaryTop + 100;
        doc.text('Firma', 60, signatureTop);
        doc.text('Firma del cliente', 330, signatureTop);
        doc.rect(50, signatureTop + 15, 220, 50).stroke();
        doc.rect(320, signatureTop + 15, 220, 50).stroke();

        doc.end();

    } catch (err) {
        res.status(500).send('Error al generar el PDF: ' + err.message);
    }
});

// --- Sirve la página de admin (protegida) ---
app.get('/admin.html', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));


// --- 7. INICIAR EL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor de la MUEBLERÍA escuchando en http://localhost:${PORT}`);
});