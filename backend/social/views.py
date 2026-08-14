from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsSupportOrAdmin
from social.factory import NotificationFactory
from social.models import Notification, Ticket, TicketMessage
from social.serializers import NotificationSerializer, TicketSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    http_method_names = ["get", "delete", "head", "options"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        notif = self.get_object()
        notif.delete()
        return Response(status=204)

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notif = self.get_object()
        notif.read = True
        notif.save(update_fields=["read"])
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        updated = Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response({"updated": updated})


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = Ticket.objects.all().prefetch_related("messages", "user")
        user = self.request.user
        if user.role in (user.Role.SUPPORT, user.Role.ADMIN):
            return qs
        return qs.filter(user=user)

    def create(self, request, *args, **kwargs):
        subject = (request.data.get("subject") or "").strip()
        body = (request.data.get("body") or "").strip()
        if not subject or not body:
            return Response({"error": "موضوع و متن تیکت الزامی است."}, status=400)
        ticket = Ticket.objects.create(user=request.user, subject=subject)
        TicketMessage.objects.create(ticket=ticket, sender=request.user, body=body)
        NotificationFactory.ticket_created(ticket)
        return Response(TicketSerializer(ticket).data, status=201)

    def partial_update(self, request, *args, **kwargs):
        if request.user.role not in (request.user.Role.SUPPORT, request.user.Role.ADMIN):
            return Response({"error": "اجازه تغییر وضعیت تیکت را ندارید."}, status=403)
        ticket = self.get_object()
        status_value = request.data.get("status")
        if status_value not in dict(Ticket.Status.choices):
            return Response({"error": "وضعیت نامعتبر است."}, status=400)
        ticket.status = status_value
        ticket.save(update_fields=["status"])
        return Response(TicketSerializer(ticket).data)

    @action(detail=True, methods=["post"])
    def messages(self, request, pk=None):
        ticket = self.get_object()
        body = (request.data.get("body") or "").strip()
        if not body:
            return Response({"error": "متن پیام الزامی است."}, status=400)
        if ticket.user_id != request.user.pk and request.user.role not in (
            request.user.Role.SUPPORT,
            request.user.Role.ADMIN,
        ):
            return Response({"error": "اجازه پاسخ به این تیکت را ندارید."}, status=403)
        TicketMessage.objects.create(ticket=ticket, sender=request.user, body=body)
        if request.user.role in (request.user.Role.SUPPORT, request.user.Role.ADMIN):
            ticket.status = Ticket.Status.ANSWERED
            ticket.save(update_fields=["status"])
            NotificationFactory.ticket_replied(ticket)
        return Response(TicketSerializer(ticket).data)
