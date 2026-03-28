/* ── Config ── */
const API = '/api/students';

/* ── Bootstrap modal instances ── */
let studentModal, deleteModal;
let deleteTargetId = null;

document.addEventListener('DOMContentLoaded', () => {
  studentModal = new bootstrap.Modal(document.getElementById('studentModal'));
  deleteModal  = new bootstrap.Modal(document.getElementById('deleteModal'));

  loadStudents();
  loadStats();

  // Form submit
  document.getElementById('studentForm').addEventListener('submit', handleFormSubmit);

  // Confirm delete
  document.getElementById('confirmDeleteBtn').addEventListener('click', handleDelete);

  // Search (debounced)
  let debounceTimer;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadStudents(e.target.value), 350);
  });
});

/* ─────────────────────────────────────────────────
   LOAD & RENDER
───────────────────────────────────────────────── */
async function loadStudents(search = '') {
  const url = search ? `${API}?search=${encodeURIComponent(search)}` : API;
  try {
    const res  = await fetch(url);
    const json = await res.json();
    renderTable(json.data || []);
  } catch (err) {
    showAlert('danger', 'Failed to load students. Is the server running?');
    renderTable([]);
  }
}

async function loadStats() {
  try {
    const res  = await fetch('/api/students/stats');
    const json = await res.json();
    const s = json.data;
    document.getElementById('statTotal').textContent    = s.total_students;
    document.getElementById('statSubjects').textContent = s.total_subjects;
    document.getElementById('statAGrade').textContent   = s.a_grade_students;
    document.getElementById('statNew').textContent      = s.new_this_month;
  } catch { /* silently ignore */ }
}

function renderTable(students) {
  const tbody = document.getElementById('studentTableBody');

  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">
      <i class="bi bi-inbox fs-1 d-block mb-2"></i>No students found</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map((s, i) => `
    <tr>
      <td class="text-muted small">${i + 1}</td>
      <td>
        <div class="fw-semibold">${esc(s.first_name)} ${esc(s.last_name)}</div>
        <div class="text-muted small">${s.date_of_birth ? formatDate(s.date_of_birth) : ''}</div>
      </td>
      <td><a href="mailto:${esc(s.email)}" class="text-decoration-none">${esc(s.email)}</a></td>
      <td>${esc(s.phone || '—')}</td>
      <td>${esc(s.subject || '—')}</td>
      <td>${gradeBadge(s.grade)}</td>
      <td class="small">${s.enrollment_date ? formatDate(s.enrollment_date) : '—'}</td>
      <td class="text-center">
        <button class="btn btn-outline-primary btn-action me-1"  onclick="openEditModal(${s.id})" title="Edit">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-outline-danger btn-action" onclick="openDeleteModal(${s.id}, '${esc(s.first_name)} ${esc(s.last_name)}')" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>`).join('');
}

/* ─────────────────────────────────────────────────
   ADD MODAL
───────────────────────────────────────────────── */
function openAddModal() {
  document.getElementById('modalTitle').innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Add Student';
  document.getElementById('studentForm').reset();
  document.getElementById('studentId').value = '';
  clearValidation();
}

/* ─────────────────────────────────────────────────
   EDIT MODAL
───────────────────────────────────────────────── */
async function openEditModal(id) {
  try {
    const res  = await fetch(`${API}/${id}`);
    const json = await res.json();
    if (!json.success) return showAlert('danger', 'Could not fetch student data.');
    const s = json.data;

    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Student';
    document.getElementById('studentId').value      = s.id;
    document.getElementById('first_name').value     = s.first_name || '';
    document.getElementById('last_name').value      = s.last_name  || '';
    document.getElementById('email').value          = s.email      || '';
    document.getElementById('phone').value          = s.phone      || '';
    document.getElementById('date_of_birth').value  = s.date_of_birth  ? s.date_of_birth.split('T')[0]  : '';
    document.getElementById('enrollment_date').value= s.enrollment_date? s.enrollment_date.split('T')[0]: '';
    document.getElementById('subject').value        = s.subject    || '';
    document.getElementById('grade').value          = s.grade      || '';

    clearValidation();
    studentModal.show();
  } catch (err) {
    showAlert('danger', 'Error loading student: ' + err.message);
  }
}

/* ─────────────────────────────────────────────────
   FORM SUBMIT (create / update)
───────────────────────────────────────────────── */
async function handleFormSubmit(e) {
  e.preventDefault();
  if (!e.target.checkValidity()) { e.target.classList.add('was-validated'); return; }

  const id = document.getElementById('studentId').value;
  const payload = {
    first_name:      document.getElementById('first_name').value.trim(),
    last_name:       document.getElementById('last_name').value.trim(),
    email:           document.getElementById('email').value.trim(),
    phone:           document.getElementById('phone').value.trim()            || null,
    date_of_birth:   document.getElementById('date_of_birth').value           || null,
    enrollment_date: document.getElementById('enrollment_date').value         || null,
    subject:         document.getElementById('subject').value.trim()          || null,
    grade:           document.getElementById('grade').value                   || null,
  };

  const url    = id ? `${API}/${id}` : API;
  const method = id ? 'PUT' : 'POST';

  try {
    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (json.success) {
      studentModal.hide();
      showAlert('success', json.message);
      loadStudents(document.getElementById('searchInput').value);
      loadStats();
    } else {
      showAlert('danger', json.message || 'Operation failed');
    }
  } catch (err) {
    showAlert('danger', 'Network error: ' + err.message);
  }
}

/* ─────────────────────────────────────────────────
   DELETE
───────────────────────────────────────────────── */
function openDeleteModal(id, name) {
  deleteTargetId = id;
  document.getElementById('deleteStudentName').textContent = name;
  deleteModal.show();
}

async function handleDelete() {
  if (!deleteTargetId) return;
  try {
    const res  = await fetch(`${API}/${deleteTargetId}`, { method: 'DELETE' });
    const json = await res.json();
    deleteModal.hide();
    if (json.success) {
      showAlert('success', json.message);
      loadStudents(document.getElementById('searchInput').value);
      loadStats();
    } else {
      showAlert('danger', json.message || 'Delete failed');
    }
  } catch (err) {
    showAlert('danger', 'Network error: ' + err.message);
  }
  deleteTargetId = null;
}

/* ─────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────── */
function showAlert(type, message) {
  const area = document.getElementById('alertArea');
  area.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
  setTimeout(() => {
    const a = area.querySelector('.alert');
    if (a) a.classList.remove('show');
  }, 4000);
}

function gradeBadge(grade) {
  if (!grade) return '<span class="text-muted">—</span>';
  const color = grade.startsWith('A') ? 'success'
              : grade.startsWith('B') ? 'primary'
              : grade.startsWith('C') ? 'warning'
              : 'danger';
  return `<span class="badge bg-${color}-subtle text-${color} badge-grade">${grade}</span>`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function clearValidation() {
  document.getElementById('studentForm').classList.remove('was-validated');
}
