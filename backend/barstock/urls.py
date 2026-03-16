from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .viewsets import (
    CategoryViewSet,
    EndOfDayReportViewSet,
    InventoryItemViewSet,
    NotificationViewSet,
    SaleItemViewSet,
    SaleViewSet,
    StockAdjustmentViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"inventory-items", InventoryItemViewSet, basename="inventory-item")
router.register(r"sales", SaleViewSet, basename="sale")
router.register(r"sale-items", SaleItemViewSet, basename="sale-item")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"stock-adjustments", StockAdjustmentViewSet, basename="stock-adjustment")
router.register(r"eod-reports", EndOfDayReportViewSet, basename="eod-report")

urlpatterns = [
    path("", include(router.urls)),
]
