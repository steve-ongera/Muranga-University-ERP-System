from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, LogoutView, MeView,
    ProgrammeViewSet, StudentViewSet, UnitViewSet, MarkViewSet,
    MyProfileView, MyMarksView
)

router = DefaultRouter()
router.register(r'programmes', ProgrammeViewSet, basename='programme')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'units', UnitViewSet, basename='unit')
router.register(r'marks', MarkViewSet, basename='mark')

urlpatterns = [
    # Auth
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),

    # Student self-service
    path('my/profile/', MyProfileView.as_view(), name='my-profile'),
    path('my/marks/', MyMarksView.as_view(), name='my-marks'),

    # Router URLs (admin CRUD)
    path('', include(router.urls)),
]