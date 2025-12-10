/**
 * Product.js - Quản lý danh sách sản phẩm từ API Backend
 */

// URL API Backend (thay đổi theo cấu hình của bạn)
const API_BASE_URL = 'http://localhost:3000/api'; // hoặc URL thật của bạn
const PRODUCTS_API = `${API_BASE_URL}/products`;

// Biến toàn cục
let allProducts = [];
let currentSort = 'default';
let currentFilters = {
    type: [],
    maxPrice: 1000000
};

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    console.log('product.js loaded - Kết nối đến Backend API');
    
    // Load sản phẩm từ API
    loadProductsFromAPI();
    
    // Thiết lập sự kiện
    setupEventListeners();
});

/**
 * Load sản phẩm từ API Backend
 */
function loadProductsFromAPI() {
    showLoadingState();
    
    fetch(PRODUCTS_API)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Lỗi API: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            console.log('Đã load sản phẩm từ API:', products.length, 'sản phẩm');
            allProducts = products;
            renderProducts(products);
            updateResultCount(products.length);
        })
        .catch(error => {
            console.error('Lỗi khi load sản phẩm:', error);
            showErrorState(error.message);
        });
}

/**
 * Hiển thị trạng thái loading
 */
function showLoadingState() {
    const container = document.getElementById('product-list-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Đang tải sản phẩm từ máy chủ...</p>
            </div>
        `;
    }
}

/**
 * Hiển thị lỗi
 */
function showErrorState(errorMessage) {
    const container = document.getElementById('product-list-container');
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <p style="color: #d32f2f;">⚠️ Không thể tải sản phẩm</p>
                <p style="font-size: 0.9em; color: #666;">${errorMessage}</p>
                <button onclick="loadProductsFromAPI()" class="btn-secondary">
                    Thử lại
                </button>
            </div>
        `;
    }
}

function addToCartNow(productId) {
    const product = allProducts.find(p => p.product_id == productId);
    
    if (!product) {
        alert('Không tìm thấy sản phẩm');
        return;
    }
    
    console.log('=== DEBUG: Adding to cart ===');
    console.log('Product ID:', productId);
    console.log('Product found:', product);
    console.log('Image URL from API:', product.image_url);
    
    const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const existingItemIndex = cart.findIndex(item => item.id == productId);
    
    if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += 1;
    } else {
        // QUAN TRỌNG: Đảm bảo lưu đúng trường image
        // API dùng 'image_url', nhưng giỏ hàng dùng 'image'
        const imageFromAPI = product.image_url || product.image;
        console.log('Image to save:', imageFromAPI);
        
        const cartItem = {
            id: product.product_id,
            name: product.product_name,
            price: parseInt(product.price_vnd), // Chuyển thành số
            size: 'M',
            quantity: 1,
            // SỬA Ở ĐÂY: Dùng imageFromAPI
            image: imageFromAPI
        };
        
        console.log('Cart item to add:', cartItem);
        cart.push(cartItem);
    }
    
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    console.log('✅ Cart saved to localStorage:', JSON.parse(localStorage.getItem('shoppingCart')));
    
    if (typeof updateCartCount === 'function') updateCartCount();
    
    alert(`Đã thêm "${product.product_name}" vào giỏ hàng!`);
    
    // Log để debug tiếp
    const savedCart = JSON.parse(localStorage.getItem('shoppingCart'));
    console.log('🛒 Final cart check:', savedCart);
    if (savedCart && savedCart.length > 0) {
        console.log('First item image field:', savedCart[0].image);
    }
}

/**
 * Render danh sách sản phẩm
 */
function renderProducts(products) {
    const container = document.getElementById('product-list-container');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div class="no-products"><p>Không tìm thấy sản phẩm nào</p></div>';
        return;
    }
    
    let html = '';
    
    products.forEach(product => {
        // Fix lỗi giá tiền: Parse sang số nguyên để bỏ .00 rồi mới format
        const price = product.price_vnd || 0; 
        const formattedPrice = parseInt(price).toLocaleString('vi-VN'); // Ra dạng 350.000
        
        // Link ảnh (giữ nguyên logic cũ của bạn)
        const imageUrl = product.image_url || 'images/default.jpg';

        html += `
            <div class="product-card" data-id="${product.product_id}">
                <div class="product-image">
                    <img src="${imageUrl}" 
                         alt="${product.product_name}"
                         onerror="this.onerror=null; this.src='images/default.jpg'">
                </div>
                
                <div class="product-info">
                    <h3 class="product-title">${product.product_name}</h3>
                    
                    <p class="product-category">${getCategoryName(product.category)}</p>
                    
                    <p class="product-price">${formattedPrice} VNĐ</p>
                    
                    <a href="../sp_home/chitiet_sp.html?id=${product.product_id}" class="btn-buy">
                        Xem Chi Tiết
                    </a>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Format tiền tệ
 */
function formatCurrency(amount) {
    if (!amount && amount !== 0) return '0';
    return amount.toLocaleString('vi-VN');
}
/**
 * Lấy tên loại sản phẩm
 */
function getCategoryName(category) {
    const categories = {
        'ao': 'Áo',
        'mu': 'Mũ & Nón Bơi',
        'khan': 'Khăn Tắm',
        'binhnuoc': 'Bình Nước',
        'khac': 'Phụ kiện'
    };
    return categories[category] || 'Khác';
}

/**
 * Cập nhật số lượng kết quả
 */
function updateResultCount(count) {
    const countElement = document.getElementById('result-count');
    if (countElement) {
        countElement.textContent = `Hiển thị 1-${count} trên ${count} sản phẩm`;
    }
}

/**
 * Sắp xếp sản phẩm
 */
function sortProducts(products, sortType) {
    const sorted = [...products];
    
    switch(sortType) {
        case 'price-asc':
            // Giá thấp đến cao
            return sorted.sort((a, b) => a.price_vnd - b.price_vnd);
            
        case 'price-desc':
            // Giá cao đến thấp
            return sorted.sort((a, b) => b.price_vnd - a.price_vnd);
            
        case 'newest':
            // Mới nhất: Dùng product_id để so sánh
            // Lấy ID lớn trừ ID nhỏ -> Ra thứ tự giảm dần
            return sorted.sort((a, b) => b.product_id - a.product_id);
            
        default:
            return sorted;
    }
}

/**
 * Lọc sản phẩm
 */
function filterProducts(products) {
    return products.filter(product => {
        // Lọc theo loại
        if (currentFilters.type.length > 0) {
            if (!currentFilters.type.includes(product.category)) {
                return false;
            }
        }
        
        // Lọc theo giá
        // SỬA: Dùng price_vnd
        if (product.price_vnd > currentFilters.maxPrice) {
            return false;
        }
        
        return true;
    });
}

/**
 * Thiết lập event listeners
 */
function setupEventListeners() {
    // Sắp xếp
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            applyFiltersAndSort();
        });
    }
    
    // Lọc theo loại
    document.querySelectorAll('input[name="type"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateTypeFilter();
        });
    });
    
    // Lọc theo giá
    const priceRange = document.querySelector('input[type="range"]');
    if (priceRange) {
        priceRange.addEventListener('input', function() {
            const priceText = document.querySelector('.filter-group p');
            if (priceText) {
                priceText.textContent = `Giá: Dưới ${formatCurrency(this.value)} VNĐ`;
            }
        });
        
        priceRange.addEventListener('change', function() {
            currentFilters.maxPrice = parseInt(this.value);
            applyFiltersAndSort();
        });
    }
    
    // Nút áp dụng lọc
    const applyFilterBtn = document.querySelector('.btn-secondary.full-width');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            updateTypeFilter();
            applyFiltersAndSort();
        });
    }
}

/**
 * Cập nhật bộ lọc loại sản phẩm
 */
function updateTypeFilter() {
    currentFilters.type = [];
    document.querySelectorAll('input[name="type"]:checked').forEach(checkbox => {
        currentFilters.type.push(checkbox.value);
    });
}

/**
 * Áp dụng lọc và sắp xếp
 */
function applyFiltersAndSort() {
    // Lọc
    let filteredProducts = filterProducts(allProducts);
    
    // Sắp xếp
    filteredProducts = sortProducts(filteredProducts, currentSort);
    
    // Render
    renderProducts(filteredProducts);
    updateResultCount(filteredProducts.length);
}

// Thêm CSS inline cho loading
const style = document.createElement('style');
style.textContent = `
    .loading-state {
        text-align: center;
        padding: 50px;
        width: 100%;
        grid-column: 1 / -1;
    }
    
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error-state {
        text-align: center;
        padding: 30px;
        width: 100%;
        grid-column: 1 / -1;
        background: #ffebee;
        border-radius: 8px;
    }
    
    .no-products {
        text-align: center;
        padding: 50px;
        width: 100%;
        grid-column: 1 / -1;
        color: #666;
    }
    
    .product-card {
        transition: transform 0.2s;
    }
    
    .product-card:hover {
        transform: translateY(-5px);
    }
    
    .btn-add-to-cart {
    background-color: #27ae60;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 8px;
    width: 100%;
    transition: background-color 0.3s;
}

.btn-add-to-cart:hover {
    background-color: #219653;
}
`;
document.head.appendChild(style);

// Export cho các file khác sử dụng
window.productModule = {
    loadProducts: loadProductsFromAPI,
    getProducts: () => allProducts
};