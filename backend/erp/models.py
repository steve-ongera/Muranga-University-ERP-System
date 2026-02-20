from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (('admin', 'Admin'), ('student', 'Student'))
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')

    def __str__(self):
        return f"{self.username} ({self.role})"


class Programme(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    duration_years = models.IntegerField(default=3)
    has_semester_3 = models.BooleanField(default=False)  # some programmes have 3 sems/year

    def __str__(self):
        return f"{self.code} - {self.name}"


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    reg_number = models.CharField(max_length=30, unique=True)
    programme = models.ForeignKey(Programme, on_delete=models.SET_NULL, null=True)
    year_of_study = models.IntegerField(default=1)
    phone = models.CharField(max_length=15, blank=True)
    date_registered = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reg_number} - {self.user.get_full_name()}"


class Unit(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    programme = models.ForeignKey(Programme, on_delete=models.CASCADE, related_name='units')
    year = models.IntegerField()  # 1 or 2
    semester = models.IntegerField()  # 1, 2, or 3

    def __str__(self):
        return f"{self.code} - {self.name} (Y{self.year}S{self.semester})"


class Mark(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='marks')
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='marks')
    cat_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    exam_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'unit')

    @property
    def total(self):
        cat = self.cat_score or 0
        exam = self.exam_score or 0
        return float(cat) + float(exam)

    @property
    def grade(self):
        t = self.total
        if t >= 70: return 'A'
        if t >= 60: return 'B'
        if t >= 50: return 'C'
        if t >= 40: return 'D'
        return 'E'

    def __str__(self):
        return f"{self.student.reg_number} - {self.unit.code}: {self.total}"