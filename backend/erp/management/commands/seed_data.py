"""
Management command to seed the database with sample data.

Usage:
    python manage.py seed_data
    python manage.py seed_data --clear     # wipe existing data first
    python manage.py seed_data --minimal   # admin + 2 students only
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from erp.models import User, Programme, Student, Unit, Mark


PROGRAMMES = [
    {
        "name": "Bachelor of Science in Computer Science",
        "code": "BSC-CS",
        "duration_years": 3,
        "has_semester_3": False,
    },
    {
        "name": "Bachelor of Science in Information Technology",
        "code": "BSC-IT",
        "duration_years": 3,
        "has_semester_3": False,
    },
    {
        "name": "Bachelor of Engineering in Electrical & Electronics",
        "code": "BEE",
        "duration_years": 4,
        "has_semester_3": True,
    },
    {
        "name": "Bachelor of Commerce",
        "code": "BCOM",
        "duration_years": 3,
        "has_semester_3": False,
    },
]

# Units per programme: (code, name, year, semester)
UNITS = {
    "BSC-CS": [
        # Year 1
        ("CS101", "Introduction to Programming",           1, 1),
        ("CS102", "Mathematics for Computing I",           1, 1),
        ("CS103", "Computer Organisation",                 1, 1),
        ("CS104", "Communication Skills",                  1, 1),
        ("CS105", "Data Structures & Algorithms",          1, 2),
        ("CS106", "Mathematics for Computing II",          1, 2),
        ("CS107", "Operating Systems",                     1, 2),
        ("CS108", "Database Systems",                      1, 2),
        # Year 2
        ("CS201", "Object Oriented Programming",           2, 1),
        ("CS202", "Computer Networks",                     2, 1),
        ("CS203", "Software Engineering",                  2, 1),
        ("CS204", "Web Technologies",                      2, 1),
        ("CS205", "Artificial Intelligence",               2, 2),
        ("CS206", "Information Security",                  2, 2),
        ("CS207", "Mobile Application Development",        2, 2),
        ("CS208", "Research Methods",                      2, 2),
    ],
    "BSC-IT": [
        # Year 1
        ("IT101", "Fundamentals of IT",                    1, 1),
        ("IT102", "Mathematics for IT",                    1, 1),
        ("IT103", "Computer Hardware & Maintenance",       1, 1),
        ("IT104", "Business Communication",                1, 1),
        ("IT105", "Systems Analysis & Design",             1, 2),
        ("IT106", "Database Management",                   1, 2),
        ("IT107", "Web Design",                            1, 2),
        ("IT108", "Programming Fundamentals",              1, 2),
        # Year 2
        ("IT201", "Network Administration",                2, 1),
        ("IT202", "Enterprise Systems",                    2, 1),
        ("IT203", "Cloud Computing",                       2, 1),
        ("IT204", "IT Project Management",                 2, 1),
        ("IT205", "Cybersecurity",                         2, 2),
        ("IT206", "Data Analytics",                        2, 2),
        ("IT207", "IT Service Management",                 2, 2),
        ("IT208", "Research & Innovation",                 2, 2),
    ],
    "BEE": [
        # Year 1 — 3 semesters
        ("EE101", "Engineering Mathematics I",             1, 1),
        ("EE102", "Basic Electrical Engineering",          1, 1),
        ("EE103", "Engineering Drawing",                   1, 1),
        ("EE104", "Physics for Engineers",                 1, 2),
        ("EE105", "Engineering Mathematics II",            1, 2),
        ("EE106", "Circuit Theory",                        1, 2),
        ("EE107", "Workshop Practice",                     1, 3),
        ("EE108", "Technical Communication",               1, 3),
        # Year 2
        ("EE201", "Electronic Devices & Circuits",         2, 1),
        ("EE202", "Signals & Systems",                     2, 1),
        ("EE203", "Digital Electronics",                   2, 1),
        ("EE204", "Electromagnetic Fields",                2, 2),
        ("EE205", "Control Systems",                       2, 2),
        ("EE206", "Power Systems",                         2, 2),
        ("EE207", "Microprocessors & Microcontrollers",    2, 3),
        ("EE208", "Instrumentation",                       2, 3),
    ],
    "BCOM": [
        # Year 1
        ("BC101", "Principles of Accounting",              1, 1),
        ("BC102", "Business Mathematics",                  1, 1),
        ("BC103", "Introduction to Economics",             1, 1),
        ("BC104", "Business Communication",                1, 1),
        ("BC105", "Financial Accounting",                  1, 2),
        ("BC106", "Business Statistics",                   1, 2),
        ("BC107", "Principles of Management",              1, 2),
        ("BC108", "Commercial Law",                        1, 2),
        # Year 2
        ("BC201", "Cost Accounting",                       2, 1),
        ("BC202", "Marketing Management",                  2, 1),
        ("BC203", "Business Finance",                      2, 1),
        ("BC204", "Entrepreneurship",                      2, 1),
        ("BC205", "Auditing",                              2, 2),
        ("BC206", "Human Resource Management",             2, 2),
        ("BC207", "Strategic Management",                  2, 2),
        ("BC208", "Research Methods",                      2, 2),
    ],
}

# Sample students: (first, last, username, password, reg_number, programme_code, year)
STUDENTS = [
    # BSC-CS students
    ("Alice",   "Wanjiru",   "alice.wanjiru",   "student@123", "MU/CS/001/2023", "BSC-CS", 1),
    ("Brian",   "Mwangi",    "brian.mwangi",    "student@123", "MU/CS/002/2023", "BSC-CS", 1),
    ("Carol",   "Njeri",     "carol.njeri",     "student@123", "MU/CS/003/2023", "BSC-CS", 2),
    ("David",   "Kamau",     "david.kamau",     "student@123", "MU/CS/004/2023", "BSC-CS", 2),
    # BSC-IT students
    ("Esther",  "Waithera",  "esther.waithera", "student@123", "MU/IT/001/2023", "BSC-IT", 1),
    ("Francis", "Gitau",     "francis.gitau",   "student@123", "MU/IT/002/2023", "BSC-IT", 2),
    # BEE students
    ("Grace",   "Muthoni",   "grace.muthoni",   "student@123", "MU/EE/001/2023", "BEE",    1),
    ("Henry",   "Kiprotich", "henry.kiprotich", "student@123", "MU/EE/002/2023", "BEE",    2),
    # BCOM students
    ("Irene",   "Wambui",    "irene.wambui",    "student@123", "MU/BC/001/2023", "BCOM",   1),
    ("James",   "Otieno",    "james.otieno",    "student@123", "MU/BC/002/2023", "BCOM",   2),
]

# Marks template per student: realistic spread of scores
# (cat out of 30, exam out of 70) — randomised slightly per student
MARKS_TEMPLATE = [
    (24, 58),  # Total 82 → A
    (20, 45),  # Total 65 → B
    (18, 40),  # Total 58 → C
    (22, 52),  # Total 74 → A
    (15, 35),  # Total 50 → C
    (19, 43),  # Total 62 → B
    (25, 60),  # Total 85 → A
    (12, 30),  # Total 42 → D
]


class Command(BaseCommand):
    help = "Seed the database with sample programmes, units, students and marks."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing data before seeding.",
        )
        parser.add_argument(
            "--minimal",
            action="store_true",
            help="Seed admin + 2 students only (no marks).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write(self.style.WARNING("⚠  Clearing existing data..."))
            Mark.objects.all().delete()
            Student.objects.all().delete()
            Unit.objects.all().delete()
            Programme.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS("✔  Data cleared.\n"))

        # ── Admin account ─────────────────────────────────────────────────────
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "first_name": "System",
                "last_name": "Administrator",
                "email": "admin@muranga.ac.ke",
                "role": "admin",
                "is_staff": True,
            },
        )
        if created:
            admin.set_password("password123")
            admin.save()
            self.stdout.write(self.style.SUCCESS("✔  Admin account created   username=admin  password=Admin@1234"))
        else:
            self.stdout.write("→  Admin account already exists, skipped.")

        if options["minimal"]:
            self._seed_minimal()
            self._done()
            return

        # ── Programmes ────────────────────────────────────────────────────────
        self.stdout.write("\n📋 Seeding programmes...")
        prog_map = {}
        for p in PROGRAMMES:
            obj, created = Programme.objects.get_or_create(
                code=p["code"],
                defaults={
                    "name": p["name"],
                    "duration_years": p["duration_years"],
                    "has_semester_3": p["has_semester_3"],
                },
            )
            prog_map[p["code"]] = obj
            status = "created" if created else "exists "
            self.stdout.write(f"  [{status}]  {obj.code}  —  {obj.name}")

        # ── Units ─────────────────────────────────────────────────────────────
        self.stdout.write("\n📚 Seeding units...")
        unit_map = {}  # code → Unit
        total_units = 0
        for prog_code, units in UNITS.items():
            programme = prog_map[prog_code]
            for (code, name, year, semester) in units:
                obj, created = Unit.objects.get_or_create(
                    code=code,
                    defaults={
                        "name": name,
                        "programme": programme,
                        "year": year,
                        "semester": semester,
                    },
                )
                unit_map[code] = obj
                if created:
                    total_units += 1
        self.stdout.write(self.style.SUCCESS(f"  ✔  {total_units} units created ({len(unit_map)} total)."))

        # ── Students ──────────────────────────────────────────────────────────
        self.stdout.write("\n🎓 Seeding students...")
        student_objects = []
        for (first, last, username, password, reg_no, prog_code, year) in STUDENTS:
            user, u_created = User.objects.get_or_create(
                username=username,
                defaults={
                    "first_name": first,
                    "last_name": last,
                    "email": f"{username}@student.muranga.ac.ke",
                    "role": "student",
                },
            )
            if u_created:
                user.set_password(password)
                user.save()

            student, s_created = Student.objects.get_or_create(
                reg_number=reg_no,
                defaults={
                    "user": user,
                    "programme": prog_map[prog_code],
                    "year_of_study": year,
                    "phone": f"+2547{reg_no[-7:].replace('/', ''):0>8}"[:13],
                },
            )
            student_objects.append((student, prog_code, year))
            status = "created" if s_created else "exists "
            self.stdout.write(f"  [{status}]  {reg_no}  —  {first} {last}  ({prog_code})")

        # ── Marks ─────────────────────────────────────────────────────────────
        self.stdout.write("\n📊 Seeding marks...")
        marks_created = 0
        for idx, (student, prog_code, year_of_study) in enumerate(student_objects):
            student_units = [
                u for u in unit_map.values()
                if u.programme.code == prog_code and u.year <= year_of_study
            ]
            # rotate through the marks template so each student gets varied scores
            for unit_idx, unit in enumerate(student_units):
                cat, exam = MARKS_TEMPLATE[(idx + unit_idx) % len(MARKS_TEMPLATE)]
                # Add slight variation so not all scores are identical
                cat_var  = max(0, min(30, cat  + (idx % 3) - 1))
                exam_var = max(0, min(70, exam + (idx % 5) - 2))
                _, created = Mark.objects.get_or_create(
                    student=student,
                    unit=unit,
                    defaults={"cat_score": cat_var, "exam_score": exam_var},
                )
                if created:
                    marks_created += 1

        self.stdout.write(self.style.SUCCESS(f"  ✔  {marks_created} marks created."))
        self._done()

    def _seed_minimal(self):
        """Admin + 2 quick students, no marks."""
        self.stdout.write("\n⚡ Minimal mode: seeding 1 programme + 2 students...")
        prog, _ = Programme.objects.get_or_create(
            code="BSC-CS",
            defaults={"name": "Bachelor of Science in Computer Science", "duration_years": 3, "has_semester_3": False},
        )
        for (first, last, username, password, reg_no) in [
            ("Alice", "Wanjiru", "alice.wanjiru", "student@123", "MU/CS/001/2023"),
            ("Brian", "Mwangi",  "brian.mwangi",  "student@123", "MU/CS/002/2023"),
        ]:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"first_name": first, "last_name": last,
                          "email": f"{username}@student.muranga.ac.ke", "role": "student"},
            )
            if created:
                user.set_password(password)
                user.save()
            Student.objects.get_or_create(
                reg_number=reg_no,
                defaults={"user": user, "programme": prog, "year_of_study": 1},
            )
            self.stdout.write(f"  ✔  {reg_no} — {first} {last}")

    def _done(self):
        self.stdout.write("\n" + "─" * 55)
        self.stdout.write(self.style.SUCCESS("🎉  Seed complete!\n"))
        self.stdout.write("  Login credentials:")
        self.stdout.write("  ┌─────────────────────────────────────────────┐")
        self.stdout.write("  │  ADMIN    username: admin      pw: Admin@1234│")
        self.stdout.write("  │  STUDENT  username: alice.wanjiru pw: student@123│")
        self.stdout.write("  │  STUDENT  username: brian.mwangi  pw: student@123│")
        self.stdout.write("  └─────────────────────────────────────────────┘")