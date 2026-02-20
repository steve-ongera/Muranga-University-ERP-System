// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Card, Loader, Alert, StatCard } from '../components/UI';
import {
  getStudents, createStudent, deleteStudent,
  getProgrammes, createProgramme,
  getUnits, createUnit,
  uploadMark, getStudentMarks
} from '../services/api';

const TABS = ['Students', 'Register Student', 'Programmes', 'Units', 'Upload Marks'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Students');
  const [students, setStudents] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 4000); };

  useEffect(() => {
    Promise.all([getStudents(), getProgrammes(), getUnits()])
      .then(([s, p, u]) => { setStudents(s); setProgrammes(p); setUnits(u); })
      .catch(() => flash('error', 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <><Navbar /><Loader /></>;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f3f4f6', minHeight: '100vh' }}>
      <Navbar />
      <div style={styles.container}>
        {/* Stats */}
        <div style={styles.statsGrid}>
          <StatCard label="Total Students" value={students.length} icon="🎓" />
          <StatCard label="Programmes" value={programmes.length} icon="📋" />
          <StatCard label="Units" value={units.length} icon="📚" />
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ ...styles.tab, ...(tab === t ? styles.activeTab : {}) }}>
              {t}
            </button>
          ))}
        </div>

        <Alert type={msg.type} message={msg.text} />

        {tab === 'Students' && (
          <StudentsTable students={students} onDelete={async (id) => {
            if (!confirm('Delete this student?')) return;
            await deleteStudent(id);
            setStudents(s => s.filter(x => x.id !== id));
            flash('success', 'Student removed.');
          }} />
        )}

        {tab === 'Register Student' && (
          <RegisterStudentForm programmes={programmes} onSuccess={(s) => {
            setStudents(prev => [s, ...prev]);
            flash('success', `Student ${s.reg_number} registered!`);
            setTab('Students');
          }} onError={(e) => flash('error', e)} />
        )}

        {tab === 'Programmes' && (
          <ProgrammesPanel programmes={programmes} onCreated={(p) => {
            setProgrammes(prev => [...prev, p]);
            flash('success', 'Programme created!');
          }} onError={(e) => flash('error', e)} />
        )}

        {tab === 'Units' && (
          <UnitsPanel units={units} programmes={programmes} onCreated={(u) => {
            setUnits(prev => [...prev, u]);
            flash('success', 'Unit created!');
          }} onError={(e) => flash('error', e)} />
        )}

        {tab === 'Upload Marks' && (
          <UploadMarksPanel students={students} units={units}
            onSuccess={() => flash('success', 'Marks saved!')}
            onError={(e) => flash('error', e)} />
        )}
      </div>
    </div>
  );
}

// ─── Sub-panels ──────────────────────────────────────────────────────────────

function StudentsTable({ students, onDelete }) {
  const [search, setSearch] = useState('');
  const filtered = students.filter(s =>
    s.reg_number.toLowerCase().includes(search.toLowerCase()) ||
    `${s.user.first_name} ${s.user.last_name}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Card title={`All Students (${students.length})`}>
      <input style={styles.search} placeholder="Search by name or reg number…"
        value={search} onChange={e => setSearch(e.target.value)} />
      <table style={styles.table}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            {['Reg No.', 'Name', 'Programme', 'Year', 'Email', 'Registered', 'Action'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((s, i) => (
            <tr key={s.id} style={i % 2 === 0 ? { background: '#fafafa' } : {}}>
              <td style={styles.td}><strong>{s.reg_number}</strong></td>
              <td style={styles.td}>{s.user.first_name} {s.user.last_name}</td>
              <td style={styles.td}>{s.programme_code}</td>
              <td style={{ ...styles.td, textAlign: 'center' }}>Year {s.year_of_study}</td>
              <td style={styles.td}>{s.user.email}</td>
              <td style={styles.td}>{new Date(s.date_registered).toLocaleDateString()}</td>
              <td style={styles.td}>
                <button onClick={() => onDelete(s.id)} style={styles.deleteBtn}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No students found.</p>}
    </Card>
  );
}

function RegisterStudentForm({ programmes, onSuccess, onError }) {
  const init = { first_name: '', last_name: '', email: '', username: '', password: '',
    reg_number: '', programme: '', year_of_study: 1, phone: '' };
  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { createStudent } = await import('../services/api');
      const student = await createStudent({ ...form, programme: Number(form.programme) });
      onSuccess(student);
      setForm(init);
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, name, type = 'text', ...rest }) => (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} type={type} value={form[name]}
        onChange={e => set(name, e.target.value)} required {...rest} />
    </div>
  );

  return (
    <Card title="Register New Student">
      <form onSubmit={handleSubmit} style={styles.formGrid}>
        <Field label="First Name" name="first_name" />
        <Field label="Last Name" name="last_name" />
        <Field label="Email" name="email" type="email" />
        <Field label="Phone" name="phone" required={false} />
        <Field label="Username" name="username" />
        <Field label="Password" name="password" type="password" />
        <Field label="Reg. Number" name="reg_number" />
        <div style={styles.field}>
          <label style={styles.label}>Year of Study</label>
          <select style={styles.input} value={form.year_of_study} onChange={e => set('year_of_study', e.target.value)}>
            <option value={1}>Year 1</option>
            <option value={2}>Year 2</option>
          </select>
        </div>
        <div style={{ ...styles.field, gridColumn: '1/-1' }}>
          <label style={styles.label}>Programme</label>
          <select style={styles.input} value={form.programme} onChange={e => set('programme', e.target.value)} required>
            <option value="">Select Programme</option>
            {programmes.map(p => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <button type="submit" style={styles.submitBtn} disabled={saving}>
            {saving ? 'Registering…' : '+ Register Student'}
          </button>
        </div>
      </form>
    </Card>
  );
}

function ProgrammesPanel({ programmes, onCreated, onError }) {
  const [form, setForm] = useState({ name: '', code: '', duration_years: 3, has_semester_3: false });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const p = await createProgramme(form);
      onCreated(p);
      setForm({ name: '', code: '', duration_years: 3, has_semester_3: false });
    } catch (err) { onError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <Card title="Add Programme">
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[['Programme Name', 'name', 'text'], ['Code', 'code', 'text'], ['Duration (Years)', 'duration_years', 'number']].map(([l, k, t]) => (
            <div key={k} style={styles.field}>
              <label style={styles.label}>{l}</label>
              <input style={styles.input} type={t} value={form[k]}
                onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required />
            </div>
          ))}
          <div style={styles.field}>
            <label style={styles.label}>Has Sem 3?</label>
            <input type="checkbox" checked={form.has_semester_3}
              onChange={e => setForm(f => ({ ...f, has_semester_3: e.target.checked }))} />
          </div>
          <button type="submit" style={styles.submitBtn} disabled={saving}>{saving ? '…' : '+ Add'}</button>
        </form>
      </Card>
      <Card title={`Programmes (${programmes.length})`}>
        <table style={styles.table}>
          <thead><tr style={{ background: '#f3f4f6' }}>
            {['Code', 'Name', 'Duration', 'Sem 3?'].map(h => <th key={h} style={styles.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {programmes.map((p, i) => (
              <tr key={p.id} style={i % 2 === 0 ? { background: '#fafafa' } : {}}>
                <td style={styles.td}><strong>{p.code}</strong></td>
                <td style={styles.td}>{p.name}</td>
                <td style={styles.td}>{p.duration_years} years</td>
                <td style={styles.td}>{p.has_semester_3 ? '✅ Yes' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function UnitsPanel({ units, programmes, onCreated, onError }) {
  const [form, setForm] = useState({ code: '', name: '', programme: '', year: 1, semester: 1 });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const u = await createUnit({ ...form, programme: Number(form.programme) });
      onCreated(u);
      setForm(f => ({ ...f, code: '', name: '' }));
    } catch (err) { onError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <Card title="Add Unit">
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={styles.field}>
            <label style={styles.label}>Programme</label>
            <select style={styles.input} value={form.programme} onChange={e => setForm(f => ({ ...f, programme: e.target.value }))} required>
              <option value="">Select</option>
              {programmes.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>
          </div>
          {[['Code', 'code'], ['Unit Name', 'name']].map(([l, k]) => (
            <div key={k} style={styles.field}>
              <label style={styles.label}>{l}</label>
              <input style={styles.input} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required />
            </div>
          ))}
          <div style={styles.field}>
            <label style={styles.label}>Year</label>
            <select style={styles.input} value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}>
              {[1, 2].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Semester</label>
            <select style={styles.input} value={form.semester} onChange={e => setForm(f => ({ ...f, semester: Number(e.target.value) }))}>
              {[1, 2, 3].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
          <button type="submit" style={styles.submitBtn} disabled={saving}>{saving ? '…' : '+ Add Unit'}</button>
        </form>
      </Card>
      <Card title={`Units (${units.length})`}>
        <table style={styles.table}>
          <thead><tr style={{ background: '#f3f4f6' }}>
            {['Code', 'Name', 'Programme', 'Year', 'Semester'].map(h => <th key={h} style={styles.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {units.map((u, i) => (
              <tr key={u.id} style={i % 2 === 0 ? { background: '#fafafa' } : {}}>
                <td style={styles.td}><strong>{u.code}</strong></td>
                <td style={styles.td}>{u.name}</td>
                <td style={styles.td}>{u.programme_name}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>Year {u.year}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>Sem {u.semester}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function UploadMarksPanel({ students, units, onSuccess, onError }) {
  const [form, setForm] = useState({ student: '', unit: '', cat_score: '', exam_score: '' });
  const [saving, setSaving] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await uploadMark({
        student: Number(form.student),
        unit: Number(form.unit),
        cat_score: form.cat_score !== '' ? Number(form.cat_score) : null,
        exam_score: form.exam_score !== '' ? Number(form.exam_score) : null,
      });
      onSuccess();
    } catch (err) { onError(err.message); }
    finally { setSaving(false); }
  };

  const filteredUnits = form.student
    ? units.filter(u => {
        const stu = students.find(s => String(s.id) === form.student);
        return stu ? String(u.programme) === String(stu.programme) : true;
      })
    : units;

  return (
    <Card title="Upload / Update Marks">
      <p style={{ color: '#6b7280', fontSize: 14, marginTop: 0 }}>
        Select a student and unit, then enter CAT (max 30) and Exam (max 70) scores. Existing entries will be updated.
      </p>
      <form onSubmit={handleUpload} style={styles.formGrid}>
        <div style={styles.field}>
          <label style={styles.label}>Student</label>
          <select style={styles.input} value={form.student} onChange={e => setForm(f => ({ ...f, student: e.target.value }))} required>
            <option value="">Select Student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.reg_number} – {s.user.first_name} {s.user.last_name}</option>
            ))}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Unit</label>
          <select style={styles.input} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} required>
            <option value="">Select Unit</option>
            {filteredUnits.map(u => (
              <option key={u.id} value={u.id}>{u.code} – {u.name} (Y{u.year}S{u.semester})</option>
            ))}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>CAT Score (0–30)</label>
          <input style={styles.input} type="number" min={0} max={30} step={0.5}
            value={form.cat_score} onChange={e => setForm(f => ({ ...f, cat_score: e.target.value }))} placeholder="e.g. 24" />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Exam Score (0–70)</label>
          <input style={styles.input} type="number" min={0} max={70} step={0.5}
            value={form.exam_score} onChange={e => setForm(f => ({ ...f, exam_score: e.target.value }))} placeholder="e.g. 55" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <button type="submit" style={styles.submitBtn} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Marks'}
          </button>
        </div>
      </form>
    </Card>
  );
}

const styles = {
  container: { maxWidth: 1100, margin: '0 auto', padding: '24px 16px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 },
  tabs: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  tab: { padding: '8px 18px', borderRadius: 8, border: '1.5px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151' },
  activeTab: { background: '#1a3c6e', color: '#fff', border: '1.5px solid #1a3c6e' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' },
  td: { padding: '10px 12px', fontSize: 14, color: '#111827', borderBottom: '1px solid #f3f4f6' },
  deleteBtn: { background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  search: { marginBottom: 12, padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 },
  submitBtn: { marginTop: 8, padding: '10px 24px', background: 'linear-gradient(135deg, #1a3c6e, #2d6a4f)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};