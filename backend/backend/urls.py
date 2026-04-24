from django.contrib import admin
from django.urls import path
from api import views

urlpatterns = [
    path('admin/', admin.site.urls),
    # Raw data
    path('api/igv-submissions/', views.igv_submissions),
    path('api/igte-submissions/', views.igte_submissions),
    path('api/igv-contracts/', views.igv_contracts),
    path('api/igte-contracts/', views.igte_contracts),
    # Analytics
    path('api/stats/', views.dashboard_stats),
    path('api/lc-performance/', views.lc_performance),
    path('api/status-breakdown/', views.submission_status_breakdown),
    path('api/contracts-by-lc/', views.contracts_by_lc),
    path('api/contract-types/', views.contract_types),
    path('api/industry-breakdown/', views.industry_breakdown),
    path('api/monthly-contracts/', views.monthly_contracts),
    path('api/org-size/', views.org_size_breakdown),
    path('api/top-lcs/', views.top_lcs_by_res),
    path('api/fulfillment-rate/', views.fulfillment_rate),
]
