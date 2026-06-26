document.addEventListener('DOMContentLoaded', () => {

  setTimeout(() => {
    document.querySelectorAll('.alert-toast').forEach(el => {
      el.style.animation = 'slideIn 0.35s reverse forwards';
      setTimeout(() => el.remove(), 350);
    });
  }, 5000);

  document.querySelectorAll('.alert-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const toast = btn.closest('.alert-toast');
      toast.style.animation = 'slideIn 0.3s reverse forwards';
      setTimeout(() => toast.remove(), 300);
    });
  });

  document.querySelectorAll('.status-toggle').forEach(toggle => {
    toggle.addEventListener('change', async function () {
      const id = this.dataset.id;
      const url = this.dataset.url;
      const badge = document.getElementById(`badge-${id}`);
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        if (data.success) {
          if (badge) {
            badge.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
            badge.className = `status-badge ${data.status}`;
          }
        } else {
          this.checked = !this.checked;
        }
      } catch {
        this.checked = !this.checked;
      }
    });
  });

  const categorySelect = document.getElementById('categorySelect');
  const subcategorySelect = document.getElementById('subcategorySelect');
  const extraSelect = document.getElementById('extraCategorySelect');

  if (categorySelect && subcategorySelect) {
    categorySelect.addEventListener('change', async function () {
      const catId = this.value;
      subcategorySelect.innerHTML = '<option value="">Loading...</option>';
      if (extraSelect) extraSelect.innerHTML = '<option value="">-- Select Extra Category --</option>';
      if (!catId) {
        subcategorySelect.innerHTML = '<option value="">-- Select Subcategory --</option>';
        return;
      }
      try {
        const res = await fetch(`/subcategory/by-category/${catId}`);
        const data = await res.json();
        subcategorySelect.innerHTML = '<option value="">-- Select Subcategory --</option>';
        data.subcategories.forEach(s => {
          subcategorySelect.innerHTML += `<option value="${s._id}">${s.name}</option>`;
        });
      } catch {
        subcategorySelect.innerHTML = '<option value="">-- Error loading --</option>';
      }
    });
  }

  if (subcategorySelect && extraSelect) {
    subcategorySelect.addEventListener('change', async function () {
      const subId = this.value;
      extraSelect.innerHTML = '<option value="">Loading...</option>';
      if (!subId) {
        extraSelect.innerHTML = '<option value="">-- Select Extra Category --</option>';
        return;
      }
      try {
        const res = await fetch(`/extracategory/by-subcategory/${subId}`);
        const data = await res.json();
        extraSelect.innerHTML = '<option value="">-- Select Extra Category --</option>';
        data.extras.forEach(e => {
          extraSelect.innerHTML += `<option value="${e._id}">${e.name}</option>`;
        });
      } catch {
        extraSelect.innerHTML = '<option value="">-- Error loading --</option>';
      }
    });
  }

  const deleteForms = document.querySelectorAll('.delete-form');
  deleteForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.dataset.name || 'this item';
      if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
        form.submit();
      }
    });
  });

  const imageInputs = document.querySelectorAll('.image-input-preview');
  imageInputs.forEach(input => {
    input.addEventListener('change', function () {
      const previewId = this.dataset.preview;
      const preview = document.getElementById(previewId);
      if (preview && this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  });

  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

});
