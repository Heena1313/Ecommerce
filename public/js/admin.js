// Admin View Module

const admin = {
  // Load dashboard counters and approvals queue
  async loadDashboard() {
    try {
      const vendors = await API.get('/admin/vendors');
      const customers = await API.get('/admin/customers');

      // 1. Calculate counters
      document.getElementById('admin-stat-customers').innerText = customers.length;
      document.getElementById('admin-stat-vendors').innerText = vendors.length;

      const pendingVendors = vendors.filter(v => v.status === 'pending_approval');
      document.getElementById('admin-stat-pending').innerText = pendingVendors.length;

      // 2. Render approvals queue cards
      const container = document.getElementById('admin-approvals-queue');
      if (pendingVendors.length === 0) {
        container.innerHTML = `
          <div class="empty-cart-message" style="width:100%;grid-column: 1/-1;margin-top:1rem;">
            <i class="fa-solid fa-circle-check" style="color:var(--success);"></i>
            <h3>Approvals Queue Clear</h3>
            <p>All registered vendors are currently processed. No new registrations awaiting action.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      pendingVendors.forEach(vendor => {
        const dateStr = new Date(vendor.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'approval-card';
        card.innerHTML = `
          <div class="approval-card-title">${vendor.name}</div>
          <div class="approval-card-meta">
            <div>Email: <strong>${vendor.email}</strong></div>
            <div>Store Name: <strong>${vendor.store_name || 'Not Configured'}</strong></div>
            <div>Registered: <strong>${dateStr}</strong></div>
          </div>
          <div class="approval-card-actions">
            <button class="btn btn-primary btn-xs" onclick="admin.updateVendorStatus(${vendor.id}, 'active')"><i class="fa-solid fa-check"></i> Approve</button>
            <button class="btn btn-danger btn-xs" onclick="admin.updateVendorStatus(${vendor.id}, 'suspended')"><i class="fa-solid fa-ban"></i> Suspend</button>
          </div>
        `;
        container.appendChild(card);
      });

    } catch (error) {
      app.showToast('Failed to load admin stats: ' + error.message, 'danger');
    }
  },

  // Load all vendors grid list
  async loadVendors() {
    const tbody = document.getElementById('admin-vendors-table');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;"><div class="spinner" style="margin:2rem auto;"></div></td></tr>';

    try {
      const vendors = await API.get('/admin/vendors');

      if (vendors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;" class="text-muted">No vendors registered.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      vendors.forEach(vendor => {
        let actionBtn = '';
        if (vendor.status === 'pending_approval') {
          actionBtn = `
            <button class="btn btn-primary btn-xs" onclick="admin.updateVendorStatus(${vendor.id}, 'active')"><i class="fa-solid fa-check"></i> Approve</button>
            <button class="btn btn-danger btn-xs" onclick="admin.updateVendorStatus(${vendor.id}, 'suspended')"><i class="fa-solid fa-ban"></i> Suspend</button>
          `;
        } else if (vendor.status === 'active') {
          actionBtn = `<button class="btn btn-danger btn-xs" onclick="admin.updateVendorStatus(${vendor.id}, 'suspended')"><i class="fa-solid fa-ban"></i> Suspend</button>`;
        } else if (vendor.status === 'suspended') {
          actionBtn = `<button class="btn btn-primary btn-xs" onclick="admin.updateVendorStatus(${vendor.id}, 'active')"><i class="fa-solid fa-check"></i> Activate</button>`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>#${vendor.id}</td>
          <td style="font-weight:700;">${vendor.name}</td>
          <td>${vendor.email}</td>
          <td style="font-weight:600;"><i class="fa-solid fa-shop" style="color:var(--accent-primary);margin-right:0.25rem;"></i> ${vendor.store_name || '<i>N/A</i>'}</td>
          <td><strong>${vendor.product_count}</strong> products</td>
          <td><span class="status-badge status-${vendor.status}">${vendor.status.replace('_', ' ')}</span></td>
          <td>
            <div style="display:flex;gap:0.5rem;">
              ${actionBtn}
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--danger);">${error.message}</td></tr>`;
    }
  },

  // Load customers list
  async loadCustomers() {
    const tbody = document.getElementById('admin-customers-table');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><div class="spinner" style="margin:2rem auto;"></div></td></tr>';

    try {
      const customers = await API.get('/admin/customers');

      if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;" class="text-muted">No customers registered.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      customers.forEach(customer => {
        const dateStr = new Date(customer.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>#${customer.id}</td>
          <td style="font-weight:700;">${customer.name}</td>
          <td>${customer.email}</td>
          <td>${dateStr}</td>
          <td><strong>${customer.order_count}</strong> orders</td>
          <td class="product-price">₹${customer.total_spent.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
      });
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger);">${error.message}</td></tr>`;
    }
  },

  // Toggle/Set vendor statuses
  async updateVendorStatus(vendorId, status) {
    try {
      const result = await API.put(`/admin/vendors/${vendorId}/status`, { status });
      app.showToast(result.message, 'success');

      // Reload current view
      if (app.currentView === 'admin-dashboard') {
        this.loadDashboard();
      } else if (app.currentView === 'admin-vendors') {
        this.loadVendors();
      }
    } catch (error) {
      app.showToast(error.message, 'danger');
    }
  }
};
