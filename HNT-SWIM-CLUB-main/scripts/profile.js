const API_BASE_URL = 'http://localhost:3000/api';
const ENDPOINTS = {
    USER_PROFILE: `${API_BASE_URL}/auth/profile`,
    USER_UPDATE: `${API_BASE_URL}/auth/profile`,
    USER_ORDERS: `${API_BASE_URL}/orders/my-orders`,
    ORDER_DETAIL: `${API_BASE_URL}/orders`
};

function getStatusStyle(status) {
    const statusLower = (status || 'pending').toLowerCase();
    
    switch(statusLower) {
        case 'completed':
            return 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;';
        case 'confirmed':
        case 'processing':
        case 'shipped':
            return 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;';
        case 'pending':
            return 'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;';
        case 'cancelled':
            return 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;';
        default:
            return 'background: #f8f9fa; color: #6c757d; border: 1px solid #e9ecef;';
    }
}

// Hàm lấy text hiển thị trạng thái
function getStatusText(status) {
    const statusLower = (status || 'pending').toLowerCase();
    
    switch(statusLower) {
        case 'completed':
            return 'Đã hoàn thành';
        case 'processing':
        case 'confirmed':
            return 'Đang xử lý';
        case 'shipped':
            return 'Đang giao hàng';
        case 'pending':
            return 'Chờ xác nhận';
        case 'cancelled':
            return 'Đã hủy';
        default:
            return 'Chờ xác nhận';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' VND';
}

// QUAN TRỌNG: Tìm token từ nhiều nguồn
function getAuthToken() {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
}

let authToken = getAuthToken();

// Debug chi tiết
console.log('=== PROFILE PAGE DEBUG ===');
console.log('localStorage token:', localStorage.getItem('token'));
console.log('localStorage authToken:', localStorage.getItem('authToken'));
console.log('sessionStorage token:', sessionStorage.getItem('token'));
console.log('sessionStorage authToken:', sessionStorage.getItem('authToken'));
console.log('Token cuối cùng dùng để gọi API:', authToken ? 'CÓ' : 'KHÔNG');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM loaded, starting profile page');
    
    if (!authToken) {
        console.log('⚠️ No token found');
        const shouldRedirect = confirm('Bạn chưa đăng nhập.\n\nNhấn OK để đến trang đăng nhập.\nNhấn Cancel để ở lại trang này (sẽ không có dữ liệu).');
        if (shouldRedirect) {
            window.location.href = '../đn/login.html';
            return;
        } else {
            // Hiển thị trang với dữ liệu mẫu
            showDemoData();
            return;
        }
    }
    
    console.log('🔑 Token found, loading data...');
    
    try {
        // Load song song cả 2
        await Promise.all([
            loadUserProfile(),
            loadOrders()
        ]);
        
        console.log('✅ All data loaded');
        setupEventListeners();
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        
        // VẪN HIỂN THỊ DEMO KHI CÓ LỖI
        showDemoData();
        
        // Hiển thị thông báo
        const errorInfo = document.getElementById('error-info');
        if (errorInfo) {
            errorInfo.textContent = 'Không thể tải dữ liệu: ' + error.message;
            errorInfo.style.display = 'block';
        }
    }
});


// Tải thông tin user
async function loadUserProfile() {
    console.log('=== LOAD USER PROFILE ===');
    
    if (!authToken) {
        console.log('Không có token, hiển thị demo');
        showDemoProfile();
        return;
    }
    
    try {
        console.log('📡 Gửi request với token:', authToken.substring(0, 30) + '...');
        
        const response = await fetch(ENDPOINTS.USER_PROFILE, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Data received:', data);
        
        // XỬ LÝ DATA ĐÚNG CÁCH
        if (data.success && data.user) {
            // Format: { success: true, user: {...} }
            console.log('✅ Data format 1: success + user');
            displayUserData(data.user);
        } else if (data.user_id) {
            // Format: user object trực tiếp
            console.log('✅ Data format 2: direct user object');
            displayUserData(data);
        } else {
            console.log('⚠️ Unknown data format, using demo');
            showDemoProfile();
        }
        
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        
        // LUÔN HIỂN THỊ DEMO KHI CÓ LỖI
        showDemoProfile();
        
        // Hiển thị thông báo lỗi
        const loadingDiv = document.getElementById('loading-info');
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <div style="padding: 20px; color: #e74c3c; text-align: center;">
                    <p><strong>⚠️ Lỗi tải thông tin</strong></p>
                    <p>${error.message}</p>
                    <p><small>Đang hiển thị thông tin mẫu</small></p>
                </div>
            `;
        }
    }
}

// Tải đơn hàng
async function loadOrders() {
    try {
        const response = await axios.get(ENDPOINTS.USER_ORDERS, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        document.getElementById('loading-orders').style.display = 'none';
        
        if (response.data && response.data.orders && response.data.orders.length > 0) {
            renderOrders(response.data.orders);
        } else if (response.data && response.data.data && response.data.data.length > 0) {
            renderOrders(response.data.data);
        } else {
            document.getElementById('no-orders').style.display = 'block';
        }
        
    } catch (error) {
        console.error('Lỗi tải đơn hàng:', error);
        handleAuthError(error, 'loading-orders', 'error-orders');
    }
}

// Hiển thị đơn hàng
function renderOrders(orders) {
    const orderList = document.getElementById('order-list');
    orderList.innerHTML = '';
    
    orders.forEach(order => {
        // Tạo trạng thái
        let statusText, statusClass;
        const status = order.status || 'pending';
        
        switch(status.toLowerCase()) {
            case 'completed':
                statusText = 'Đã hoàn thành';
                statusClass = 'completed-status';
                break;
            case 'processing':
            case 'confirmed':
                statusText = 'Đang xử lý';
                statusClass = 'processing-status';
                break;
            case 'shipped':
                statusText = 'Đang giao hàng';
                statusClass = 'processing-status';
                break;
            case 'pending':
                statusText = 'Chờ xác nhận';
                statusClass = 'pending-status';
                break;
            case 'cancelled':
                statusText = 'Đã hủy';
                statusClass = 'cancelled-status';
                break;
            default:
                statusText = 'Chờ xác nhận';
                statusClass = 'pending-status';
        }
        
        // Định dạng ngày
       const orderDate = order.order_date 
    ? new Date(order.order_date).toLocaleDateString('vi-VN')
    : 'N/A';
        
        // Định dạng tiền
        const totalAmount = order.total_amount || order.total || 0;
        const formattedTotal = new Intl.NumberFormat('vi-VN').format(totalAmount) + ' VND';
        
        // Tạo mã đơn hàng
        const orderCode = order.order_id || `#${order.id}`;
        
        // Tạo HTML
        const orderHTML = `
            <div class="order-item">
                <div class="order-id-status">
                    <span class="order-id">Đơn hàng: ${orderCode}</span>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
                <div class="order-details">
                    <p>Ngày đặt: ${orderDate}</p>
                    <p>Tổng tiền: ${formattedTotal}</p>
                </div>
                <div class="order-actions">
                    <button class="view-detail-btn" data-order-id="${order.order_id || order.id}">
                        Xem Chi Tiết
                    </button>
                </div>
            </div>
        `;
        
        orderList.innerHTML += orderHTML;
    });
    
    // Gắn sự kiện xem chi tiết
    document.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            viewOrderDetail(orderId);
        });
    });
}

function displayUserData(user) {
    console.log('🔄 Displaying user data:', user);
    
    // 1. CẬP NHẬT HTML ELEMENTS - KIỂM TRA TỒN TẠI TRƯỚC
    try {
        // Hiển thị tên
        const userNameElement = document.getElementById('user-name');
        const userGreetingElement = document.getElementById('user-greeting');
        
        if (userNameElement) {
            userNameElement.textContent = user.full_name || 'Khách hàng';
        }
        
        if (userGreetingElement) {
            userGreetingElement.textContent = `Xin chào, ${user.full_name || 'Khách hàng'}`;
        }
        
        // 2. ĐIỀN FORM - KIỂM TRA TỒN TẠI
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const addressInput = document.getElementById('address');
        const genderInput = document.getElementById('gender');
        const dobInput = document.getElementById('date_of_birth');
        
        if (nameInput) nameInput.value = user.full_name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
        if (addressInput) addressInput.value = user.address || '';
        if (genderInput) genderInput.value = user.gender || '';
        if (dobInput && user.date_of_birth) {
            dobInput.value = user.date_of_birth;
        }
        
        // 3. ẨN LOADING, HIỂN THỊ FORM
        const loadingInfo = document.getElementById('loading-info');
        const personalInfoForm = document.getElementById('personal-info-form');
        
        if (loadingInfo) {
            loadingInfo.style.display = 'none';
        }
        
        if (personalInfoForm) {
            personalInfoForm.style.display = 'block';
        }
        
        console.log('✅ Đã hiển thị dữ liệu thành công');
        
    } catch (displayError) {
        console.error('❌ Lỗi hiển thị dữ liệu:', displayError);
        console.error('User object tại thời điểm lỗi:', user);
    }
}


// Xem chi tiết đơn hàng
async function viewOrderDetail(orderId) {
    console.log('Xem chi tiết đơn hàng ID:', orderId);
    
    try {
        const response = await axios.get(`${ENDPOINTS.ORDER_DETAIL}/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Chi tiết đơn hàng:', response.data);
        
        if (response.data && response.data.success) {
            const order = response.data.order || response.data.data;
            showOrderModal(order);
        } else {
            alert('Không tải được chi tiết đơn hàng: ' + (response.data?.message || ''));
        }
        
    } catch (error) {
        console.error('Lỗi xem chi tiết:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        
        if (error.response?.status === 404) {
            alert('Không tìm thấy đơn hàng này');
        } else {
            alert('Không thể tải chi tiết đơn hàng: ' + (error.response?.data?.message || error.message));
        }
    }
}

function showDemoProfile() {
    console.log('🔄 Showing demo profile');
    displayUserData({
        user_id: 999,
        full_name: 'Nguyễn Văn Demo',
        email: 'demo@example.com',
        phone: '0123 456 789',
        address: '123 Đường Demo, Quận 1, TP.HCM',
        gender: 'male',
        role: 'user'
    });
}

// Hiển thị modal chi tiết đơn hàng
function showOrderModal(order) {
    console.log('=== SHOW ORDER MODAL WITH SHIPPING ===');
    
    // Lấy items
    let items = [];
    if (order.items && Array.isArray(order.items)) {
        items = order.items;
    }
    
    // Tạo items HTML
    let itemsHTML = '';
    try {
        if (items.length > 0) {
            itemsHTML = items.map(item => {
                const productName = item.product_name || 'Sản phẩm';
                const quantity = item.quantity || 1;
                const unitPrice = item.unit_price || 0;
                const total = unitPrice * quantity;
                
                return `
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #eee;">
                            <strong>${productName}</strong>
                        </td>
                        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">
                            ${quantity}
                        </td>
                        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">
                            ${formatCurrency(unitPrice)}
                        </td>
                        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">
                            <strong>${formatCurrency(total)}</strong>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            itemsHTML = `
                <tr>
                    <td style="padding: 15px; text-align: center; color: #666;" colspan="4">
                        Không có sản phẩm trong đơn hàng
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error creating items HTML:', error);
        itemsHTML = '<tr><td colspan="4">Lỗi hiển thị sản phẩm</td></tr>';
    }
    
    // TÍNH TOÁN TIỀN
    const subtotal = items.reduce((sum, item) => {
        return sum + ((item.unit_price || 0) * (item.quantity || 1));
    }, 0);
    
    const shippingFee = 30000; // PHÍ SHIP CỐ ĐỊNH
    const finalTotal = subtotal + shippingFee;
    
    console.log('Order calculations:', { subtotal, shippingFee, finalTotal });
    
    // KIỂM TRA CÓ THỂ THAY ĐỔI THÔNG TIN KHÔNG
    const canChangeShipping = ['pending', 'confirmed'].includes((order.status || '').toLowerCase());
    
    // TẠO NÚT THAY ĐỔI THÔNG TIN
    let changeButtonHTML = '';
    if (canChangeShipping) {
        changeButtonHTML = `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ddd;">
                <button onclick="openShippingEditModal(${order.order_id || order.id})" 
                    style="
                        background: #f39c12;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: all 0.3s;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                    "
                    onmouseover="this.style.background='#e67e22'; this.style.transform='translateY(-2px)'"
                    onmouseout="this.style.background='#f39c12'; this.style.transform='translateY(0)'">
                    <i class="fas fa-edit"></i> Thay đổi thông tin giao hàng
                </button>
                <p style="font-size: 12px; color: #666; margin-top: 8px; margin-bottom: 0;">
                    <i class="fas fa-info-circle"></i> Chỉ có thể thay đổi khi đơn hàng chưa được giao
                </p>
            </div>
        `;
    }
    
    // TẠO MODAL HTML với chi tiết tính toán
    const modalHTML = `
        <div class="order-modal" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
            align-items: center; z-index: 1000; padding: 20px;
        ">
            <div style="
                background: white; padding: 30px; border-radius: 10px;
                max-width: 700px; width: 100%; max-height: 85vh; overflow-y: auto;
                box-shadow: 0 5px 30px rgba(0,0,0,0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #2c3e50; font-size: 24px;">
                        📦 Chi tiết đơn hàng #${order.order_id || order.id || 'N/A'}
                    </h2>
                    <button onclick="this.closest('.order-modal').remove()" style="
                        background: none; border: none; font-size: 28px; cursor: pointer; 
                        color: #666; width: 40px; height: 40px; border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#f1f1f1'" onmouseout="this.style.background='none'">
                        ×
                    </button>
                </div>
                
                <!-- Thông tin đơn hàng -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db;">
                        <h4 style="margin-top: 0; color: #2c3e50; display: flex; align-items: center; gap: 8px;">
                            📋 Thông tin đơn hàng
                        </h4>
                        <p><strong>Ngày đặt:</strong> ${order.order_date ? new Date(order.order_date).toLocaleDateString('vi-VN') : 'N/A'}</p>
                        <p><strong>Trạng thái:</strong> 
                            <span style="padding: 4px 8px; border-radius: 3px; font-weight: bold; 
                                ${getStatusStyle(order.status || 'pending')}">
                                ${getStatusText(order.status || 'pending')}
                            </span>
                        </p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #2ecc71;">
                        <h4 style="margin-top: 0; color: #2c3e50; display: flex; align-items: center; gap: 8px;">
                            👤 Thông tin nhận hàng
                        </h4>
                        <p><strong>Người nhận:</strong> ${order.shipping_name || order.full_name || 'N/A'}</p>
                        <p><strong>Điện thoại:</strong> ${order.shipping_phone || order.phone || 'N/A'}</p>
                        <p><strong>Địa chỉ:</strong> ${order.shipping_address || order.address || 'N/A'}</p>
                        
                        ${changeButtonHTML}
                    </div>
                </div>
                
                <!-- Danh sách sản phẩm -->
                <h3 style="color: #2c3e50; margin-top: 10px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    🛒 Danh sách sản phẩm
                </h3>
                
                <div style="overflow-x: auto; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #2c3e50; color: white;">
                                <th style="padding: 12px; text-align: left;">Sản phẩm</th>
                                <th style="padding: 12px; text-align: center;">Số lượng</th>
                                <th style="padding: 12px; text-align: right;">Đơn giá</th>
                                <th style="padding: 12px; text-align: right;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>
                </div>
                
                <!-- TÍNH TOÁN TIỀN - PHẦN QUAN TRỌNG -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <h4 style="margin-top: 0; color: #2c3e50; margin-bottom: 15px;">
                        💰 Tổng kết thanh toán
                    </h4>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-weight: 500;">Tạm tính (sản phẩm):</span>
                        <span>${formatCurrency(subtotal)}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-weight: 500;">Phí vận chuyển:</span>
                        <span>+ ${formatCurrency(shippingFee)}</span>
                    </div>
                    
                    <div style="border-top: 2px solid #ddd; margin: 15px 0; padding-top: 15px;">
                        <div style="display: flex; justify-content: space-between; font-size: 18px;">
                            <strong>TỔNG CỘNG:</strong>
                            <strong style="color: #e74c3c; font-size: 20px;">${formatCurrency(finalTotal)}</strong>
                        </div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px; text-align: right;">
                            (Đã bao gồm phí vận chuyển)
                        </div>
                    </div>
                </div>
                
                <!-- Nút đóng -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <button onclick="this.closest('.order-modal').remove()" style="
                        background: #3498db; color: white; border: none; padding: 12px 40px;
                        border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Xóa modal cũ nếu có
    const existingModal = document.querySelector('.order-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Thêm modal mới
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// THÊM HÀM OPEN SHIPPING EDIT MODAL (đặt sau hàm showOrderModal)
async function openShippingEditModal(orderId) {
    console.log('Mở modal chỉnh sửa thông tin giao hàng cho đơn:', orderId);
    
    try {
        // Lấy thông tin đơn hàng hiện tại
        const response = await axios.get(`${ENDPOINTS.ORDER_DETAIL}/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.success) {
            const order = response.data.order;
            showShippingEditModal(order);
        }
        
    } catch (error) {
        console.error('Lỗi lấy thông tin đơn hàng:', error);
        alert('Không thể tải thông tin đơn hàng');
    }
}

// Hàm hiển thị modal chỉnh sửa
function showShippingEditModal(order) {
    const modalHTML = `
        <div class="shipping-edit-modal" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
            align-items: center; z-index: 1001; padding: 20px;
        ">
            <div style="
                background: white; padding: 25px; border-radius: 10px;
                max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;
            ">
                <h3 style="margin-top: 0; color: #2c3e50;">
                    <i class="fas fa-edit"></i> Thay đổi thông tin giao hàng
                </h3>
                
                <div style="margin-bottom: 15px;">
                    <p><strong>Đơn hàng:</strong> #${order.order_id || order.id}</p>
                    <p><strong>Trạng thái:</strong> ${order.status || 'pending'}</p>
                </div>
                
                <form id="shipping-edit-form">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">
                            Họ tên người nhận *
                        </label>
                        <input type="text" id="edit-shipping-name" 
                            value="${order.shipping_name || order.full_name || ''}"
                            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                            required>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">
                            Số điện thoại *
                        </label>
                        <input type="tel" id="edit-shipping-phone" 
                            value="${order.shipping_phone || order.phone || ''}"
                            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                            required>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">
                            Địa chỉ nhận hàng *
                        </label>
                        <textarea id="edit-shipping-address" 
                            rows="3"
                            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                            required>${order.shipping_address || order.address || ''}</textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" onclick="this.closest('.shipping-edit-modal').remove()" 
                            style="padding: 8px 16px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Hủy
                        </button>
                        <button type="submit" 
                            style="padding: 8px 16px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Xóa modal cũ nếu có
    const existingModal = document.querySelector('.shipping-edit-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Thêm modal mới
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Thêm event listener cho form
    setTimeout(() => {
        const form = document.getElementById('shipping-edit-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await updateShippingInfo(order.order_id || order.id);
            });
        }
    }, 100);
}

// Hàm cập nhật thông tin giao hàng
async function updateShippingInfo(orderId) {
    const shippingName = document.getElementById('edit-shipping-name').value.trim();
    const shippingPhone = document.getElementById('edit-shipping-phone').value.trim();
    const shippingAddress = document.getElementById('edit-shipping-address').value.trim();
    
    // Validate
    if (!shippingName || !shippingPhone || !shippingAddress) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    try {
        // Gọi API cập nhật
        const response = await axios.put(`${ENDPOINTS.ORDER_DETAIL}/${orderId}/shipping`, {
            shipping_name: shippingName,
            shipping_phone: shippingPhone,
            shipping_address: shippingAddress
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.success !== false) {
            alert('✅ Cập nhật thông tin giao hàng thành công!');
            
            // Đóng modal
            const editModal = document.querySelector('.shipping-edit-modal');
            if (editModal) editModal.remove();
            
            // Refresh trang
            location.reload();
            
        } else {
            alert('Lỗi: ' + (response.data?.message || 'Không thể cập nhật'));
        }
        
    } catch (error) {
        console.error('Lỗi cập nhật thông tin giao hàng:', error);
        alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
}

// Setup event listeners
function setupEventListeners() {
    const form = document.getElementById('personal-info-form');
    
    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('=== SUBMIT FORM DEBUG ===');
    
    const formData = {
        full_name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        gender: document.getElementById('gender').value,
        date_of_birth: document.getElementById('date_of_birth').value || null,
        address: document.getElementById('address').value.trim()
    };
    
    console.log('Form data:', formData);
    console.log('Auth token:', authToken);
    console.log('Date value:', document.getElementById('date_of_birth').value);
console.log('Date after process:', formData.date_of_birth);
    
    // Validate
    if (!formData.full_name || !formData.phone) {
        alert('Vui lòng nhập đầy đủ họ tên và số điện thoại');
        return;
    }
    
    try {
        console.log('Sending PUT request to:', ENDPOINTS.USER_UPDATE);
        
        const response = await axios.put(ENDPOINTS.USER_UPDATE, formData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Update success:', response.data);
        alert('Cập nhật thành công!');
        // ... update UI
        
    } catch (error) {
        console.error('=== UPDATE ERROR DETAILS ===');
        console.error('Error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Error headers:', error.response?.headers);
        
        alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
});
}

// Xử lý lỗi auth
function handleAuthError(error, loadingId, errorId) {
    if (loadingId) {
        document.getElementById(loadingId).style.display = 'none';
    }
    
    if (errorId) {
        const errorElement = document.getElementById(errorId);
        errorElement.textContent = `Lỗi: ${error.response?.data?.message || error.message}`;
        errorElement.style.display = 'block';
    }
    
    if (error.response && error.response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('authToken');
        window.location.href = '../đn/login.html';
    }
}

// Hiển thị lỗi
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function showDemoData() {
    console.log('Showing demo data (full page)');
    showDemoProfile();
    showDemoOrders();
}

function showDemoOrders() {
    console.log('Showing demo orders');
    const orders = [
        {
            order_id: 1001,
            order_date: '2024-01-15',
            total_amount: 450000,
            status: 'completed'
        },
        {
            order_id: 1002,
            order_date: '2024-01-20',
            total_amount: 320000,
            status: 'pending'
        }
    ];
    
    renderOrders(orders);
    
    const loadingOrders = document.getElementById('loading-orders');
    if (loadingOrders) {
        loadingOrders.style.display = 'none';
    }
}

setTimeout(() => {
    console.log('=== HTML DEBUG ===');
    console.log('Element user-name exists?', !!document.getElementById('user-name'));
    console.log('Element name input exists?', !!document.getElementById('name'));
    console.log('Element email input exists?', !!document.getElementById('email'));
    console.log('Loading info exists?', !!document.getElementById('loading-info'));
    console.log('Personal info form exists?', !!document.getElementById('personal-info-form'));
    
    // Kiểm tra giá trị thực tế
    const nameInput = document.getElementById('name');
    if (nameInput) {
        console.log('Name input value:', nameInput.value);
        console.log('Name input type:', nameInput.type);
    }
}, 1000);