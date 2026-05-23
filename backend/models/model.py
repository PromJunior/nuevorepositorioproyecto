from sqlalchemy import Column, Integer, String, DECIMAL, Date, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database.database import Base


#-----------------------> MODELOS DE PRODUCTOS Y CATEGORIAS <------------------------
class Product(Base):
    __tablename__= "products"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    name_product = Column(String(255), nullable=False, unique=True, index=True)
    price = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    stockProduct = Column(Boolean, default=True)# stock disponible o no, se actualiza cada vez que se realiza una venta o compra, si el stock llega a 0 se pone en false, si se repone el stock se vuelve a poner en true
    stock = Column(Integer, nullable=False, default=0) # cantidad de stock disponible, se actualiza cada vez que se realiza una venta o compra, si el stock llega a 0 se pone en false, si se repone el stock se vuelve a poner en true
    description = Column(String(255))# descripcion del producto, puede ser útil para el vendedor al momento de realizar la venta, o para el cliente al momento de consultar el producto en el catálogo
    # fecha de creación del producto, útil para auditorías o seguimiento histórico de productos
    is_active = Column(Boolean, default=True) # para habilitar o deshabilitar productos sin eliminarlos de la base de datos, útil para promociones o productos fuera de temporada
    delete_at = Column(DateTime, nullable=True) # fecha de eliminación lógica, se llena cuando se deshabilita un producto, útil para auditorías o seguimiento histórico sin perder información de ventas pasadas
    # llave foránea a categoría, con ondelete RESTRICT para evitar eliminar categorías con productos asociados
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    # Relaciones categoria y ordenes
    category = relationship("Category", back_populates="products_cate")
    order_items_prod = relationship("OrderItem", back_populates="product")
    
    # Nuevas Relaciones para Kardex y SaaS
    purchase_items_prod = relationship("PurchaseItem", back_populates="product")
    inventory_transactions = relationship("InventoryTransaction", back_populates="product")

class Category(Base):
    __tablename__= "categories"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    name_category = Column(String(255), nullable=False, unique=True, index=True)
    # Relación con productos
    products_cate = relationship("Product", back_populates="category")


#-----------------------> MODELOS DE ORDENES Y PAGOS <------------------------
class Order(Base):
    __tablename__="orders"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    order_date = Column(DateTime, default=datetime.utcnow)
    total_amount = Column(DECIMAL(10, 2))

    # estado activo o inactivo para permitir anulaciones sin eliminar registros, útil para auditorías o seguimiento histórico de ventas
    is_active = Column(Boolean, default=True)
    delete_at = Column(DateTime, nullable=True)
    # Llaves foráneas a usuario, cliente y sesión de caja
    # Relaciones con usuario, cliente, sesión de caja
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"))
    cash_session_id = Column(Integer, ForeignKey("cash_sessions.id"), nullable=True)
    status_id = Column(Integer, ForeignKey("status.id"), nullable=True)

    # Relaciones entre tablas user, cliente, sesión de caja y orden
    user = relationship("User", back_populates="orders")
    client = relationship("Client", back_populates="orders")
    order_items_order = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", passive_deletes=True)
    payment_order = relationship("Payment", back_populates="order")
    cash_session = relationship("CashSession", back_populates="orders")
    status = relationship("OrderStatus", back_populates="orders")

class OrderStatus(Base):
    __tablename__ = "order_status"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    name_status = Column(String(50), nullable=False, unique=True, index=True)# estado de la orden, puede ser 'PENDIENTE', 'COMPLETADA', 'ANULADA', etc. útil para el seguimiento del proceso de venta y para permitir anulaciones sin eliminar registros
    # Relación con ordenes
    orders = relationship("Order", back_populates="status")
    

#-----------------------> modelo de ítems de orden <------------------------
class OrderItem(Base):
    __tablename__= "order_items"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
   
    quantity = Column(Integer)
    price = Column(DECIMAL(10, 2))
    sub_amount = Column(DECIMAL(10, 2))
    date_added = Column(DateTime, default=datetime.utcnow)

    # llaves foráneas a orden y producto, con ondelete CASCADE para eliminar ítems si se borra la orden
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Relaciones con orden y producto
    order = relationship("Order", back_populates="order_items_order")
    product = relationship("Product", back_populates="order_items_prod")


#-----------------------> modelo de pagos <------------------------
class Payment(Base):
    __tablename__= "payments"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
   
    payment_date = Column(DateTime, default=datetime.utcnow)
    amount = Column(DECIMAL(10, 2))

    # llaves foráneas a orden, método de pago y cierre de caja, con ondelete SET NULL para mantener el historial de pagos aunque se borre la orden o el cierre de caja  
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    id_payment_method = Column(Integer, ForeignKey("payment_methods.id"), nullable=False)
    # Relaciones con orden y método de pago
    order = relationship("Order", back_populates="payment_order")
    payment_method = relationship("PaymentMethod", back_populates="payments_pm")


#-----------------------> modelo de métodos de pago <------------------------
class PaymentMethod(Base):
    __tablename__= "payment_methods"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    code = Column(String(20), unique=True) # código interno para referencia rápida, útil para integraciones o reportes
    name_payment_method = Column(String(255), nullable=False, unique=True, index=True)
    is_cash = Column(Boolean, default=False) # para identificar métodos de pago en efectivo, útil para reportes de caja y conciliaciones bancarias
    affects_cash_closing = Column(Boolean, default=False) # para identificar métodos de pago que afectan el cierre de caja, útil para reportes de caja y conciliaciones bancarias
    requires_reference = Column(Boolean, default=False) # para identificar métodos de pago que requieren referencia o comprobante, útil para validaciones en el proceso de venta
    is_active = Column(Boolean, default=True) # para habilitar o deshabilitar métodos de pago sin eliminarlos de la base de datos, útil para promociones o cambios en las opciones de pago
    
    payments_pm = relationship("Payment", back_populates="payment_method")


#-----------------------> modelo de cierre de caja inicio - ventas - cierre <------------------------
class CashSession (Base):
    __tablename__ = "cash_sessions"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    opening_amount = Column(DECIMAL(10, 2), nullable=False)
    opening_time = Column(DateTime, default=datetime.utcnow)
    closing_amount = Column(DECIMAL(10, 2), nullable=True)
    closing_time = Column(DateTime, nullable=True)
    expected_amount = Column(DECIMAL(10, 2), nullable=True)
    difference = Column(DECIMAL(10, 2), nullable=True)
    status = Column(String(20), default="OPEN") # 'OPEN', 'CLOSED'. útil para el seguimiento del proceso de caja y para permitir conciliaciones sin eliminar registros

    # Llave foránea a usuario, con ondelete RESTRICT para evitar eliminar usuarios con sesiones de caja asociadas
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relaciones con usuario y ordenes
    user = relationship("User", back_populates="cash_sessions")
    orders = relationship("Order", back_populates="cash_session")



#-----------------------> NUEVO: MODELOS DE PROVEEDORES Y COMPRAS (INGESTA) <------------------------
class Supplier(Base):
    
    __tablename__ = "suppliers"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)

    ruc = Column(String(20), nullable=True, index=True)
    company_name = Column(String(150), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relación con compras ingesta de mercadería
    purchases = relationship("Purchase", back_populates="supplier")

class Purchase(Base):
   
    __tablename__ = "purchases"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    
    purchase_date = Column(DateTime, default=datetime.utcnow)
    invoice_number = Column(String(50), nullable=True) # Nro de Comprobante para auditorías o seguimiento contable como facturas, boletas, etc.
    total_amount = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Llaves foráneas a proveedor y usuario
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status_id = Column(Integer, ForeignKey("purchase_status.id"), nullable=True)

    # Relaciones con proveedor, usuario e ítems de compra
    supplier = relationship("Supplier", back_populates="purchases")
    user = relationship("User", back_populates="purchases")
    purchase_items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")
    status = relationship("PurchaseStatus", back_populates="purchases")

class PurchaseStatus(Base):
    __tablename__ = "purchase_status"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    name_status = Column(String(50), nullable=False, unique=True, index=True)# estado de la compra, puede ser 'PENDIENTE', 'COM
    # Relación con compras
    purchases = relationship("Purchase", back_populates="status")

class PurchaseItem(Base):
    
    __tablename__ = "purchase_items"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(DECIMAL(10, 2), nullable=False) # Costo real de adquisición
    sub_amount = Column(DECIMAL(10, 2), nullable=False)

    # fecha de registro del ítem, útil para auditorías o seguimiento de compras
    purchase_id = Column(Integer, ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    # Relaciones con compra y producto
    purchase = relationship("Purchase", back_populates="purchase_items")
    product = relationship("Product", back_populates="purchase_items_prod")


#-----------------------> NUEVO: EL CORAZÓN DEL KARDEX PROFESIONAL <------------------------
class InventoryTransaction(Base):
    
    __tablename__ = "inventory_transactions"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)

    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_type_id = Column(Integer, ForeignKey("inventory_transaction_types.id"), nullable=False)# 'ENTRADA' para compras, 'SALIDA' para ventas, 'AJUSTE' para correcciones manuales, etc.
    
    concept = Column(String(100), nullable=False)        # 'Venta', 'Compra Proveedor', 'Merma', 'Inicial'
    movement = Column(Integer)# Cantidad de movimiento, siempre positiva, el tipo de movimiento se define por transaction_type
    
    # Trazabilidad Automática en la Nube
    source_type = Column(String(50), nullable=True)      # 'orders', 'purchases', 'manual'
    source_id = Column(Integer, nullable=True)           # ID del documento origen
    
    quantity = Column(Integer, nullable=False)           # Cantidad afectada (siempre > 0)
    unit_cost = Column(DECIMAL(10, 2), nullable=False)   # Costo del producto en este movimiento
    
    # Histórico del Balance (Indispensable para reportes visuales instantáneos)
    balance_stock = Column(Integer, nullable=False)      # Stock resultante tras esta operación
    balance_value = Column(DECIMAL(12, 2), nullable=False) # Valorización del almacén (Stock * Costo)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="inventory_transactions")
    user = relationship("User", back_populates="inventory_transactions")
    transaction_type = relationship("InventoryTransactionType", back_populates="inventory_transactions")


class InventoryTransactionType(Base):
    __tablename__ = "inventory_transaction_types"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True, index=True)
    # Relación con transacciones de inventario
    inventory_transactions = relationship("InventoryTransaction", back_populates="transaction_type")

#-----------------------> modelo de de gention de usuarios <------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    fullname = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    delete_at = Column(DateTime, nullable=True)
    create_at = Column(DateTime, default=datetime.utcnow)

    # Llave foránea a rol, con ondelete RESTRICT para evitar eliminar roles con usuarios asociados
    id_role = Column("id_role", Integer, ForeignKey("roles.id"), nullable=False)

    # Relaciones con rol, ordenes y sesiones de caja y compras y transacciones de inventario
    role = relationship("Roles", back_populates="users")
    orders = relationship("Order", back_populates="user")
    cash_sessions = relationship("CashSession", back_populates="user")
    purchases = relationship("Purchase", back_populates="user")
    inventory_transactions = relationship("InventoryTransaction", back_populates="user")

class Roles (Base):
    __tablename__ = "roles"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True, index=True)
    users = relationship("User", back_populates="role")

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    dni = Column(String(8), nullable=False, unique=True, index=True)
    full_name = Column(String(150), nullable=False)
    address = Column(String(255))
    phone = Column(String(20))
    email = Column(String(100), nullable=False, unique=True, index=True)
    create_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    delete_at = Column(DateTime, nullable=True)
    
    # Relaciones existentes
    orders = relationship("Order", back_populates="client")
