import { Router, Request, Response } from 'express';
import { getAllProducts, getFiveProducts, getMostDiscountedProducts, getPopularProducts, getProductsByCategory, getAllCategories, getProductsByCategories, searchProducts } from '../controllers/productController';

const router = Router();

router.get('/', getAllProducts); // Todos los productos
router.get('/cinco', getFiveProducts); // Solo 5 productos
router.get('/descuento', getMostDiscountedProducts); // Más descuento
router.get('/popular', getPopularProducts);
router.get('/categoria/:categoria', getProductsByCategory);
router.get('/categorias', getAllCategories);
router.post('/por-categorias', (req: Request, res: Response) => {
	getProductsByCategories(req, res);
});
router.get('/buscar', searchProducts);

export default router;