from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Category, EndOfDayReport, InventoryItem, Notification, Sale, SaleItem, StaffProfile, StockAdjustment


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "created_at"]
        read_only_fields = ["id", "created_at"]


class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = ["staff_id", "role", "created_at"]
        read_only_fields = ["created_at"]


class UserSerializer(serializers.ModelSerializer):
    staff_profile = StaffProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "staff_profile", "date_joined"]
        read_only_fields = ["id", "date_joined"]


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "name",
            "cost_price",
            "selling_price",
            "quantity",
            "min_stock_threshold",
            "category",
            "units_per_item",
            "is_carton",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        staff_profile = getattr(user, "staff_profile", None)
        is_admin = bool(staff_profile and staff_profile.role == StaffProfile.Role.ADMIN)
        if not is_admin:
            data.pop("cost_price", None)
        return data


class SaleItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = ["id", "sale", "item", "item_name", "quantity", "cost_price", "selling_price"]
        read_only_fields = ["id"]
        extra_kwargs = {
            "cost_price": {"required": False},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        staff_profile = getattr(user, "staff_profile", None)
        is_admin = bool(staff_profile and staff_profile.role == StaffProfile.Role.ADMIN)
        if not is_admin:
            data.pop("cost_price", None)
        return data


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    staff_id = serializers.CharField(source="staff.staff_profile.staff_id", read_only=True)
    staff_name = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    total_profit = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = ["id", "staff", "staff_id", "staff_name", "payment_method", "payment_status", "created_at", "items", "total_amount", "total_profit"]
        read_only_fields = ["id", "created_at", "staff"]

    def get_staff_name(self, obj: Sale) -> str:
        full_name = obj.staff.get_full_name()
        return full_name or obj.staff.username

    def get_total_amount(self, obj: Sale) -> float:
        return sum(item.selling_price * item.quantity for item in obj.items.all())

    def get_total_profit(self, obj: Sale) -> float:
        return sum((item.selling_price - item.cost_price) * item.quantity for item in obj.items.all())


class NotificationSerializer(serializers.ModelSerializer):
    item_id = serializers.IntegerField(source="item.id", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "type", "title", "message", "item", "item_id", "read", "created_at"]
        read_only_fields = ["id", "created_at"]


class StockAdjustmentSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    adjusted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockAdjustment
        fields = [
            "id",
            "item",
            "item_name",
            "expected_stock",
            "actual_stock",
            "difference",
            "adjusted_by",
            "adjusted_by_name",
            "reason",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_adjusted_by_name(self, obj: StockAdjustment) -> str:
        full_name = obj.adjusted_by.get_full_name()
        return full_name or obj.adjusted_by.username


class EndOfDayReportSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EndOfDayReport
        fields = [
            "id",
            "date",
            "submitted_by",
            "submitted_by_name",
            "total_sales",
            "total_profit",
            "total_transactions",
            "items_sold",
            "notes",
            "email_sent",
            "created_at",
        ]
        read_only_fields = ["id", "submitted_by", "total_sales", "total_profit", "total_transactions", "items_sold", "email_sent", "created_at"]

    def get_submitted_by_name(self, obj: EndOfDayReport) -> str:
        full_name = obj.submitted_by.get_full_name()
        return full_name or obj.submitted_by.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        staff_profile = getattr(user, "staff_profile", None)
        is_admin = bool(staff_profile and staff_profile.role == StaffProfile.Role.ADMIN)
        if not is_admin:
            data.pop("total_profit", None)
        return data
