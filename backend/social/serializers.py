from rest_framework import serializers

from social.models import Notification, Ticket, TicketMessage


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "user_id", "title", "body", "read", "href", "created_at")
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(instance.pk)
        data["userId"] = str(instance.user_id)
        data.pop("user_id", None)
        return data


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = ("id", "sender_id", "body", "created_at")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(instance.pk)
        return data

    def get_sender_id(self, obj):
        return str(obj.sender_id)


class TicketSerializer(serializers.ModelSerializer):
    user_id = serializers.SerializerMethodField()
    messages = TicketMessageSerializer(many=True, read_only=True)
    user_display_name = serializers.CharField(source="user.display_name", read_only=True)

    class Meta:
        model = Ticket
        fields = (
            "id",
            "user_id",
            "user_display_name",
            "subject",
            "status",
            "messages",
            "created_at",
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(instance.pk)
        return data

    def get_user_id(self, obj):
        return str(obj.user_id)
