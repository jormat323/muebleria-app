const mongoose = require('mongoose');

// Este es el "plano" para un solo producto dentro de un pedido
const itemSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true },
    precio: { type: Number, required: true }
}, {_id: false}); // _id: false para que no cree IDs para los sub-items

// Este es el "plano" para los datos del cliente
const clienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellidos: { type: String, required: true },
    direccion: { type: String, required: true },
    telefono: { type: String, required: true },
    horariosEntrega: { type: String },
    metodoPago: { type: String, required: true }
}, {_id: false});

// Definimos el "plano" principal para los pedidos
const orderSchema = new mongoose.Schema({
    // Usaremos el _id de Mongo, pero mantenemos este por retrocompatibilidad con el frontend
    id: { 
        type: Number,
        required: true,
        unique: true
    },
    cliente: clienteSchema, // Usamos el plano de cliente que definimos arriba
    productos: [itemSchema], // Le decimos que es un arreglo de productos
    total: {
        type: Number,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now // La fecha se establece automáticamente
    },
    estado: {
        type: String,
        required: true,
        default: 'Procesando' // El estado inicial es siempre "Procesando"
    }
});

module.exports = mongoose.model('Order', orderSchema);