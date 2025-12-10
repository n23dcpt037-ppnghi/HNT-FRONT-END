// CNPM CK/scripts/main.js

document.addEventListener('DOMContentLoaded', function() {
    checkLoginState();
    updateCartCount();
});

/**
 * HÀM 1: KIỂM TRA ĐĂNG NHẬP / ĐĂNG XUẤT
 */
function checkLoginState() {
    // 1. Lấy token từ LocalStorage
    const token = localStorage.getItem('token');
    
    // 2. Tìm cái nút "Đăng Nhập" trên thanh menu
    // (Tìm thẻ a có chứa chữ 'login.html' trong phần user-actions)
    const loginLink = document.querySelector('.user-actions a[href*="login.html"]');
    
    // 3. Tìm cái nút "Hồ Sơ" (để nếu chưa đăng nhập thì ẩn đi cho chuyên nghiệp, hoặc giữ nguyên tùy bà)
    const profileLink = document.querySelector('.user-actions a[href*="nguoidung.html"]');

    if (token && loginLink) {
        // --- TRƯỜNG HỢP: ĐÃ ĐĂNG NHẬP ---
        
        // Đổi chữ "Đăng Nhập" -> "Đăng Xuất"
        loginLink.textContent = 'Đăng Xuất';
        loginLink.href = '#'; // Hủy đường dẫn để không chuyển trang lung tung
        loginLink.style.color = '#ffc107'; // (Tùy chọn) Đổi màu vàng cho nổi

        // Hiển thị tên người dùng (nếu có) vào chỗ "Hồ Sơ"
        const userName = localStorage.getItem('userName');
        if (profileLink && userName) {
            profileLink.textContent = `Chào, ${userName}`;
        }

        // Gắn sự kiện CLICK cho nút Đăng Xuất
        loginLink.addEventListener('click', function(e) {
            e.preventDefault(); // Chặn hành động mặc định
            handleLogout();
        });

    } else {
        // --- TRƯỜNG HỢP: CHƯA ĐĂNG NHẬP (KHÁCH) ---
        // Giữ nguyên nút Đăng Nhập, không làm gì cả
    }
}

/**
 * HÀM XỬ LÝ ĐĂNG XUẤT
 */
function handleLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
        // XÓA TẤT CẢ CÁC KEY LIÊN QUAN
        const keysToRemove = [
            'token', 'authToken', 'userId', 'userEmail', 
            'userName', 'role', 'currentUser', 'rememberedEmail'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        alert('Đăng xuất thành công!');
        window.location.reload();
    }
}

/**
 * HÀM 2: CẬP NHẬT SỐ LƯỢNG GIỎ HÀNG (Giữ lại từ code cũ)
 */
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const totalCount = cart.reduce((total, item) => total + item.quantity, 0);

    // Tìm tất cả các link Giỏ hàng để cập nhật số
    const cartLinks = document.querySelectorAll('a[href*="giohang"], a[href*="ghtt.html"]');
    
    cartLinks.forEach(link => {
        // Giữ icon và thay số
        if (totalCount > 0) {
            link.innerHTML = `🛒 Giỏ Hàng (${totalCount})`;
        } else {
            link.innerHTML = `🛒 Giỏ Hàng`;
        }
    });
}

// Hàm đồng bộ giỏ hàng giữa localStorage và backend
async function syncCartWithBackend() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.log('Chưa đăng nhập, dùng localStorage');
        return;
    }
    
    try {
        // 1. Lấy giỏ hàng từ backend
        const response = await fetch('http://localhost:3000/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const backendCart = await response.json();
            console.log('🔄 Backend cart:', backendCart);
            
            // 2. Chuyển đổi format
            const localCart = backendCart.map(item => ({
                id: item.product_id,
                name: item.product_name,
                price: item.price_vnd,
                quantity: item.quantity,
                size: 'M', // Mặc định
                image: item.image_url || 'images/default.jpg'
            }));
            
            // 3. Lưu vào localStorage
            localStorage.setItem('shoppingCart', JSON.stringify(localCart));
            console.log('✅ Đã đồng bộ từ backend');
            
            // 4. Cập nhật số lượng trên header
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }
        }
    } catch (error) {
        console.error('Lỗi đồng bộ:', error);
    }
}

// Chạy đồng bộ khi tải trang
document.addEventListener('DOMContentLoaded', function() {
    // Chờ 1 giây để đảm bảo các script khác đã load
    setTimeout(syncCartWithBackend, 1000);
});

if (typeof window !== 'undefined') {
    window.updateCartCount = updateCartCount;
    window.checkLoginState = checkLoginState;
    window.handleLogout = handleLogout;
}