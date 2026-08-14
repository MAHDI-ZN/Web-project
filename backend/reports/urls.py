from django.urls import path

from reports.views import AdminReportView, ArtistReportView, SupportReportView

urlpatterns = [
    path("admin/", AdminReportView.as_view()),
    path("support/", SupportReportView.as_view()),
    path("artist/", ArtistReportView.as_view()),
]
