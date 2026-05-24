from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal

from models.model import Product, InventoryTransaction, InventoryTransactionType
from core.exceptions import InsufficientStockError, ProductNotFoundError

class KardexService:
    @staticmethod
    def get_or_create_transaction_type(db: Session, name: str) -> InventoryTransactionType:
        """Obtiene o crea un tipo de transacción de inventario (e.g., ENTRADA, SALIDA)."""
        name_upper = name.upper().strip()
        tx_type = db.query(InventoryTransactionType).filter(InventoryTransactionType.name == name_upper).first()
        if not tx_type:
            tx_type = InventoryTransactionType(name=name_upper)
            db.add(tx_type)
            db.flush() # flush para obtener el ID sin commitear la transacción completa
        return tx_type

    @staticmethod
    def register_movement(
        db: Session,
        product_id: int,
        user_id: int,
        type_name: str,
        concept: str,
        quantity: int,
        unit_cost: Decimal,
        source_type: str = None,
        source_id: int = None
    ) -> InventoryTransaction:
        """
        Registra un movimiento en el Kardex y actualiza el stock del producto de forma atómica.
        Utiliza bloqueos de base de datos (with_for_update) para evitar race conditions.
        """
        if quantity <= 0:
            raise ValueError("La cantidad del movimiento debe ser mayor a cero.")

        # 1. Obtener y bloquear la fila del producto (with_for_update) contra concurrencia
        product = db.query(Product).filter(Product.id == product_id).with_for_update().first()
        if not product:
            raise ProductNotFoundError(f"Producto con id {product_id} no encontrado")

        # 2. Determinar tipo de movimiento
        tx_type = KardexService.get_or_create_transaction_type(db, type_name)

        # 3. Aplicar alteración de stock
        type_name_upper = type_name.upper().strip()
        if type_name_upper == "ENTRADA":
            product.stock += quantity
        elif type_name_upper == "SALIDA":
            if product.stock < quantity:
                raise InsufficientStockError(f"Stock insuficiente para {product.name_product}. Requerido: {quantity}, Disponible: {product.stock}")
            product.stock -= quantity
        else:
            # Concepto genérico de ajuste
            product.stock = quantity # Si es ajuste, podemos redefinir stock directamente o sumarlo

        # Actualizar flag booleano de disponibilidad
        product.stockProduct = product.stock > 0

        # 4. Calcular valor de balanceización
        # El balance valorizado es la cantidad en inventario multiplicada por su costo actual
        balance_value = Decimal(product.stock) * unit_cost

        # 5. Crear registro de Kardex
        transaction = InventoryTransaction(
            product_id=product.id,
            user_id=user_id,
            transaction_type_id=tx_type.id,
            concept=concept,
            movement=quantity,
            source_type=source_type,
            source_id=source_id,
            quantity=quantity,
            unit_cost=unit_cost,
            balance_stock=product.stock,
            balance_value=balance_value,
            created_at=datetime.utcnow()
        )

        db.add(transaction)
        db.flush() # se ejecuta flush para que el ID se asigne en la transacción actual
        return transaction