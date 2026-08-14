from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdmin, IsArtistApproved, IsSupportOrAdmin
from reports.services import ReportService


class AdminReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(ReportService().admin_dashboard())


class SupportReportView(APIView):
    permission_classes = [IsSupportOrAdmin]

    def get(self, request):
        return Response(ReportService().support_dashboard())


class ArtistReportView(APIView):
    permission_classes = [IsArtistApproved]

    def get(self, request):
        return Response(ReportService().artist_dashboard(request.user))
