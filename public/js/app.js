// Main App Controller

const app = {
  user: null,
  store: null, // For vendors
  cart: [],    // [{ product, quantity }]
  currentView: 'browse',

  init() {
    // Load local storage states
    this.user = JSON.parse(localStorage.getItem('user'));
    this.store = JSON.parse(localStorage.getItem('store'));
    this.cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Load theme
    const savedTheme = localStorage.getItem('theme') || 'dark-theme';
    document.body.className = savedTheme;

    // Initial UI setups
    this.updateAuthUI();
    this.updateCartBadge();
    
    // Default view routing
    const path = window.location.pathname.substring(1);
    if (path && ['browse', 'customer-orders', 'vendor-dashboard', 'vendor-store', 'vendor-inventory', 'vendor-orders', 'admin-dashboard', 'admin-vendors', 'admin-customers'].includes(path)) {
      this.navigateTo(path);
    } else {
      this.navigateTo('browse');
    }

    // Bind event listeners for modals, etc.
    this.bindGlobalEvents();
  },

  bindGlobalEvents() {
    // Close modals on Esc press
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-wrapper.active');
        if (openModal) {
          this.closeModal(openModal.id);
        }
        const cartDrawer = document.getElementById('cart-drawer');
        if (cartDrawer.classList.contains('active')) {
          this.toggleCartDrawer();
        }
      }
    });
  },

  // View routing
  navigateTo(viewId) {
    // Role protection checks
    if (viewId.startsWith('vendor-') && (!this.user || this.user.role !== 'vendor')) {
      this.showToast('Please login as a vendor to access that panel.', 'warning');
      viewId = 'browse';
    }
    if (viewId.startsWith('admin-') && (!this.user || this.user.role !== 'admin')) {
      this.showToast('Administrator privileges required.', 'danger');
      viewId = 'browse';
    }
    if (viewId === 'customer-orders' && (!this.user || this.user.role !== 'customer')) {
      this.showToast('Please login as a customer to view order history.', 'warning');
      viewId = 'browse';
    }

    // Update state
    this.currentView = viewId;

    // Toggle DOM views visibility
    document.querySelectorAll('.app-view').forEach(view => {
      view.style.display = 'none';
    });

    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
      targetView.style.display = 'block';
    }

    // Toggle search bar container depending on view
    const searchContainer = document.getElementById('global-search-container');
    if (viewId === 'browse') {
      searchContainer.style.display = 'block';
    } else {
      searchContainer.style.display = 'none';
    }

    // Update Navbar Link Highlights
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    // Find matching link
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      const onclickAttr = link.getAttribute('onclick');
      if (onclickAttr && onclickAttr.includes(viewId)) {
        link.classList.add('active');
      }
    });

    // Run view lifecycle loaders
    this.loadViewData(viewId);
    
    // Update HTML page title
    const formattedTitle = viewId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    document.title = `ApexMarket - ${formattedTitle}`;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  loadViewData(viewId) {
    switch (viewId) {
      case 'browse':
        customer.loadCatalog();
        break;
      case 'customer-orders':
        customer.loadOrders();
        break;
      case 'vendor-dashboard':
        vendor.loadDashboard();
        break;
      case 'vendor-store':
        vendor.loadStoreSettings();
        break;
      case 'vendor-inventory':
        vendor.loadInventory();
        break;
      case 'vendor-orders':
        vendor.loadOrders();
        break;
      case 'admin-dashboard':
        admin.loadDashboard();
        break;
      case 'admin-vendors':
        admin.loadVendors();
        break;
      case 'admin-customers':
        admin.loadCustomers();
        break;
    }
  },

  // Auth Forms Actions
  async handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.querySelector('input[name="register-role"]:checked').value;

    if (password.length < 6) {
      this.showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    try {
      const result = await API.post('/auth/register', { name, email, password, role });
      
      this.showToast(result.message, role === 'vendor' ? 'warning' : 'success');
      this.closeModal('register-modal');

      // Clear form inputs
      document.getElementById('register-form').reset();

      // Automatically log them in, or prompt login
      if (role === 'customer') {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        this.user = result.user;
        this.updateAuthUI();
        this.navigateTo('browse');
      } else {
        // Vendor pending approval, prompt to wait
        this.showToast('Please wait for an Administrator to approve your store.', 'info');
        // Let's open login modal so they can see login process
        this.openModal('login-modal');
      }
    } catch (error) {
      this.showToast(error.message, 'danger');
    }
  },

  async handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const result = await API.post('/auth/login', { email, password });
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      this.user = result.user;

      if (result.store) {
        localStorage.setItem('store', JSON.stringify(result.store));
        this.store = result.store;
      } else {
        localStorage.removeItem('store');
        this.store = null;
      }

      this.showToast(result.message, 'success');
      this.closeModal('login-modal');

      // Reset Form
      document.getElementById('login-form').reset();
      
      this.updateAuthUI();

      // Route based on role
      if (this.user.role === 'admin') {
        this.navigateTo('admin-dashboard');
      } else if (this.user.role === 'vendor') {
        this.navigateTo('vendor-dashboard');
      } else {
        this.navigateTo('browse');
      }
    } catch (error) {
      this.showToast(error.message, 'danger');
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('store');
    
    this.user = null;
    this.store = null;
    this.cart = [];
    localStorage.removeItem('cart');

    this.showToast('Logged out successfully.', 'success');
    this.updateAuthUI();
    this.updateCartBadge();
    this.navigateTo('browse');
  },

  updateAuthUI() {
    const guestArea = document.getElementById('auth-guest-area');
    const userArea = document.getElementById('auth-user-area');
    const navCustomer = document.getElementById('nav-customer');
    const navCustomerOrders = document.getElementById('nav-customer-orders');
    const navVendor = document.getElementById('nav-vendor');
    const navAdmin = document.getElementById('nav-admin');
    const cartToggleBtn = document.getElementById('cart-toggle-btn');

    if (this.user) {
      guestArea.style.display = 'none';
      userArea.style.display = 'flex';
      
      document.getElementById('username-display').innerText = this.user.name;
      const roleDisplay = document.getElementById('user-role-tag');
      roleDisplay.innerText = this.user.role;
      roleDisplay.className = `role-tag role-${this.user.role}`;

      if (this.user.role === 'admin') {
        navCustomer.style.display = 'none';
        navVendor.style.display = 'none';
        navAdmin.style.display = 'flex';
        cartToggleBtn.style.display = 'none';
      } else if (this.user.role === 'vendor') {
        navCustomer.style.display = 'none';
        navVendor.style.display = 'flex';
        navAdmin.style.display = 'none';
        cartToggleBtn.style.display = 'none';
      } else {
        // Customer
        navCustomer.style.display = 'flex';
        navCustomerOrders.style.display = 'inline-block';
        navVendor.style.display = 'none';
        navAdmin.style.display = 'none';
        cartToggleBtn.style.display = 'flex';
      }
    } else {
      // Guest
      guestArea.style.display = 'flex';
      userArea.style.display = 'none';
      
      navCustomer.style.display = 'flex';
      navCustomerOrders.style.display = 'none';
      navVendor.style.display = 'none';
      navAdmin.style.display = 'none';
      cartToggleBtn.style.display = 'flex';
    }
  },

  // Shopping Cart state management
  addToCart(product, quantity = 1) {
    if (this.user && this.user.role !== 'customer') {
      this.showToast('Only customer accounts can purchase products.', 'warning');
      return;
    }

    const cartItem = this.cart.find(item => item.product.id === product.id);
    
    if (cartItem) {
      const newQty = cartItem.quantity + quantity;
      if (newQty > product.stock) {
        this.showToast(`Only ${product.stock} units available in stock.`, 'warning');
        return;
      }
      cartItem.quantity = newQty;
    } else {
      if (quantity > product.stock) {
        this.showToast(`Only ${product.stock} units available in stock.`, 'warning');
        return;
      }
      this.cart.push({ product, quantity });
    }

    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.updateCartBadge();
    this.showToast(`Added "${product.name}" to cart.`, 'success');
  },

  updateCartBadge() {
    const badge = document.getElementById('cart-badge-count');
    const totalCount = this.cart.reduce((total, item) => total + item.quantity, 0);
    badge.innerText = totalCount;
    
    // Add micro-animation bounce
    badge.style.transform = 'scale(1.3)';
    setTimeout(() => {
      badge.style.transform = 'scale(1)';
    }, 200);
  },

  toggleCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    drawer.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (drawer.classList.contains('active')) {
      customer.renderCartItems();
    }
  },

  // Modals Controller
  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  },

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  },

  switchModal(closeId, openId) {
    this.closeModal(closeId);
    setTimeout(() => {
      this.openModal(openId);
    }, 150);
  },

  // Theme Controller
  toggleTheme() {
    const current = document.body.className;
    const target = current === 'dark-theme' ? 'light-theme' : 'dark-theme';
    document.body.className = target;
    localStorage.setItem('theme', target);
    this.showToast(`Switched to ${target === 'dark-theme' ? 'Dark' : 'Light'} theme`, 'info');
  },

  // Notification Toast Controller
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'danger') iconClass = 'fa-circle-exclamation';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Fade out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        container.removeChild(toast);
      }, 300);
    }, 4000);
  }
};

// Start application when DOM binds
window.addEventListener('DOMContentLoaded', () => {
  app.init();
});
