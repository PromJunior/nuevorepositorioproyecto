import { productService } from '../../../services/productService';
import { orderService } from '../../../services/orderService';
import { reportService } from '../../../services/reportService';
import { cashSessionService } from '../../../services/cashSessionService';

const isToday = (value) => {
    if (!value) return false;
    const date = new Date(value);
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

export const dashboardService = {
    getDashboard: async () => {
        const [products, orders, salesReport, cashSummary] = await Promise.all([
            productService.getProducts().catch(() => []),
            orderService.getOrders().catch(() => []),
            reportService.getSalesReport().catch(() => null),
            cashSessionService.getCurrentSession().catch(() => null),
        ]);

        const todayOrders = orders.filter((order) => isToday(order.order_date));
        const todayRevenue = todayOrders.reduce((total, order) => total + Number(order.total_amount || 0), 0);
        const lowStockProducts = products.filter((product) => Number(product.stock) <= 5);

        return {
            products,
            lowStockProducts,
            latestOrders: orders.slice(-8).reverse(),
            cashSession: cashSummary,
            metrics: {
                salesToday: salesReport?.total_sales ?? todayRevenue,
                ordersToday: salesReport?.total_orders ?? todayOrders.length,
                incomeTotal: orders.reduce((total, order) => total + Number(order.total_amount || 0), 0),
                lowStockCount: lowStockProducts.length,
            },
        };
    },
};
