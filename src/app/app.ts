import express from 'express';
import userRoutes from '../routes/userRoutes';
import roleRoutes from '../routes/roleRoutes'; 


const app = express();
app.use(express.json());

// Monta el router en la ruta deseada
app.use('/usuarios', userRoutes);
app.use('/roles', roleRoutes);

const userRouter = require('./routes/usuarios');
app.use('/usuarios', userRouter);

app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor corriendo en puerto 3000');
});