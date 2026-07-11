// Customer View Module
const customer = {
  currentCategory: '',
  searchQuery: '',
  searchTimeout: null,

  // Smooth scroll to catalog
  scrollToProducts() {
    const catalog = document.getElementById('catalog-anchor');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  },

  // Category Filtering
  filterByCategory(category) {
    this.currentCategory = category;

    // Update active chip styling
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(chip => {
      chip.classList.remove('active');
      const onclickAttr = chip.getAttribute('onclick');
      if (onclickAttr && onclickAttr.includes(`'${category}'`)) {
        chip.classList.add('active');
      }
    });

    const subtitle = document.getElementById('catalog-subtitle');
    subtitle.innerText = category ? `Showing products in ${category}` : 'Showing all available products';

    this.loadCatalog();
  },

  // Search input change
  handleSearch(event) {
    clearTimeout(this.searchTimeout);
    this.searchQuery = event.target.value;

    // Throttle search requests
    this.searchTimeout = setTimeout(() => {
      this.loadCatalog();
    }, 400);
  },

  // Load product catalog from API
  async loadCatalog() {
    const grid = document.getElementById('products-catalog-grid');
    grid.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';

    try {
      let endpoint = '/products?';
      if (this.currentCategory) endpoint += `category=${encodeURIComponent(this.currentCategory)}&`;
      if (this.searchQuery) endpoint += `search=${encodeURIComponent(this.searchQuery)}`;

      const products = await API.get(endpoint);

      if (products.length === 0) {
        grid.innerHTML = `
          <div class="empty-cart-message" style="grid-column: 1/-1;">
            <i class="fa-solid fa-folder-open"></i>
            <h3>No Products Found</h3>
            <p>We couldn't find any products matching your selection. Please try searching something else.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = '';
      products.forEach(product => {
        const hasStock = product.stock > 0;
        const stockClass = product.stock === 0 ? 'stock-out' : (product.stock < 5 ? 'stock-low' : 'stock-instock');
        const stockText = product.stock === 0 ? 'Out of Stock' : (product.stock < 5 ? `Low Stock (${product.stock})` : 'In Stock');

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <div class="product-image-wrapper">
            <span class="product-card-category">${product.category}</span>
            ${product.image_url ?
            `<img src="${product.image_url}" class="product-img" alt="${product.name}" onerror="this.outerHTML=customer.getCategorySVG('${product.category}')">` :
            this.getCategorySVG(product.category)
          }
          </div>
          <div class="product-card-body">
            <div class="product-card-store"><i class="fa-solid fa-shop"></i> ${product.store_name}</div>
            <h3 class="product-card-title" onclick="customer.openProductDetails(${product.id})">${product.name}</h3>
            
            <div class="rating-stars-container">
              <div class="stars">
                ${this.renderStarsHTML(product.avgRating)}
              </div>
              <span class="rating-count">(${product.countReviews})</span>
            </div>

            <div class="product-card-footer">
              <span class="product-price">₹${product.price.toFixed(2)}</span>
              <span class="stock-tag ${stockClass}">${stockText}</span>
            </div>
            
            <button class="btn btn-primary btn-sm mt-4" ${!hasStock ? 'disabled' : ''} onclick="app.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
              <i class="fa-solid fa-cart-plus"></i> ${hasStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        `;
        grid.appendChild(card);
      });
    } catch (error) {
      grid.innerHTML = `<div class="empty-cart-message" style="grid-column: 1/-1;"><i class="fa-solid fa-triangle-exclamation"></i><h3>Failed to load products</h3><p>${error.message}</p></div>`;
    }
  },

  renderStarsHTML(rating) {
    let stars = '';
    const rounded = Math.round(rating * 2) / 2; // nearest 0.5
    for (let i = 1; i <= 5; i++) {
      if (i <= rounded) {
        stars += '<i class="fa-solid fa-star"></i>';
      } else if (i - 0.5 === rounded) {
        stars += '<i class="fa-solid fa-star-half-stroke"></i>';
      } else {
        stars += '<i class="fa-regular fa-star"></i>';
      }
    }
    return stars;
  },

  // Category SVGs to ensure premium look with no broken images
  getCategorySVG(category) {
    const cleanCategory = category ? category.toLowerCase() : '';
    let icon = '<rect width="100%" height="100%" fill="url(#box-gradient)"/><path d="M50 30L80 45L50 60L20 45L50 30Z" stroke="#66fcf1" stroke-width="2" fill="none"/>'; // default box
    let strokeColor = '#66fcf1';
    let gradient = '<linearGradient id="box-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1f2833"/><stop offset="100%" stop-color="#0b0c10"/></linearGradient>';

    if (cleanCategory.includes('electronics')) {
      strokeColor = '#00e5ff';
      icon = `
        <rect width="100%" height="100%" fill="url(#elec-gradient)"/>
        <!-- Laptop Outline -->
        <rect x="25" y="25" width="50" height="32" rx="3" stroke="${strokeColor}" stroke-width="2" fill="none"/>
        <line x1="20" y1="60" x2="80" y2="60" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round"/>
        <line x1="45" y1="60" x2="55" y2="60" stroke="#fff" stroke-width="2"/>
        <circle cx="50" cy="30" r="1" fill="${strokeColor}"/>
      `;
      gradient = `<linearGradient id="elec-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#001824"/><stop offset="100%" stop-color="#0b0c10"/></linearGradient>`;
    } else if (cleanCategory.includes('fashion')) {
      strokeColor = '#ff4081';
      icon = `
        <rect width="100%" height="100%" fill="url(#fashion-gradient)"/>
        <!-- Hanger and Shirt -->
        <path d="M50 25 C53 25, 55 28, 52 32 L50 34" stroke="${strokeColor}" stroke-width="2" fill="none"/>
        <path d="M25 42 L38 34 L62 34 L75 42 L68 58 L32 58 Z" stroke="${strokeColor}" stroke-width="2" fill="none"/>
        <line x1="38" y1="34" x2="50" y2="40" stroke="${strokeColor}" stroke-width="2"/>
        <line x1="62" y1="34" x2="50" y2="40" stroke="${strokeColor}" stroke-width="2"/>
      `;
      gradient = `<linearGradient id="fashion-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#240012"/><stop offset="100%" stop-color="#0b0c10"/></linearGradient>`;
    } else if (cleanCategory.includes('home')) {
      strokeColor = '#ffea00';
      icon = `
        <rect width="100%" height="100%" fill="url(#home-gradient)"/>
        <!-- Couch / Lamp -->
        <path d="M30 45 L70 45" stroke="${strokeColor}" stroke-width="2" fill="none"/>
        <path d="M25 40 L25 55 M75 40 L75 55" stroke="${strokeColor}" stroke-width="2"/>
        <path d="M30 35 L70 35 L70 45 L30 45 Z" stroke="${strokeColor}" stroke-width="2" fill="none"/>
        <rect x="35" y="42" width="30" height="10" stroke="${strokeColor}" stroke-width="2" fill="none"/>
      `;
      gradient = `<linearGradient id="home-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#242100"/><stop offset="100%" stop-color="#0b0c10"/></linearGradient>`;
    } else if (cleanCategory.includes('fitness') || cleanCategory.includes('outdoor')) {
      strokeColor = '#00e676';
      icon = `
        <rect width="100%" height="100%" fill="url(#fit-gradient)"/>
        <!-- Dumbbell -->
        <rect x="25" y="42" width="8" height="16" rx="2" stroke="${strokeColor}" stroke-width="2" fill="none"/>
        <rect x="67" y="42" width="8" height="16" rx="2" stroke="${strokeColor}" stroke-width="2" fill="none"/>
        <line x1="33" y1="50" x2="67" y2="50" stroke="${strokeColor}" stroke-width="4"/>
        <circle cx="50" cy="50" r="4" fill="${strokeColor}"/>
      `;
      gradient = `<linearGradient id="fit-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00240d"/><stop offset="100%" stop-color="#0b0c10"/></linearGradient>`;
    } else if (cleanCategory.includes('beauty') || cleanCategory.includes('personal')) {
      strokeColor = '#e040fb';
      icon = `
        <rect width="100%" height="100%" fill="url(#beauty-gradient)"/>
        <!-- Sparkles / Perfume -->
        <rect x="40" y="38" width="20" height="24" rx="3" stroke="${strokeColor}" stroke-width="2" fill="none"/>
        <path d="M47 38 L47 30 L53 30 L53 38" stroke="${strokeColor}" stroke-width="2" fill="none"/>
        <circle cx="50" cy="27" r="2" fill="${strokeColor}"/>
        <path d="M28 25 L32 29 M32 25 L28 29" stroke="${strokeColor}" stroke-width="1.5"/>
        <path d="M72 25 L68 29 M68 25 L72 29" stroke="${strokeColor}" stroke-width="1.5"/>
      `;
      gradient = `<linearGradient id="beauty-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1b0024"/><stop offset="100%" stop-color="#0b0c10"/></linearGradient>`;
    }

    return `<svg class="product-placeholder-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">${gradient}${icon}</svg>`;
  },

  // Open large product details & reviews view modal
  async openProductDetails(productId) {
    app.openModal('product-detail-modal');
    const content = document.getElementById('product-detail-content');
    content.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';

    try {
      const { product, reviews } = await API.get(`/products/${productId}`);

      const hasStock = product.stock > 0;
      const stockClass = product.stock === 0 ? 'stock-out' : (product.stock < 5 ? 'stock-low' : 'stock-instock');
      const stockText = product.stock === 0 ? 'Out of Stock' : (product.stock < 5 ? `Low Stock (${product.stock})` : 'In Stock');

      let reviewsListHTML = '';
      if (reviews.length === 0) {
        reviewsListHTML = '<p class="text-muted" style="margin: 1rem 0;">No reviews yet. Be the first to review after purchasing!</p>';
      } else {
        reviews.forEach(review => {
          reviewsListHTML += `
            <div class="review-item">
              <div class="review-item-header">
                <span class="review-item-author">${review.customer_name}</span>
                <span class="stars">${this.renderStarsHTML(review.rating)}</span>
              </div>
              <p class="review-item-comment">${review.comment || '<i>No written comment</i>'}</p>
            </div>
          `;
        });
      }

      // Check if user is logged in customer to render review form
      let reviewFormHTML = '';
      if (app.user && app.user.role === 'customer') {
        reviewFormHTML = `
          <div class="review-form-card">
            <h4>Write a Review</h4>
            <p class="input-tip mb-4">You can write a review if you have purchased this item.</p>
            <form onsubmit="customer.submitReview(event, ${product.id})">
              <div class="form-group">
                <label>Rating</label>
                <div class="review-form-stars" id="new-review-rating">
                  <i class="fa-solid fa-star active" data-value="5" onclick="customer.setReviewRating(5)"></i>
                  <i class="fa-solid fa-star active" data-value="4" onclick="customer.setReviewRating(4)"></i>
                  <i class="fa-solid fa-star active" data-value="3" onclick="customer.setReviewRating(3)"></i>
                  <i class="fa-solid fa-star active" data-value="2" onclick="customer.setReviewRating(2)"></i>
                  <i class="fa-solid fa-star active" data-value="1" onclick="customer.setReviewRating(1)"></i>
                </div>
                <input type="hidden" id="review-rating-value" value="5">
              </div>
              <div class="form-group">
                <label for="review-comment">Comment</label>
                <textarea id="review-comment" class="form-control" rows="2" placeholder="Tell us about the product quality, shipping experience..."></textarea>
              </div>
              <button type="submit" class="btn btn-secondary btn-sm"><i class="fa-solid fa-paper-plane"></i> Submit Review</button>
            </form>
          </div>
        `;
      } else if (!app.user) {
        reviewFormHTML = '<p class="text-muted"><a href="#" onclick="app.switchModal(\'product-detail-modal\', \'login-modal\')">Log in</a> to write a review.</p>';
      }

      content.innerHTML = `
        <div class="product-modal-gallery">
          ${product.image_url ?
          `<img src="${product.image_url}" class="product-modal-img" alt="${product.name}" onerror="this.outerHTML=customer.getCategorySVG('${product.category}')">` :
          this.getCategorySVG(product.category)
        }
        </div>
        <div class="product-modal-info">
          <div class="product-detail-store"><i class="fa-solid fa-shop"></i> ${product.store_name}</div>
          <h2 class="product-detail-title">${product.name}</h2>
          
          <div class="rating-stars-container">
            <div class="stars">
              ${this.renderStarsHTML(product.avgRating)}
            </div>
            <strong class="rating-value">${product.avgRating}</strong>
            <span class="rating-count">(${product.countReviews} reviews)</span>
          </div>

          <p class="product-detail-desc">${product.description || 'No detailed description available.'}</p>
          
          <div class="product-detail-price-row">
            <span class="product-detail-price">₹${product.price.toFixed(2)}</span>
            <span class="stock-tag ${stockClass}">${stockText}</span>
          </div>

          <button class="btn btn-primary" ${!hasStock ? 'disabled' : ''} onclick="app.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
            <i class="fa-solid fa-cart-plus"></i> ${hasStock ? 'Add to Cart' : 'Out of Stock'}
          </button>

          <div class="reviews-section">
            <div class="reviews-header-row">
              <h3>Customer Reviews</h3>
            </div>
            <div class="reviews-list">
              ${reviewsListHTML}
            </div>
            ${reviewFormHTML}
          </div>
        </div>
      `;
    } catch (error) {
      content.innerHTML = `<div class="empty-cart-message"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error loading details</h3><p>${error.message}</p></div>`;
    }
  },

  // Star selector logic
  setReviewRating(rating) {
    document.getElementById('review-rating-value').value = rating;
    const stars = document.querySelectorAll('#new-review-rating i');
    stars.forEach(star => {
      const val = parseInt(star.getAttribute('data-value'));
      if (val <= rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  },

  // Submit review comment
  async submitReview(event, productId) {
    event.preventDefault();
    const rating = document.getElementById('review-rating-value').value;
    const comment = document.getElementById('review-comment').value;

    try {
      const response = await API.post('/reviews', {
        product_id: productId,
        rating,
        comment
      });

      app.showToast(response.message, 'success');
      // Refresh details modal
      this.openProductDetails(productId);

      // Refresh catalog to update averages
      this.loadCatalog();
    } catch (error) {
      app.showToast(error.message, 'danger');
    }
  },

  // Render items inside cart drawer
  renderCartItems() {
    const container = document.getElementById('cart-drawer-items');
    const footer = document.getElementById('cart-drawer-footer');

    if (app.cart.length === 0) {
      container.innerHTML = `
        <div class="empty-cart-message">
          <i class="fa-solid fa-cart-shopping"></i>
          <h3>Your cart is empty</h3>
          <p>Browse products and add items to your cart to checkout.</p>
        </div>
      `;
      footer.style.display = 'none';
      return;
    }

    footer.style.display = 'block';
    container.innerHTML = '';

    let subtotal = 0;

    app.cart.forEach((item, index) => {
      subtotal += item.product.price * item.quantity;
      const cartItemDiv = document.createElement('div');
      cartItemDiv.className = 'cart-item';
      cartItemDiv.innerHTML = `
        ${item.product.image_url ?
          `<img src="${item.product.image_url}" class="cart-item-img" alt="${item.product.name}" onerror="this.outerHTML=customer.getCategorySVG('${item.product.category}')">` :
          this.getCategorySVG(item.product.category)
        }
        <div class="cart-item-details">
          <h4 class="cart-item-name">${item.product.name}</h4>
          <div class="cart-item-store">${item.product.store_name}</div>
          <div class="cart-item-price">₹${item.product.price.toFixed(2)}</div>
        </div>
        <div class="cart-qty-control">
          <button class="cart-qty-btn" onclick="customer.updateCartQty(${index}, -1)">-</button>
          <span class="cart-qty-value">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="customer.updateCartQty(${index}, 1)">+</button>
        </div>
        <button class="cart-item-remove" onclick="customer.removeCartItem(${index})"><i class="fa-solid fa-trash-can"></i></button>
      `;
      container.appendChild(cartItemDiv);
    });

    document.getElementById('cart-subtotal').innerText = `$${subtotal.toFixed(2)}`;
  },

  updateCartQty(index, delta) {
    const item = app.cart[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      this.removeCartItem(index);
      return;
    }

    if (newQty > item.product.stock) {
      app.showToast(`Only ${item.product.stock} units available in stock.`, 'warning');
      return;
    }

    item.quantity = newQty;
    localStorage.setItem('cart', JSON.stringify(app.cart));
    app.updateCartBadge();
    this.renderCartItems();
  },

  removeCartItem(index) {
    app.cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(app.cart));
    app.updateCartBadge();
    this.renderCartItems();
    app.showToast('Item removed from cart.', 'info');
  },

  // Open Checkout form Modal
  openCheckoutModal() {
    if (app.cart.length === 0) {
      app.showToast('Your shopping cart is empty.', 'warning');
      return;
    }

    if (!app.user) {
      app.showToast('Please login as a customer to checkout.', 'warning');
      app.toggleCartDrawer();
      app.openModal('login-modal');
      return;
    }

    if (app.user.role !== 'customer') {
      app.showToast('Only customer accounts can purchase products.', 'warning');
      return;
    }

    app.toggleCartDrawer();
    app.openModal('checkout-modal');

    // Build checkout preview
    const previewContainer = document.getElementById('checkout-items-preview');
    previewContainer.innerHTML = '';

    let total = 0;
    app.cart.forEach(item => {
      total += item.product.price * item.quantity;
      const row = document.createElement('div');
      row.className = 'checkout-preview-item';
      row.innerHTML = `
        <span>${item.product.name} x ${item.quantity}</span>
        <strong>₹${(item.product.price * item.quantity).toFixed(2)}</strong>
      `;
      previewContainer.appendChild(row);
    });

    document.getElementById('checkout-total-price').innerText = `₹${total.toFixed(2)}`;
  },

  // Finalize order checkout
  async processCheckout(event) {
    event.preventDefault();
    const address = document.getElementById('checkout-address').value;
    const payment = document.querySelector('input[name="payment-method"]:checked').value;

    const items = app.cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    try {
      const response = await API.post('/orders', {
        shipping_address: address,
        payment_method: payment,
        items
      });

      app.showToast(response.message, 'success');
      app.closeModal('checkout-modal');

      // Clear cart
      app.cart = [];
      localStorage.removeItem('cart');
      app.updateCartBadge();

      // Reset Form
      document.getElementById('checkout-form').reset();

      // Go to Customer Orders View
      app.navigateTo('customer-orders');
    } catch (error) {
      app.showToast(error.message, 'danger');
    }
  },

  // Load past orders list
  async loadOrders() {
    const container = document.getElementById('customer-orders-container');
    container.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';

    try {
      const orders = await API.get('/orders/customer');

      if (orders.length === 0) {
        container.innerHTML = `
          <div class="empty-cart-message">
            <i class="fa-solid fa-box-open"></i>
            <h3>No Orders Placed</h3>
            <p>You haven't bought anything yet. Browse our catalog to place your first order!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      orders.forEach(order => {
        const dateStr = new Date(order.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const card = document.createElement('div');
        card.className = 'order-card';

        let itemsHTML = '';
        order.items.forEach(item => {
          itemsHTML += `
            <div class="order-item-row">
              ${item.image_url ?
              `<img src="${item.image_url}" class="table-product-thumb" alt="${item.product_name}" onerror="this.outerHTML=customer.getCategorySVG('')">` :
              this.getCategorySVG('')
            }
              <div class="order-item-info">
                <div class="order-item-title">${item.product_name || '<i>Product Unavailable</i>'}</div>
                <div class="order-item-store-name"><i class="fa-solid fa-shop"></i> ${item.store_name || 'Store'}</div>
              </div>
              <div style="text-align: right;">
                <div>Qty: <strong>${item.quantity}</strong></div>
                <div class="product-price">₹${item.price.toFixed(2)}</div>
                ${item.product_id ? `<button class="btn btn-secondary btn-xs mt-4" onclick="customer.openProductDetails(${item.product_id})"><i class="fa-solid fa-star"></i> Review Product</button>` : ''}
              </div>
            </div>
          `;
        });

        card.innerHTML = `
          <div class="order-header-row">
            <div class="order-meta-info">
              <span>Order placed: <strong>${dateStr}</strong></span>
              <span>Total Spent: <strong>₹${order.total_price.toFixed(2)}</strong></span>
              <span>Payment: <strong>${order.payment_method}</strong></span>
            </div>
            <span class="status-badge status-${order.status}">${order.status}</span>
          </div>
          <div class="order-items-list">
            ${itemsHTML}
          </div>
          <div class="mt-4" style="font-size: 0.85rem; color: var(--text-muted);">
            <i class="fa-solid fa-truck"></i> Ship To: <strong>${order.shipping_address}</strong>
          </div>
        `;
        container.appendChild(card);
      });
    } catch (error) {
      container.innerHTML = `<div class="empty-cart-message"><i class="fa-solid fa-triangle-exclamation"></i><h3>Failed to load orders</h3><p>${error.message}</p></div>`;
    }
  }
};
