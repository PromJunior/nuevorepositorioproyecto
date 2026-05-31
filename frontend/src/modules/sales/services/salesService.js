import { productService } from '../../../services/productService';
import { paymentService } from '../../../services/paymentService';
import { clientService } from '../../../services/clientService';
import { orderService } from '../../../services/orderService';

export const salesService = {
    getProducts: productService.getProducts,
    getPaymentMethods: paymentService.getPaymentMethods,
    getClientByDni: clientService.getClientByDni,
    consultDni: clientService.consultDni,
    createClient: clientService.createClient,
    createOrder: orderService.createOrder,
};
