// thanhtoan.js - PHIÊN BẢN CHUẨN VỚI BACKEND CỦA BẠN

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== TRANG THANH TOÁN ===');
    
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    if (!token) {
        alert('⚠️ Vui lòng đăng nhập!');
        window.location.href = '../đn/login.html';
        return;
    }
    
    // 2. Tải giỏ hàng từ backend
    loadCartFromBackend(token);
    
    // 3. Setup UI
    setupPaymentMethods();
    setupFormSubmission();
});

// Định dạng tiền
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Tải giỏ hàng từ Backend API CỦA BẠN
async function loadCartFromBackend(token) {
    console.log('🔄 Đang tải giỏ hàng từ backend...');
    
    try {
        // Gọi API: GET /api/cart
        const response = await fetch(`${API_URL}/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        // Backend của bạn trả về MẢNG TRỰC TIẾP
        const cartItems = await response.json();
        console.log('📦 Backend cart items:', cartItems);
        
        // Hiển thị
        if (!cartItems || cartItems.length === 0) {
            showEmptyCart();
        } else {
            displayCartItems(cartItems);
            updateTotals(cartItems);
            
            // Đồng bộ vào localStorage
            syncToLocalStorage(cartItems);
        }
        
    } catch (error) {
        console.error('❌ Lỗi tải giỏ hàng:', error);
        showError('Không thể tải giỏ hàng. Vui lòng thử lại!');
        
        // Fallback: dùng localStorage
        const localCart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        if (localCart.length > 0) {
            displayCartItems(localCart);
            updateTotals(localCart);
        }
    }
}

// Hiển thị giỏ hàng trống
function showEmptyCart() {
    document.getElementById('order-items-list').innerHTML = `
        <div style="text-align: center; padding: 30px; color: #666;">
            <i class="fas fa-shopping-cart" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
            <p style="font-size: 16px;">Giỏ hàng trống</p>
            <a href="../sp_home/danhmuc_sp.html" style="color: #4CAF50; text-decoration: none;">
                <i class="fas fa-store"></i> Mua sắm ngay
            </a>
        </div>
    `;
    updateTotals([]);
}

// Hiển thị lỗi
function showError(message) {
    document.getElementById('order-items-list').innerHTML = `
        <div style="text-align: center; padding: 20px; color: #f44336;">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Hiển thị sản phẩm
function displayCartItems(items) {
    const orderItemsList = document.getElementById('order-items-list');
    let html = '';
    
    items.forEach((item) => {
        const price = item.price_vnd || 0;
        const quantity = item.quantity || 1;
        const name = item.product_name || 'Sản phẩm';
        const total = price * quantity;
        
        html += `
            <div class="cart-item" style="
                display: flex; 
                justify-content: space-between; 
                align-items: center;
                padding: 12px;
                margin-bottom: 10px;
                background: #f9f9f9;
                border-radius: 8px;
                border-left: 4px solid #4CAF50;
            ">
                <div style="flex: 1;">
                    <strong>${name}</strong>
                    <div style="color: #666; font-size: 0.9em; margin-top: 4px;">
                        Số lượng: <strong>x${quantity}</strong> | 
                        Đơn giá: ${formatCurrency(price)}
                    </div>
                </div>
                <div style="font-weight: bold; color: #e44d26; font-size: 1.1em;">
                    ${formatCurrency(total)}
                </div>
            </div>
        `;
    });
    
    orderItemsList.innerHTML = html;
    console.log(`✅ Đã hiển thị ${items.length} sản phẩm`);
}

// Tính tổng tiền
function updateTotals(items) {
    let subtotal = 0;
    
    if (items && items.length > 0) {
        items.forEach(item => {
            const price = item.price_vnd || 0;
            const quantity = item.quantity || 1;
            subtotal += price * quantity;
        });
    }
    
    const shippingFee = 30000;
    const finalTotal = subtotal + shippingFee;

    document.getElementById('sub-total').innerText = formatCurrency(subtotal);
    document.getElementById('shipping-fee').innerText = formatCurrency(shippingFee);
    document.getElementById('final-total').innerText = formatCurrency(finalTotal);
}

// Đồng bộ vào localStorage
function syncToLocalStorage(items) {
    try {
        const simplified = items.map(item => ({
            id: item.product_id,
            name: item.product_name,
            price: item.price_vnd,
            quantity: item.quantity,
            size: 'M'
        }));
        
        localStorage.setItem('shoppingCart', JSON.stringify(simplified));
        console.log('💾 Đã đồng bộ vào localStorage');
    } catch (error) {
        console.error('Lỗi sync localStorage:', error);
    }
}

// Xử lý đặt hàng - GỬI ĐÚNG API CỦA BẠN
async function setupFormSubmission() {
    const form = document.getElementById('checkout-form');
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        console.log('=== BẮT ĐẦU ĐẶT HÀNG ===');
        
        // 1. Validate form
        const fullname = document.getElementById('fullname').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        
        if (!fullname || !phone || !address) {
            alert('⚠️ Vui lòng điền đầy đủ thông tin!');
            return;
        }
        
        // 2. Kiểm tra đăng nhập
        const token = localStorage.getItem('token');
        if (!token) {
            alert('⚠️ Vui lòng đăng nhập!');
            window.location.href = '../đn/login.html';
            return;
        }
        
        // 3. Hiển thị loading
        const btn = document.getElementById('confirm-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        btn.disabled = true;
        
        try {
            // 4. Gọi API ĐẶT HÀNG của bạn: POST /api/orders
            console.log('📨 Gửi đơn hàng lên backend...');
            
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    shipping_name: fullname,
                    shipping_address: address,
                    shipping_phone: phone,
                    note: document.getElementById('note').value || ''
                    // Backend của bạn sẽ tự động lấy items từ cart_items
                })
            });
            
            console.log('📡 Order response status:', response.status);
            const result = await response.json();
            console.log('📦 Order response:', result);
            
            if (response.ok) {
                // THÀNH CÔNG - XÓA GIỎ HÀNG TRONG BACKEND
                console.log('✅ Đặt hàng thành công! Đang xóa giỏ hàng...');
                
                // Xóa từng item trong giỏ hàng backend
                await clearBackendCart(token);
                
                // Xóa localStorage
                localStorage.removeItem('shoppingCart');
                
                // Cập nhật header
                if (typeof updateCartCount === 'function') {
                    updateCartCount();
                }
                
                // Thông báo
                const orderId = result.orderId || result.id || 'HD' + Date.now();
                alert(`✅ ĐẶT HÀNG THÀNH CÔNG!\n\n📋 Mã đơn: #${orderId}\n📧 Email xác nhận đã được gửi.`);
                
                // Chuyển về trang chủ
                setTimeout(() => {
                    window.location.href = "../sp_home/trangchu.html";
                }, 1500);
                
            } else {
                // LỖI
                console.error('❌ Lỗi đặt hàng:', result);
                alert(`❌ ${result.message || 'Không thể đặt hàng'}`);
            }
            
        } catch (error) {
            console.error('❌ Lỗi kết nối:', error);
            alert('❌ Lỗi kết nối server. Vui lòng thử lại!');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// Xóa giỏ hàng trong backend bằng cách xóa từng item
async function clearBackendCart(token) {
    try {
        // 1. Lấy tất cả items trong giỏ
        const response = await fetch(`${API_URL}/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const cartItems = await response.json();
            console.log(`🗑️ Cần xóa ${cartItems.length} sản phẩm`);
            
            // 2. Xóa từng item
            for (const item of cartItems) {
                await fetch(`${API_URL}/cart/remove`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId: item.product_id
                    })
                });
                console.log(`✅ Đã xóa sản phẩm ${item.product_id}`);
            }
            
            console.log('✅ Đã xóa toàn bộ giỏ hàng backend');
        }
    } catch (error) {
        console.error('Lỗi xóa giỏ hàng:', error);
    }
}

// Xử lý payment methods (giữ nguyên)
function setupPaymentMethods() {
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const qrSection = document.getElementById('qr-section');
    const bankQr = document.getElementById('bank-qr');
    const momoQr = document.getElementById('momo-qr');
    const confirmBtn = document.getElementById('confirm-btn');

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            qrSection.style.display = 'none';
            bankQr.style.display = 'none';
            momoQr.style.display = 'none';
            confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> XÁC NHẬN ĐẶT HÀNG';

            if (e.target.value === 'banking') {
                qrSection.style.display = 'block';
                bankQr.style.display = 'flex';
                confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> ĐÃ CHUYỂN KHOẢN';
                
                const finalTotal = document.getElementById('final-total').innerText;
                document.getElementById('bank-amount').innerText = finalTotal;
                
            } else if (e.target.value === 'momo') {
                qrSection.style.display = 'block';
                momoQr.style.display = 'flex';
                confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> ĐÃ THANH TOÁN MOMO';
                
                const finalTotal = document.getElementById('final-total').innerText;
                document.getElementById('momo-amount').innerText = finalTotal;
            }
        });
    });
}

