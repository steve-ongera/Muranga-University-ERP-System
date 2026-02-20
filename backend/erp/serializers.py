from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Programme, Student, Unit, Mark


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'role')


class ProgrammeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Programme
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    programme_name = serializers.CharField(source='programme.name', read_only=True)
    programme_code = serializers.CharField(source='programme.code', read_only=True)
    has_semester_3 = serializers.BooleanField(source='programme.has_semester_3', read_only=True)

    class Meta:
        model = Student
        fields = ('id', 'user', 'reg_number', 'programme', 'programme_name',
                  'programme_code', 'has_semester_3', 'year_of_study', 'phone', 'date_registered')


class StudentCreateSerializer(serializers.Serializer):
    """Used by admin to register a new student."""
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    reg_number = serializers.CharField()
    programme = serializers.PrimaryKeyRelatedField(queryset=Programme.objects.all())
    year_of_study = serializers.IntegerField(default=1)
    phone = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_reg_number(self, value):
        if Student.objects.filter(reg_number=value).exists():
            raise serializers.ValidationError("Reg number already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email'],
            role='student'
        )
        student = Student.objects.create(
            user=user,
            reg_number=validated_data['reg_number'],
            programme=validated_data['programme'],
            year_of_study=validated_data.get('year_of_study', 1),
            phone=validated_data.get('phone', '')
        )
        return student


class UnitSerializer(serializers.ModelSerializer):
    programme_name = serializers.CharField(source='programme.name', read_only=True)

    class Meta:
        model = Unit
        fields = ('id', 'code', 'name', 'programme', 'programme_name', 'year', 'semester')


class MarkSerializer(serializers.ModelSerializer):
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    year = serializers.IntegerField(source='unit.year', read_only=True)
    semester = serializers.IntegerField(source='unit.semester', read_only=True)
    total = serializers.FloatField(read_only=True)
    grade = serializers.CharField(read_only=True)

    class Meta:
        model = Mark
        fields = ('id', 'student', 'unit', 'unit_code', 'unit_name',
                  'year', 'semester', 'cat_score', 'exam_score', 'total', 'grade', 'uploaded_at')


class MarkUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mark
        fields = ('student', 'unit', 'cat_score', 'exam_score')

    def validate(self, data):
        for field in ('cat_score', 'exam_score'):
            val = data.get(field)
            if val is not None and not (0 <= float(val) <= 100):
                raise serializers.ValidationError(f"{field} must be between 0 and 100.")
        return data