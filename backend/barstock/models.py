from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class StaffProfile(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        SUPERVISOR = "supervisor", "Supervisor"
        STAFF = "staff", "Staff"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="staff_profile")
    staff_id = models.CharField(max_length=50, unique=True)
    role = models.CharField(max_length=15, choices=Role.choices, default=Role.STAFF)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.user.get_full_name() or self.user.username} ({self.staff_id})"


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class InventoryItem(models.Model):
    name = models.CharField(max_length=255)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=0)
    min_stock_threshold = models.IntegerField(default=0)
    category = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name


class Sale(models.Model):
    staff = models.ForeignKey(User, on_delete=models.PROTECT, related_name="sales")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Sale {self.id}"


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    item = models.ForeignKey(InventoryItem, on_delete=models.PROTECT, related_name="sale_items")
    quantity = models.IntegerField()
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self) -> str:
        return f"{self.item.name} x{self.quantity}"


class Notification(models.Model):
    class Type(models.TextChoices):
        LOW_STOCK = "low_stock", "Low stock"
        OUT_OF_STOCK = "out_of_stock", "Out of stock"
        GENERAL = "general", "General"

    type = models.CharField(max_length=20, choices=Type.choices, default=Type.GENERAL)
    title = models.CharField(max_length=255)
    message = models.TextField()
    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title


class StockAdjustment(models.Model):
    item = models.ForeignKey(InventoryItem, on_delete=models.PROTECT, related_name="stock_adjustments")
    expected_stock = models.IntegerField()
    actual_stock = models.IntegerField()
    difference = models.IntegerField()
    adjusted_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="stock_adjustments")
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Adjustment {self.id}"


class EndOfDayReport(models.Model):
    date = models.DateField(unique=True)
    submitted_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="eod_reports")
    total_sales = models.DecimalField(max_digits=12, decimal_places=2)
    total_profit = models.DecimalField(max_digits=12, decimal_places=2)
    total_transactions = models.IntegerField()
    items_sold = models.IntegerField()
    notes = models.TextField(blank=True)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self) -> str:
        return f"EOD Report {self.date}"
