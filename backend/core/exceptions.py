class DomainError(Exception):
    """Base class for domain-level exceptions."""
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message

class ClientNotFoundError(DomainError):
    pass

class ProductNotFoundError(DomainError):
    pass

class OutOfStockError(DomainError):
    pass

class InsufficientStockError(DomainError):
    pass

class InvalidPriceError(DomainError):
    pass

class PaymentMethodNotFoundError(DomainError):
    pass

class OrderNotFoundError(DomainError):
    pass
