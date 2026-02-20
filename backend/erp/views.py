from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Prefetch

from .models import User, Programme, Student, Unit, Mark
from .serializers import (
    LoginSerializer, UserSerializer, ProgrammeSerializer,
    StudentSerializer, StudentCreateSerializer,
    UnitSerializer, MarkSerializer, MarkUploadSerializer
)


# ─── Permissions ────────────────────────────────────────────────────────────
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


# ─── Auth ────────────────────────────────────────────────────────────────────
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


class LogoutView(APIView):
    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
        except Exception:
            pass
        return Response({'detail': 'Logged out.'})


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ─── Programme ───────────────────────────────────────────────────────────────
class ProgrammeViewSet(viewsets.ModelViewSet):
    queryset = Programme.objects.all()
    serializer_class = ProgrammeSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]


# ─── Student ─────────────────────────────────────────────────────────────────
class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('user', 'programme').all()
    serializer_class = StudentSerializer
    permission_classes = [IsAdmin]

    def create(self, request):
        serializer = StudentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return Response(StudentSerializer(student).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='marks')
    def student_marks(self, request, pk=None):
        student = self.get_object()
        marks = Mark.objects.filter(student=student).select_related('unit')
        return Response(MarkSerializer(marks, many=True).data)


# ─── Unit ────────────────────────────────────────────────────────────────────
class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.select_related('programme').all()
    serializer_class = UnitSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        programme = self.request.query_params.get('programme')
        year = self.request.query_params.get('year')
        semester = self.request.query_params.get('semester')
        if programme:
            qs = qs.filter(programme_id=programme)
        if year:
            qs = qs.filter(year=year)
        if semester:
            qs = qs.filter(semester=semester)
        return qs


# ─── Mark ────────────────────────────────────────────────────────────────────
class MarkViewSet(viewsets.ModelViewSet):
    queryset = Mark.objects.select_related('student', 'unit').all()
    serializer_class = MarkSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def create(self, request):
        serializer = MarkUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mark, created = Mark.objects.update_or_create(
            student=serializer.validated_data['student'],
            unit=serializer.validated_data['unit'],
            defaults={
                'cat_score': serializer.validated_data.get('cat_score'),
                'exam_score': serializer.validated_data.get('exam_score'),
            }
        )
        return Response(MarkSerializer(mark).data,
                        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs


# ─── Student self-service ────────────────────────────────────────────────────
class MyProfileView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        try:
            student = Student.objects.select_related('user', 'programme').get(user=request.user)
            return Response(StudentSerializer(student).data)
        except Student.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=404)


class MyMarksView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found.'}, status=404)

        marks = Mark.objects.filter(student=student).select_related('unit').order_by(
            'unit__year', 'unit__semester', 'unit__code'
        )
        return Response(MarkSerializer(marks, many=True).data)