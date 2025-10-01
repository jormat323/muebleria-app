const mongoose = require('mongoose');

// Definimos el "plano" de nuestros productos
const productSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true // Este campo es obligatorio
    },
    precio: {
        type: Number,
        required: true
    },
    imagen: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    }
});

// Creamos y exportamos el modelo a partir del plano.
// Mongoose automáticamente nombrará la colección en la base de datos como "products" (en plural y minúsculas).
module.exports = mongoose.model('Product', productSchema);