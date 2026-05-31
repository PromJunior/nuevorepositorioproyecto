from fastapi import APIRouter
from routers.auth_router import router as auth_router
from routers.products_router import router as products_router
from routers.sales_router import router as sales_router
from routers.cash_router import router as cash_router
from routers.cash_session_router import router as cash_session_router
from routers.inventory_router import router as inventory_router
from routers.purchases_router import router as purchases_router
from routers.suppliers_router import router as suppliers_router
from routers.dashboard_router import router as dashboard_router
from routers.report_router import router as report_router
from routers.settings_router import router as settings_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(products_router)
router.include_router(sales_router)
router.include_router(cash_router)
router.include_router(cash_session_router)
router.include_router(inventory_router)
router.include_router(purchases_router)
router.include_router(suppliers_router)
router.include_router(dashboard_router)
router.include_router(report_router)
router.include_router(settings_router)

