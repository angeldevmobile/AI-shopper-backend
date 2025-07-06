import express from 'express';
import cors from 'cors';
import userRoutes from '../routes/userRoutes';
import roleRoutes from '../routes/roleRoutes';
import productRoutes from '../routes/productRoutes';
import { populateCategoriesIfEmpty } from '../services/categoryService';
import { populateProductsIfEmpty } from '../services/productService';

const app = express();
app.use(express.json());
app.use(cors());
app.use('/usuarios', userRoutes);
app.use('/roles', roleRoutes);
app.use('/productos', productRoutes);
populateCategoriesIfEmpty().then(() => {
  populateProductsIfEmpty().then(() => {
    app.listen(3000, '0.0.0.0', () => {
      console.log('Servidor corriendo en puerto 3000');
    });
  });
});