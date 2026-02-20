// src/pages/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Card, Badge, Loader, StatCard } from '../components/UI';
import { getMyProfile, getMyMarks } from '../services/api';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Y1S1');

  useEffect(() => {
    const load = async () => {
      try {
        const [p, m] = await Promise.all([getMyProfile(), getMyMarks()]);
        setProfile(p);
        setMarks(m);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <><Navbar /><Loader /></>;

  // Build semester groups
  const semesterGroups = buildSemesterGroups(marks, profile);
  const tabs = Object.keys(semesterGroups);
  const currentMarks = semesterGroups[activeTab] || [];

  // Stats
  const totalUnits = marks.length;
  const passed = marks.filter(m => m.total >= 40).length;
  const avgTotal = marks.length
    ? (marks.reduce((s, m) => s + m.total, 0) / marks.length).toFixed(1)
    : '-';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f3f4f6', minHeight: '100vh' }}>
      <Navbar />
      <div style={styles.container}>
        {/* Welcome Banner */}
        <div style={styles.banner}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: 22 }}>
              Welcome, {profile?.user?.first_name || 'Student'} 👋
            </h2>
            <p style={{ margin: '4px 0 0', color: '#cce8ff', fontSize: 14 }}>
              {profile?.reg_number} | {profile?.programme_name} | Year {profile?.user && 'year_of_study' in (profile || {}) ? profile.year_of_study : ''}
            </p>
          </div>
          <div style={styles.regBadge}>{profile?.reg_number}</div>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <StatCard label="Total Units" value={totalUnits} icon="📚" />
          <StatCard label="Units Passed" value={passed} icon="✅" />
          <StatCard label="Average Score" value={avgTotal} icon="📊" />
          <StatCard label="Programme" value={profile?.programme_code || '-'} icon="🎓" />
        </div>

        {/* Marks Table */}
        <Card title="Academic Results">
          {/* Semester Tabs */}
          <div style={styles.tabs}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}
              >
                {tab.replace('Y', 'Year ').replace('S', ' | Sem ')}
              </button>
            ))}
          </div>

          {currentMarks.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>
              No results uploaded for this semester yet.
            </p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Unit Code</th>
                  <th style={styles.th}>Unit Name</th>
                  <th style={styles.th}>CAT (30)</th>
                  <th style={styles.th}>Exam (70)</th>
                  <th style={styles.th}>Total (100)</th>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentMarks.map((m, i) => (
                  <tr key={m.id} style={i % 2 === 0 ? styles.trEven : {}}>
                    <td style={styles.td}><strong>{m.unit_code}</strong></td>
                    <td style={styles.td}>{m.unit_name}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{m.cat_score ?? '-'}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{m.exam_score ?? '-'}</td>
                    <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700 }}>{m.total.toFixed(1)}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}><Badge grade={m.grade} /></td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={{ color: m.total >= 40 ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 13 }}>
                        {m.total >= 40 ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Grade Key */}
        <Card title="Grade Key">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[['A', '70–100'], ['B', '60–69'], ['C', '50–59'], ['D', '40–49'], ['E', '0–39 (Fail)']].map(([g, r]) => (
              <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Badge grade={g} /> {r}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function buildSemesterGroups(marks, profile) {
  const groups = {};
  const years = [1, 2];
  const sems = profile?.has_semester_3 ? [1, 2, 3] : [1, 2];

  years.forEach(y => {
    sems.forEach(s => {
      const key = `Y${y}S${s}`;
      const filtered = marks.filter(m => m.year === y && m.semester === s);
      groups[key] = filtered;
    });
  });
  return groups;
}

const styles = {
  container: { maxWidth: 1000, margin: '0 auto', padding: '24px 16px' },
  banner: {
    background: 'linear-gradient(135deg, #1a3c6e 0%, #2d6a4f 100%)',
    borderRadius: 12,
    padding: '24px 28px',
    marginBottom: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regBadge: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    borderRadius: 8,
    padding: '8px 16px',
    fontWeight: 700,
    fontSize: 14,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 20,
  },
  tabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tab: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1.5px solid #d1d5db',
    background: '#f9fafb',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
  },
  activeTab: {
    background: '#1a3c6e',
    color: '#fff',
    border: '1.5px solid #1a3c6e',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f3f4f6' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' },
  td: { padding: '10px 12px', fontSize: 14, color: '#111827', borderBottom: '1px solid #f3f4f6' },
  trEven: { background: '#fafafa' },
};