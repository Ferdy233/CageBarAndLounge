from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from .models import Category, EndOfDayReport, InventoryItem, Notification, Sale, SaleItem, StaffProfile, StockAdjustment
from .serializers import (
    CategorySerializer,
    EndOfDayReportSerializer,
    InventoryItemSerializer,
    NotificationSerializer,
    SaleItemSerializer,
    SaleSerializer,
    StockAdjustmentSerializer,
    UserSerializer,
)


class IsBarStockAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        staff_profile = getattr(user, "staff_profile", None)
        return bool(staff_profile and staff_profile.role == StaffProfile.Role.ADMIN)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="create-staff", permission_classes=[IsBarStockAdmin])
    def create_staff(self, request):
        username = (request.data.get("username") or "").strip()
        staff_id = (request.data.get("staff_id") or username).strip()
        role = request.data.get("role") or StaffProfile.Role.STAFF

        first_name = (request.data.get("first_name") or "").strip()
        last_name = (request.data.get("last_name") or "").strip()
        name = (request.data.get("name") or "").strip()
        if name and (not first_name and not last_name):
            parts = [p for p in name.split(" ") if p]
            if parts:
                first_name = parts[0]
                if len(parts) > 1:
                    last_name = " ".join(parts[1:])

        if role not in (StaffProfile.Role.ADMIN, StaffProfile.Role.SUPERVISOR, StaffProfile.Role.STAFF):
            raise ValidationError({"role": "Invalid role"})
        if not username:
            raise ValidationError({"username": "Username is required"})
        if not staff_id:
            raise ValidationError({"staff_id": "Staff ID is required"})

        password = request.data.get("password")
        if not password:
            password = staff_id or username

        if User.objects.filter(username=username).exists():
            raise ValidationError({"username": "Username already exists"})
        if StaffProfile.objects.filter(staff_id=staff_id).exists():
            raise ValidationError({"staff_id": "Staff ID already exists"})

        with transaction.atomic():
            user = User.objects.create(username=username, first_name=first_name, last_name=last_name)
            user.set_password(password)
            user.save()

            StaffProfile.objects.create(user=user, staff_id=staff_id, role=role)

        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="change-password")
    def change_password(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password:
            raise ValidationError({"old_password": "Old password is required"})
        if not new_password:
            raise ValidationError({"new_password": "New password is required"})

        user = request.user
        if not user.check_password(old_password):
            raise ValidationError({"old_password": "Old password is incorrect"})

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password updated"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["delete"], url_path="delete-staff", permission_classes=[IsBarStockAdmin])
    def delete_staff(self, request, pk=None):
        user = self.get_object()
        if user.id == request.user.id:
            raise ValidationError({"detail": "You cannot delete yourself."})
        if user.is_superuser:
            raise ValidationError({"detail": "You cannot delete a superuser."})
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by("name")
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by("-created_at")
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Sale.objects.all().order_by("-created_at")
        user = getattr(self.request, "user", None)
        staff_profile = getattr(user, "staff_profile", None)
        is_admin = bool(staff_profile and staff_profile.role == StaffProfile.Role.ADMIN)

        if not is_admin:
            return qs.filter(staff=user)

        staff_param = self.request.query_params.get("staff")
        if staff_param:
            try:
                staff_id = int(staff_param)
            except (TypeError, ValueError):
                raise ValidationError({"staff": "Invalid staff user id"})
            qs = qs.filter(staff_id=staff_id)

        return qs

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)


class SaleItemViewSet(viewsets.ModelViewSet):
    queryset = SaleItem.objects.select_related("sale", "item").all().order_by("id")
    serializer_class = SaleItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        with transaction.atomic():
            sale_item = serializer.save()
            item = sale_item.item

            if sale_item.quantity <= 0:
                raise ValidationError({"quantity": "Quantity must be greater than 0."})

            if item.quantity < sale_item.quantity:
                raise ValidationError({"quantity": f"Not enough stock for {item.name}."})

            item.quantity = item.quantity - sale_item.quantity
            item.save(update_fields=["quantity", "updated_at"])


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.select_related("item").all().order_by("-created_at")
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]


class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.select_related("item", "adjusted_by").all().order_by("-created_at")
    serializer_class = StockAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsBarStockAdmin()]
        return [permissions.IsAuthenticated()]


class IsSupervisorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        staff_profile = getattr(user, "staff_profile", None)
        return bool(staff_profile and staff_profile.role in (StaffProfile.Role.ADMIN, StaffProfile.Role.SUPERVISOR))


class EndOfDayReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EndOfDayReport.objects.all().order_by("-date")
    serializer_class = EndOfDayReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="submit", permission_classes=[IsSupervisorOrAdmin])
    def submit_eod(self, request):
        today = timezone.localdate()
        notes = request.data.get("notes", "")

        if EndOfDayReport.objects.filter(date=today).exists():
            raise ValidationError({"detail": "End of day report already submitted for today."})

        # Calculate today's sales
        today_sales = Sale.objects.filter(created_at__date=today)
        sale_items = SaleItem.objects.filter(sale__in=today_sales)

        total_sales = sale_items.aggregate(
            total=Coalesce(Sum("selling_price") * Sum("quantity") / Sum("quantity"), 0)
        )
        # Recalculate properly
        total_revenue = sum(si.selling_price * si.quantity for si in sale_items)
        total_cost = sum(si.cost_price * si.quantity for si in sale_items)
        total_profit = total_revenue - total_cost
        total_transactions = today_sales.count()
        items_sold = sum(si.quantity for si in sale_items)

        with transaction.atomic():
            report = EndOfDayReport.objects.create(
                date=today,
                submitted_by=request.user,
                total_sales=total_revenue,
                total_profit=total_profit,
                total_transactions=total_transactions,
                items_sold=items_sold,
                notes=notes,
            )

            # Send email to admin(s)
            admin_emails = list(
                User.objects.filter(
                    staff_profile__role=StaffProfile.Role.ADMIN
                ).values_list("email", flat=True)
            )
            admin_emails = [e for e in admin_emails if e]

            if admin_emails:
                subject = f"End of Day Report - {today.strftime('%B %d, %Y')}"
                message = f"""End of Day Sales Report

Date: {today.strftime('%B %d, %Y')}
Submitted by: {request.user.get_full_name() or request.user.username}

Summary:
- Total Sales: GH₵ {total_revenue:,.2f}
- Total Profit: GH₵ {total_profit:,.2f}
- Transactions: {total_transactions}
- Items Sold: {items_sold}

Notes: {notes or 'None'}

---
Cage Bar and Lounge Management System
"""
                try:
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        admin_emails,
                        fail_silently=False,
                    )
                    report.email_sent = True
                    report.save(update_fields=["email_sent"])
                except Exception:
                    pass  # Email failed but report is saved

        serializer = self.get_serializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="today")
    def today_status(self, request):
        today = timezone.localdate()
        report = EndOfDayReport.objects.filter(date=today).first()
        if report:
            serializer = self.get_serializer(report)
            return Response({"submitted": True, "report": serializer.data})
        
        # Return today's stats preview
        today_sales = Sale.objects.filter(created_at__date=today)
        sale_items = SaleItem.objects.filter(sale__in=today_sales)
        total_revenue = sum(si.selling_price * si.quantity for si in sale_items)
        total_cost = sum(si.cost_price * si.quantity for si in sale_items)
        total_profit = total_revenue - total_cost
        total_transactions = today_sales.count()
        items_sold = sum(si.quantity for si in sale_items)

        return Response({
            "submitted": False,
            "preview": {
                "date": today.isoformat(),
                "total_sales": float(total_revenue),
                "total_profit": float(total_profit),
                "total_transactions": total_transactions,
                "items_sold": items_sold,
            }
        })
