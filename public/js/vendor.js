// Vendor View Module

const vendor = {
  myStore: null,

  // Load Vendor Dashboard overview statistics
  async loadDashboard() {
    try {
      // 1. Get vendor details to check status
      const { user, store } = await API.get('/auth/me');
      app.user.status = user.status;
      localStorage.setItem('user', JSON.stringify(app.user));

      const warningBanner = document.getElementById('vendor-approval-warning');
      if (user.status === 'pending_approval') {
        warningBanner.style.display = 'flex';
      } else {
        warningBanner.style.display = 'none';
      }

      // 2. Set Store Info
      this.myStore = store;
      if (store) {
        localStorage.setItem('store', JSON.stringify(store));
        app.store = store;
        document.getElementById('vendor-store-badge').innerText = store.name;
      }

      // 3. Fetch inventory count
      let productsCount = 0;
      if (store) {
        const products = await API.get(`/products?storeId=${store.id}`);
        productsCount = products.length;
      }
      document.getElementById('vendor-stat-products').innerText = productsCount;

      // 4. Fetch orders to calculate revenue and count
      const items = await API.get('/orders/vendor');
      document.getElementById('vendor-stat-orders').innerText = new Set(items.map(i => i.order_id)).size;

      // Calculate revenue of items (excluding cancelled orders)
      const revenue = items
        .filter(item => item.order_status !== 'cancelled')
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      document.getElementById('vendor-stat-revenue').innerText = `$${revenue.toFixed(2)}`;

      // Render recent orders table (max 5)
      const tbody = document.getElementById('vendor-recent-orders-table');
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;" class="text-muted">No orders received yet.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      items.slice(0, 5).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>#${item.order_id}</td>
          <td>${item.product_name}</td>
          <td>${item.customer_name}</td>
          <td>${item.quantity}</td>
          <td>₹${(item.price * item.quantity).toFixed(2)}</td>
          <td><span class="status-badge status-${item.order_status}">${item.order_status}</span></td>
        `;
        tbody.appendChild(row);
      });

    } catch (error) {
      app.showToast('Failed to load dashboard statistics: ' + error.message, 'danger');
    }
  },

  // Load settings form details
  async loadStoreSettings() {
    try {
      const store = await API.get('/stores/my-store');
      this.myStore = store;

      document.getElementById('store-name').value = store.name;
      document.getElementById('store-description').value = store.description || '';
      document.getElementById('store-banner').value = store.banner_url || '';
    } catch (error) {
      app.showToast('Failed to load store settings: ' + error.message, 'danger');
    }
  },

  // Submit/save store details updates
  async saveStoreSettings(event) {
    event.preventDefault();
    const name = document.getElementById('store-name').value;
    const description = document.getElementById('store-description').value;
    const banner_url = document.getElementById('store-banner').value;

    try {
      const result = await API.put('/stores/my-store', { name, description, banner_url });

      this.myStore = result.store;
      localStorage.setItem('store', JSON.stringify(result.store));
      app.store = result.store;

      app.showToast(result.message, 'success');
      document.getElementById('vendor-store-badge').innerText = result.store.name;
    } catch (error) {
      app.showToast(error.message, 'danger');
    }
  },

  // Load Inventory Products list
  async loadInventory() {
    const tbody = document.getElementById('vendor-products-table');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><div class="spinner" style="margin:2rem auto;"></div></td></tr>';

    try {
      if (!this.myStore) {
        const store = await API.get('/stores/my-store');
        this.myStore = store;
      }

      const products = await API.get(`/products?storeId=${this.myStore.id}`);

      if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;" class="text-muted">No products in your catalog. Click "Add New Product" to start!</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            ${product.image_url ?
            `<img src="${product.image_url}" class="table-product-thumb" alt="${product.name}" onerror="this.outerHTML=customer.getCategorySVG('${product.category}')">` :
            customer.getCategorySVG(product.category)
          }
          </td>
          <td style="font-weight:700;">${product.name}</td>
          <td><span class="role-tag">${product.category}</span></td>
          <td class="product-price">₹${product.price.toFixed(2)}</td>
          <td><strong>${product.stock}</strong> units</td>
          <td>
            <div style="display:flex;gap:0.5rem;">
              <button class="btn btn-secondary btn-xs" onclick="vendor.openEditProductModal(${JSON.stringify(product).replace(/"/g, '&quot;')})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
              <button class="btn btn-danger btn-xs" onclick="vendor.deleteProduct(${product.id})"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger);">${error.message}</td></tr>`;
    }
  },

  openAddProductModal() {
    // Reset Form
    document.getElementById('product-crud-form').reset();
    document.getElementById('crud-product-id').value = '';

    // Set text
    document.getElementById('product-modal-title').innerText = 'Add New Product';
    document.getElementById('product-form-submit-btn').innerText = 'Add Product';

    app.openModal('product-form-modal');
  },

  openEditProductModal(product) {
    document.getElementById('crud-product-id').value = product.id;
    document.getElementById('crud-product-name').value = product.name;
    document.getElementById('crud-product-category').value = product.category;
    document.getElementById('crud-product-price').value = product.price;
    document.getElementById('crud-product-stock').value = product.stock;
    document.getElementById('crud-product-description').value = product.description || '';
    document.getElementById('crud-product-image').value = product.image_url || '';

    // Set text
    document.getElementById('product-modal-title').innerText = 'Edit Product';
    document.getElementById('product-form-submit-btn').innerText = 'Save Changes';

    app.openModal('product-form-modal');
  },

  // Submit product creation/modifications
  async handleProductSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('crud-product-id').value;
    const name = document.getElementById('crud-product-name').value;
    const category = document.getElementById('crud-product-category').value;
    const price = parseFloat(document.getElementById('crud-product-price').value);
    const stock = parseInt(document.getElementById('crud-product-stock').value);
    const description = document.getElementById('crud-product-description').value;
    const image_url = document.getElementById('crud-product-image').value;

    const data = { name, category, price, stock, description, image_url };

    try {
      let result;
      if (id) {
        // Edit mode
        result = await API.put(`/products/${id}`, data);
      } else {
        // Add mode
        result = await API.post('/products', data);
      }

      app.showToast(result.message, 'success');
      app.closeModal('product-form-modal');

      // Refresh inventory list
      this.loadInventory();
    } catch (error) {
      app.showToast(error.message, 'danger');
    }
  },

  // Delete product
  async deleteProduct(productId) {
    if (!confirm('Are you sure you want to permanently delete this product from your inventory?')) {
      return;
    }

    try {
      const result = await API.delete(`/products/${productId}`);
      app.showToast(result.message, 'success');
      this.loadInventory();
    } catch (error) {
      app.showToast(error.message, 'danger');
    }
  },

  // Load Vendor incoming orders list
  async loadOrders() {
    const tbody = document.getElementById('vendor-all-orders-table');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;"><div class="spinner" style="margin:2rem auto;"></div></td></tr>';

    try {
      const items = await API.get('/orders/vendor');

      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;" class="text-muted">No orders received for your store products.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      items.forEach(item => {
        const dateStr = new Date(item.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${dateStr}</td>
          <td><strong>#${item.order_id}</strong></td>
          <td>
            <div>${item.customer_name}</div>
            <small class="text-muted">${item.customer_email}</small>
          </td>
          <td style="font-weight:600;">${item.product_name}</td>
          <td>${item.quantity}</td>
          <td><small>${item.shipping_address}</small></td>
          <td><span class="status-badge status-${item.order_status}">${item.order_status}</span></td>
          <td>
            <select class="form-control" style="width:130px;padding:0.25rem 0.5rem;font-size:0.8rem;" onchange="vendor.updateOrderStatus(${item.order_id}, this.value)">
              <option value="pending" ${item.order_status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="processing" ${item.order_status === 'processing' ? 'selected' : ''}>Processing</option>
              <option value="shipped" ${item.order_status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="delivered" ${item.order_status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="cancelled" ${item.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
        `;
        tbody.appendChild(row);
      });
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--danger);">${error.message}</td></tr>`;
    }
  },

  // Update overall order status
  async updateOrderStatus(orderId, status) {
    try {
      const result = await API.put(`/orders/${orderId}/status`, { status });
      app.showToast(result.message, 'success');
      this.loadOrders();
    } catch (error) {
      app.showToast(error.message, 'danger');
    }
  }
};
