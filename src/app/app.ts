import express from 'express';
import userRoutes from '../routes/userRoutes';

const app = express();
app.use(express.json());

// Monta el router en la ruta deseada
app.use('/usuarios', userRoutes);

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});