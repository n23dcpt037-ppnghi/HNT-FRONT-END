// CNPM CK/scripts/home.js - CHỈ DÙNG CHO TRANG CHỦ

document.addEventListener('DOMContentLoaded', function() {
    console.log('Trang chủ đã load - Khởi tạo dữ liệu động');
    
    // CHỈ load khi ở trang chủ
    if (document.body.classList.contains('home-page') || window.location.pathname.includes('trangchu')) {
        loadHomeData();
    }
});

const API_BASE_URL = 'http://localhost:3000/api';

// Hàm chính tải tất cả dữ liệu
async function loadHomeData() {
    try {
        console.log('Bắt đầu tải dữ liệu trang chủ...');
        
        // Tải song song
        await Promise.allSettled([
            loadUpcomingEvents(),
            loadFeaturedAthletes(),
            loadFeaturedProducts()
        ]);
        
        console.log('✅ Đã tải xong dữ liệu trang chủ');
    } catch (error) {
        console.error('Lỗi tải dữ liệu trang chủ:', error);
    }
}

// Format ngày tháng
function formatDate(dateString) {
    if (!dateString) return 'Đang cập nhật';
    try {
        // Xử lý nhiều định dạng date
        let date;
        if (dateString.includes('-')) {
            date = new Date(dateString);
        } else if (dateString.includes('/')) {
            const parts = dateString.split('/');
            date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
            return dateString;
        }
        
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        console.warn('Lỗi format date:', dateString, e);
        return dateString;
    }
}

// Cắt ngắn text
function truncateText(text, maxLength = 100) {
    if (!text || typeof text !== 'string') return 'Đang cập nhật...';
    const cleanText = text.trim();
    return cleanText.length > maxLength ? cleanText.substring(0, maxLength) + '...' : cleanText;
}

// 1. Tải sự kiện sắp diễn ra
async function loadUpcomingEvents() {
    const container = document.getElementById('upcoming-events');
    if (!container) return;
    
    try {
        console.log('Đang tải sự kiện...');
        const response = await fetch(`${API_BASE_URL}/events/upcoming`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const events = await response.json();
        console.log(`Nhận được ${events?.length || 0} sự kiện`);
        
        if (!events || events.length === 0) {
            container.innerHTML = `
                <div class="no-data-message">
                    <i class="far fa-calendar-times"></i>
                    <p>Chưa có sự kiện sắp diễn ra</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        events.slice(0, 3).forEach(event => {
            html += `
                <div class="event-card">
                    <div class="event-progress">
                        <div class="event-progress-fill"></div>
                    </div>
                    <img src="${event.image_url || 'images/event-default.jpg'}" 
                         alt="${event.title || 'Sự kiện'}" 
                         class="event-image"
                         onerror="this.src='images/event-default.jpg'">
                    <div class="event-content">
                        <div class="event-date">
                            <i class="far fa-calendar"></i> ${formatDate(event.event_date)}
                        </div>
                        <h3 class="event-title">${event.title || 'Sự kiện'}</h3>
                        <p class="event-description">
                            ${truncateText(event.description || 'Mô tả sự kiện đang được cập nhật...', 120)}
                        </p>
                        <div class="event-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${event.location || 'Đang cập nhật'}</span>
                            <span><i class="far fa-clock"></i> ${event.event_time || 'Toàn ngày'}</span>
                        </div>
                        <a href="../sk/chitiet_sukien.html?id=${event.event_id}" class="btn-details">
                            Xem Chi Tiết <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Lỗi tải sự kiện:', error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Không thể tải sự kiện. Vui lòng thử lại sau.</p>
            </div>
        `;
    }
}

// 2. Tải tuyển thủ - QUAN TRỌNG: FIX LỖI "GIẬT"
async function loadFeaturedAthletes() {
    const container = document.getElementById('featured-athletes');
    if (!container) return;
    
    try {
        console.log('Home.js: Đang tải tuyển thủ...');
        const response = await fetch(`${API_BASE_URL}/athletes`);
        
        if (!response.ok) {
            console.warn('Home.js: Không thể tải tuyển thủ');
            return; // Không làm gì cả, để script trong HTML xử lý
        }
        
        const athletes = await response.json();
        
        if (!athletes || athletes.length === 0) {
            console.log('Home.js: Không có tuyển thủ nào');
            return;
        }
        
        // Kiểm tra xem đã có dữ liệu chưa (tránh ghi đè script HTML)
        if (container.children.length > 1) {
            console.log('Home.js: Đã có dữ liệu tuyển thủ, không tải lại');
            return;
        }
        
        console.log(`Home.js: Tải thành công ${athletes.length} tuyển thủ`);
        
    } catch (error) {
        console.error('Home.js: Lỗi tải tuyển thủ:', error);
        // Không làm gì, để script HTML tự xử lý
    }
}

// 3. Tải sản phẩm
async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    try {
        console.log('Đang tải sản phẩm...');
        const response = await fetch(`${API_BASE_URL}/products`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const products = await response.json();
        console.log(`Nhận được ${products?.length || 0} sản phẩm`);
        
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-box-open"></i>
                    <p>Chưa có sản phẩm nào</p>
                </div>
            `;
            return;
        }
        
        // Chỉ lấy sản phẩm có stock > 0
        const availableProducts = products.filter(p => p.stock > 0);
        
        let html = '';
        availableProducts.slice(0, 3).forEach(product => {
            html += `
                <div class="product-card">
                    <img src="${product.image_url || 'images/ao1.jpg'}" 
                         alt="${product.product_name || 'Sản phẩm'}" 
                         class="product-image"
                         onerror="this.src='images/ao1.jpg'">
                    <div class="product-details">
                        <h3 class="product-name">${product.product_name || 'Sản phẩm'}</h3>
                        <p class="product-price">${parseInt(product.price_vnd || 0).toLocaleString('vi-VN')} VNĐ</p>
                        <a href="chitiet_sp.html?id=${product.product_id}" class="btn-details">
                            Xem Chi Tiết <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Không thể tải sản phẩm</p>
            </div>
        `;
    }
}

// Thêm CSS cho loading và error states
function addHomeStyles() {
    if (!document.querySelector('#home-styles')) {
        const style = document.createElement('style');
        style.id = 'home-styles';
        style.textContent = `
            .loading-container, .no-data-message, .error-message {
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px;
                color: #666;
            }
            
            .loading-container i {
                font-size: 2rem;
                margin-bottom: 15px;
                display: block;
            }
            
            .no-data-message i, .error-message i {
                font-size: 3rem;
                margin-bottom: 20px;
                display: block;
            }
            
            .no-data-message {
                color: #003366;
            }
            
            .error-message {
                color: #d32f2f;
            }
            
            .btn-details {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: #003366;
                color: white;
                padding: 12px 25px;
                border-radius: 25px;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.3s ease;
                border: 2px solid #003366;
                margin-top: 15px;
            }
            
            .btn-details:hover {
                background: transparent;
                color: #003366;
                gap: 15px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Thêm styles khi load
addHomeStyles();