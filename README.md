# Muranga University ERP System

A full-stack Student Information System built with **Django REST Framework** (backend) and **React + Vite** (frontend). Supports two user roles: **Admin** and **Student**.

---

## 🏗️ Project Structure

```
muranga_erp/
├── backend/                    # Django project
│   ├── manage.py
│   ├── requirements.txt
│   ├── muranga_erp/            # Django project config folder
│   │   ├── settings.py         # (use settings_snippet.py as reference)
│   │   └── urls.py             # ← copy from main_urls.py
│   └── core/                   # Main Django app
│       ├── models.py           # User, Programme, Student, Unit, Mark
│       ├── serializers.py      # DRF serializers
│       ├── views.py            # ViewSets + APIViews
│       ├── urls.py             # App-level URL patterns
│       └── admin.py
│
└── frontend/                   # React + Vite app
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx            # Entry point
        ├── App.jsx             # Routes
        ├── context/
        │   └── AuthContext.jsx # JWT auth state
        ├── services/
        │   └── api.js          # All API calls
        ├── components/
        │   ├── Navbar.jsx      # Top navigation bar
        │   ├── ProtectedRoute.jsx  # Role-based route guard
        │   └── UI.jsx          # Card, Badge, Loader, Alert, StatCard
        └── pages/
            ├── LoginPage.jsx       # Shared login (redirects by role)
            ├── StudentDashboard.jsx # Student marks view
            └── AdminDashboard.jsx  # Full admin panel
```

---

## ⚙️ Backend Setup

### 1. Requirements

```
django>=4.2
djangorestframework>=3.15
djangorestframework-simplejwt>=5.3
django-cors-headers>=4.3
```

Install:
```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
```

### 2. Create Django Project & App

```bash
django-admin startproject muranga_erp .
python manage.py startapp core
```

### 3. Configure settings.py

Copy the contents of `settings_snippet.py` into your `settings.py`. Key additions:
- `AUTH_USER_MODEL = 'core.User'` — custom user model
- `INSTALLED_APPS` — add `core`, `rest_framework`, `corsheaders`, `rest_framework_simplejwt.token_blacklist`
- `REST_FRAMEWORK` — JWT authentication by default
- `SIMPLE_JWT` — 8-hour access token, 7-day refresh
- `CORS_ALLOWED_ORIGINS` — allow React dev server

### 4. Configure URLs

In `muranga_erp/urls.py` (use `main_urls.py` as reference):
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view()),
]
```

### 5. Migrate & Create Superuser

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser   # set role='admin' via shell or Django admin
```

### 6. Set Admin Role (Django Shell)

```python
python manage.py shell
>>> from core.models import User
>>> u = User.objects.get(username='your_admin_username')
>>> u.role = 'admin'
>>> u.save()
```

### 7. Run Backend

```bash
python manage.py runserver
```
API available at: `http://localhost:8000/api/`

---

## 🗄️ Data Models

| Model | Fields |
|-------|--------|
| **User** | username, password, first_name, last_name, email, role (admin/student) |
| **Programme** | name, code, duration_years, has_semester_3 |
| **Student** | user (1:1), reg_number, programme, year_of_study, phone |
| **Unit** | code, name, programme, year (1/2), semester (1/2/3) |
| **Mark** | student, unit, cat_score, exam_score → total, grade (computed) |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login → returns JWT tokens + user |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET | `/api/auth/me/` | Current user info |
| POST | `/api/token/refresh/` | Refresh access token |

### Student Self-Service (role: student)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/my/profile/` | Own student profile |
| GET | `/api/my/marks/` | All own marks |

### Admin – CRUD (role: admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/students/` | List / register students |
| DELETE | `/api/students/{id}/` | Remove student |
| GET | `/api/students/{id}/marks/` | All marks for a student |
| GET/POST | `/api/programmes/` | List / create programmes |
| GET/POST | `/api/units/` | List / create units (filter: ?programme=&year=&semester=) |
| GET/POST | `/api/marks/` | List / upload marks (POST does upsert) |

---

## ⚛️ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
App runs at: `http://localhost:5173`

The Vite dev server proxies `/api` requests to `http://localhost:8000`, so no CORS issues during development.

---

## 🖥️ Pages & Flow

```
/login
  └── POST /api/auth/login/
       ├── role=admin → /admin
       └── role=student → /dashboard

/admin  (AdminDashboard)
  ├── Tab: Students       → GET /api/students/
  ├── Tab: Register       → POST /api/students/
  ├── Tab: Programmes     → GET/POST /api/programmes/
  ├── Tab: Units          → GET/POST /api/units/
  └── Tab: Upload Marks   → POST /api/marks/

/dashboard  (StudentDashboard)
  ├── GET /api/my/profile/
  └── GET /api/my/marks/
       └── Grouped by: Year 1 Sem 1, Year 1 Sem 2, [Year 1 Sem 3], Year 2 Sem 1, Year 2 Sem 2 ...
```

---

## 🔐 Authentication Flow

1. User submits username + password to `/api/auth/login/`
2. Backend returns `access` (JWT, 8h) + `refresh` (JWT, 7d) + user object
3. Frontend stores tokens in `localStorage`, user in state
4. Every API request includes `Authorization: Bearer <access_token>` header
5. On 401 response: frontend tries `POST /api/token/refresh/` automatically
6. On logout: refresh token is blacklisted server-side

---

## 📊 Grading System

| Grade | Total Score |
|-------|-------------|
| A | 70 – 100 |
| B | 60 – 69 |
| C | 50 – 59 |
| D | 40 – 49 |
| E (Fail) | 0 – 39 |

CAT max: 30 marks | Exam max: 70 marks | Total: 100 marks

---

## 🚀 Quick Start (Both Servers)

```bash
# Terminal 1 — Backend
cd backend
python manage.py runserver

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` and log in.

---

## 🔧 Environment Variables

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000/api
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Django 4.x + Django REST Framework |
| Authentication | JWT (SimpleJWT) with token blacklisting |
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Native `fetch` API |
| Styling | Inline styles (zero dependencies) |
| Database | SQLite (dev) / PostgreSQL (prod) |

---

## 🛠️ Production Notes

- Set `DEBUG=False` and configure `ALLOWED_HOSTS` in settings
- Use PostgreSQL instead of SQLite
- Serve React build with Nginx
- Use Gunicorn for Django
- Store secrets in environment variables (never hardcode)# Muranga-University-ERP-System
