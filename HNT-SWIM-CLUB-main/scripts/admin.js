// CNPM CK/scripts/admin.js

const API_BASE = 'http://localhost:3000/api';

// Hàm định dạng tiền tệ
const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// --- XỬ LÝ ĐƯỜNG DẪN ẢNH (Đã sửa lỗi lặp chữ images) ---
function fixImgPath(path, type = 'product') {
    if (!path || path === 'undefined' || path === 'null') {
        return 'https://placehold.co/100x100?text=No+Image';
    }
    
    // Nếu đã là link đầy đủ (http...) thì giữ nguyên
    if (path.startsWith('http')) return path;

    // --- BƯỚC QUAN TRỌNG: Dọn dẹp tên file ---
    // Loại bỏ hết các đường dẫn thừa phía trước để chỉ lấy tên file gốc
    let cleanPath = path.replace(/^(\.\.\/)+/, '')          // Bỏ ../
                        .replace(/^\/+/, '')                // Bỏ dấu / ở đầu nếu có
                        .replace(/^sp_home\/images\//, '')  // Bỏ sp_home/images/ nếu có sẵn
                        .replace(/^images\//, '')           // <--- QUAN TRỌNG: Bỏ chữ images/ thừa
                        .replace(/^uploads\/products\//, ''); 

    // Chọn thư mục chứa ảnh đúng trên server
    let folder = 'sp_home/images'; // Mặc định cho sản phẩm
    
    if (type === 'athlete') folder = 'tuyenthu';
    if (type === 'event') folder = 'sk';
    
    // Ghép thành link hoàn chỉnh: http://localhost:3000/sp_home/images/ten_anh.jpg
    return `http://localhost:3000/${folder}/${cleanPath}`;
}

// Hàm định dạng ngày
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
};

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth(); // Kiểm tra đăng nhập

    // Xác định đang ở trang nào để tải dữ liệu tương ứng
    const path = window.location.pathname;

    if (path.includes('admin.html')) loadAthletes();       // Tuyển thủ
    if (path.includes('adminsp.html')) loadProducts();     // Sản phẩm
    if (path.includes('admindonhang.html')) loadOrders();  // Đơn hàng
    if (path.includes('adminsk.html')) loadEvents();       // Sự kiện
    if (path.includes('adminbao.html')) loadArticles();    // Tin tức
});

// --- 1. QUẢN LÝ TUYỂN THỦ ---
async function loadAthletes() {
    const tbody = document.querySelector('tbody');
    try {
        console.log('Đang tải danh sách tuyển thủ...');
        const res = await fetch(`${API_BASE}/athletes`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Dữ liệu nhận được:', data);
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Chưa có tuyển thủ nào</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => {
            console.log('Xử lý item:', item);
            
            // FIX: Kiểm tra nhiều trường có thể chứa ảnh
            const imagePath = item.image_url || item.anh_url || item.avatar || '';
            const imageUrl = fixImgPath(imagePath, 'athlete');
            
            return `
            <tr>
                <td>${item.athlete_id || item.id || ''}</td>
                <td>
                    <img src="${imageUrl}" 
                         width="50" 
                         height="50" 
                         style="border-radius:50%; object-fit:cover" 
                         onerror="this.onerror=null; this.src='https://placehold.co/50x50?text=No+Img'"
                         alt="${item.full_name}">
                </td>
                <td>${item.full_name || item.name || ''}</td>
                <td>${item.nickname || item.bietdanh || '-'}</td>
                <td>${item.position || item.description || item.vitri || 'VĐV bơi lội'}</td>
                <td>${(item.achievements || '').substring(0, 50)}${(item.achievements || '').length > 50 ? '...' : ''}</td>
                <td class="action-buttons">
                    <button class="btn-edit-admin" onclick="editItem('athlete', ${item.athlete_id || item.id})">Sửa</button>
                    <button class="btn-delete-admin" onclick="deleteItem('athletes', ${item.athlete_id || item.id})">Xóa</button>
                </td>
            </tr>
            `;
        }).join('');
        
    } catch (e) { 
        console.error('Lỗi tải tuyển thủ:', e);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;color:red">
                    Lỗi tải dữ liệu: ${e.message}<br>
                    <small>Kiểm tra console để biết chi tiết</small>
                </td>
            </tr>
        `;
    }
}

window.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        console.log('Ảnh bị lỗi:', e.target.src);
        e.target.src = 'https://placehold.co/100x100?text=No+Image';
    }
}, true)

// --- 2. QUẢN LÝ SẢN PHẨM ---
async function loadProducts() {
    const tbody = document.getElementById('product-list') || document.querySelector('tbody');
    try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có sản phẩm nào</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => {
            // Xác định ảnh
            const imgUrl = fixImgPath(item.image_url, 'product');
            
            return `
            <tr>
                <td>${item.product_id}</td>
                <td>
                    <img src="${imgUrl}" 
                         width="50" height="50" 
                         style="object-fit: cover; border-radius: 4px;"
                         onerror="this.src='https://placehold.co/50x50?text=Err'">
                </td>
                <td style="font-weight:bold">${item.product_name}</td>
                <td>${item.category || 'Chưa phân loại'}</td>
                <td style="color:#d32f2f">${formatCurrency(item.price_vnd)}</td>
                <td>${item.stock}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="editItem('product', '${item.product_id}')">Sửa</button>
                    <button class="btn-action btn-delete" onclick="deleteItem('products', '${item.product_id}')">Xóa</button>
                </td>
            </tr>
        `}).join('');
    } catch (e) { 
        console.error(e); 
        tbody.innerHTML = `<tr><td colspan="7" style="color:red">Lỗi tải dữ liệu: ${e.message}</td></tr>`;
    }
}

// --- 3. QUẢN LÝ ĐƠN HÀNG ---
async function loadOrders() {
    const tbody = document.querySelector('tbody');
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Lỗi tải đơn hàng');
        
        const data = await res.json();

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Chưa có đơn hàng nào</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>#${item.order_id}</td>
                <td>
                    <b>${item.shipping_name}</b><br>
                    <span style="font-size: 0.8em; color: #666;">(User: ${item.user_name || 'Khách'})</span>
                </td>
                <td>${item.shipping_phone}</td>
                
                <td style="text-align: center;">
                    <button class="view-btn" onclick="viewOrderDetail(${item.order_id})">
                        👁️ Xem chi tiết
                    </button>
                </td>
                
                <td style="color: #d32f2f; font-weight: bold;">${formatCurrency(item.total_amount)}</td>
                <td>${item.shipping_address}</td>
                <td>
                    <select onchange="updateOrderStatus(${item.order_id}, this.value, this)" 
                            style="padding: 5px; border-radius: 4px; border: 1px solid #ccc; 
                            background: ${getStatusColor(item.status)}; color: white; font-weight: bold;">
                        <option value="pending" ${item.status === 'pending' ? 'selected' : ''} style="color:black">Chờ duyệt</option>
                        <option value="confirmed" ${item.status === 'confirmed' ? 'selected' : ''} style="color:black">Đã duyệt</option>
                        <option value="shipped" ${item.status === 'shipped' ? 'selected' : ''} style="color:black">Đang giao</option>
                        <option value="completed" ${item.status === 'completed' ? 'selected' : ''} style="color:black">Hoàn thành</option>
                        <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''} style="color:black">Đã hủy</option>
                    </select>
                </td>
            </tr>
        `).join('');
    } catch (e) { 
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red">Lỗi kết nối server!</td></tr>';
    }
}

// Hàm phụ: Màu sắc cho trạng thái đơn hàng
function getStatusColor(status) {
    switch(status) {
        case 'pending': return '#ff9800'; // Cam
        case 'confirmed': return '#2196f3'; // Xanh dương
        case 'shipped': return '#9c27b0'; // Tím
        case 'completed': return '#4caf50'; // Xanh lá
        case 'cancelled': return '#f44336'; // Đỏ
        default: return '#777';
    }
}

// --- 4. QUẢN LÝ SỰ KIỆN ---
async function loadEvents() {
    const tbody = document.querySelector('tbody');
    try {
        const res = await fetch(`${API_BASE}/events`);
        const data = await res.json();
        
        console.log('Dữ liệu sự kiện:', data);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Chưa có sự kiện nào</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => {
            // TÍNH TOÁN TRẠNG THÁI TỰ ĐỘNG
            const eventDate = new Date(item.event_date);
            const now = new Date();
            // Nếu ngày sự kiện lớn hơn hoặc bằng ngày hiện tại -> Sắp diễn ra
            const isUpcoming = eventDate >= now; 
            
            const statusText = isUpcoming ? 'Sắp diễn ra' : 'Đã qua';
            const statusStyle = isUpcoming ? 'font-weight:bold; color:green' : 'color:gray';

            return `
            <tr>
                <td>SK${item.event_id}</td>
                <td>${item.title}</td>
                <td>${formatDate(item.event_date)} ${item.event_time ? item.event_time.substring(0,5) : ''}</td>
                <td>${item.location}</td>
                <td>${item.description?.substring(0, 50)}...</td>
                <td style="${statusStyle}">${statusText}</td>
    
                <td class="action-buttons">
                    <button class="btn-edit-admin" onclick="editItem('event', ${item.event_id})">Sửa</button>
                    <button class="btn-delete-admin" onclick="deleteItem('events', ${item.event_id})">Xóa</button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (e) { 
        console.error('Lỗi tải sự kiện:', e);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red">Lỗi tải dữ liệu: ${e.message}</td></tr>`;
    }
}

// --- 5. QUẢN LÝ TIN TỨC ---
async function loadArticles() {
    const tbody = document.getElementById('news-list') || document.querySelector('tbody');
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/articles`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Dữ liệu bài báo:', data);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Chưa có bài báo nào</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => {
            // Xử lý file URL
            let fileLink = 'Không có';
            if (item.file_url) {
                const cleanPath = item.file_url.includes('uploads/') ? 
                    item.file_url.split('uploads/')[1] : item.file_url;
                fileLink = `<a href="http://localhost:3000/uploads/${cleanPath}" 
                               target="_blank" 
                               class="file-link"
                               style="color:#2196F3; text-decoration:none;">
                               📄 Tải xuống
                           </a>`;
            }
            
            // Xử lý ảnh thumbnail
            let imgPreview = '🖼️';
            if (item.image_url) {
                const cleanImgPath = item.image_url.includes('uploads/') ? 
                    item.image_url.split('uploads/')[1] : item.image_url;
                imgPreview = `
                    <a href="http://localhost:3000/uploads/${cleanImgPath}" 
                       target="_blank" 
                       title="Xem ảnh"
                       style="color:#4CAF50; text-decoration:none;">
                       📷
                    </a>`;
            }
            
            // Hiển thị lời dẫn ngắn
            const summary = item.summary || '';
            const shortSummary = summary.length > 50 ? 
                summary.substring(0, 50) + '...' : summary;

            return `
            <tr>
                <td>${item.article_id || item.id || ''}</td>
                <td>
                    ${imgPreview}
                    <strong>${item.title || ''}</strong>
                </td>
                <td>${item.author || ''}</td>
                <td title="${summary}">${shortSummary}</td>
                <td style="text-align:center">${fileLink}</td>
                <td>
                    <span class="category-badge" style="
                        background: #e3f2fd; 
                        color: #1976d2; 
                        padding: 3px 8px; 
                        border-radius: 12px; 
                        font-size: 12px;">
                        ${item.category || 'Chưa phân loại'}
                    </span>
                </td>
                <td>${formatDate(item.published_at)}</td>
                <td class="action-buttons">
                    <button class="btn-edit-admin" 
                            onclick="editItem('article', '${item.article_id || item.id}')">
                        ✏️ Sửa
                    </button>
                    <button class="btn-delete-admin" 
                            onclick="deleteItem('articles', '${item.article_id || item.id}')">
                        🗑️ Xóa
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (e) { 
        console.error('Lỗi tải bài báo:', e);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;color:red">
                    Lỗi tải dữ liệu: ${e.message}<br>
                    <small>Kiểm tra console để biết chi tiết</small>
                </td>
            </tr>
        `;
    }
}

// --- SỬA HÀM EDITITEM ---
function editItem(type, id) {
    let page = '';
    if (type === 'product') page = 'adminaddsp.html';
    if (type === 'athlete') page = 'addtt_admin.html';  
    if (type === 'event') page = 'adminaddsk.html';
    if (type === 'article') page = 'adminaddtt.html';  // Trang sửa bài báo
    
    if (page) {
        window.location.href = `${page}?id=${id}`;
    } else {
        console.error('Không tìm thấy trang sửa cho loại:', type);
    }
}

// --- SỬA HÀM DELETEITEM (nếu cần) ---
async function deleteItem(endpoint, id) {
    if (!confirm('Bạn có chắc chắn muốn xóa không?')) return;
    try {
        const token = localStorage.getItem('token'); 
        const res = await fetch(`${API_BASE}/${endpoint}/${id}`, { 
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await res.json();
        
        if (res.ok) {
            alert('Xóa thành công!');
            location.reload();
        } else {
            throw new Error(result.message || 'Lỗi xóa từ server');
        }
    } catch (e) { 
        console.error(e);
        alert('Không xóa được: ' + e.message); 
    }
}

// --- CÁC HÀM CHUNG ---

// Hàm xóa
async function deleteItem(endpoint, id) {
    if (!confirm('Bạn có chắc chắn muốn xóa không?')) return;
    try {
        // 1. Lấy token từ localStorage
        const token = localStorage.getItem('token'); 

        const res = await fetch(`${API_BASE}/${endpoint}/${id}`, { 
            method: 'DELETE',
            // 2. QUAN TRỌNG: Phải gửi kèm Token ở đây
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Lỗi xóa từ server');
        }

        alert('Xóa thành công!');
        location.reload();

    } catch (e) { 
        console.error(e);
        alert('Không xóa được: ' + e.message); 
    }
}

// Hàm chuyển trang sửa (Bà cần tạo các file html sửa tương ứng nha)
function editItem(type, id) {
    let page = '';
    if (type === 'product') page = 'adminaddsp.html';
    if (type === 'athlete') page = 'addtt_admin.html';  
    if (type === 'event') page = 'adminaddsk.html';
    if (type === 'article') page = 'adminaddtt.html';
    
    if (page) {
        window.location.href = `${page}?id=${id}`;
    } else {
        console.error('Không tìm thấy trang sửa cho loại:', type);
    }
}

// Hàm cập nhật trạng thái đơn hàng
async function updateOrderStatus(orderId, newStatus, element) {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (res.ok) {
            // --- ĐOẠN CODE QUAN TRỌNG ĐỂ ĐỔI MÀU ---
            if (element) {
                // Gọi lại hàm lấy màu và gán ngay lập tức vào background
                element.style.background = getStatusColor(newStatus);
            }
            alert('Cập nhật trạng thái thành công!');
        } else {
            alert('Lỗi cập nhật!');
        }
    } catch (e) { 
        console.error(e);
        alert('Lỗi kết nối!'); 
    }
}

function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
        alert('Vui lòng đăng nhập quyền Admin!');
        window.location.href = '../đn/login.html';
    }
}

// --- HÀM XEM CHI TIẾT ĐƠN HÀNG ---
async function viewOrderDetail(orderId) {
    try {
        const token = localStorage.getItem('token');
        // Gọi API lấy chi tiết đơn hàng (Giống bên User)
        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        
        // Xử lý dữ liệu trả về (cấu trúc có thể là data.order hoặc data trực tiếp)
        const order = data.order || data.data || data; 

        if (!order) {
            alert("Không tìm thấy dữ liệu đơn hàng!");
            return;
        }

        // 1. Điền thông tin chung
        document.getElementById('modal-order-id').innerText = order.order_id || order.id;
        document.getElementById('modal-name').innerText = order.shipping_name || order.full_name;
        document.getElementById('modal-phone').innerText = order.shipping_phone || order.phone;
        document.getElementById('modal-address').innerText = order.shipping_address || order.address;
        document.getElementById('modal-date').innerText = formatDate(order.order_date || order.created_at);
        document.getElementById('modal-total').innerText = formatCurrency(order.total_amount || order.total);

        // 2. Điền danh sách sản phẩm
        const itemsBody = document.getElementById('modal-items');
        itemsBody.innerHTML = ''; // Xóa cũ

        const items = order.items || [];
        if (items.length > 0) {
            itemsBody.innerHTML = items.map(item => {
                const total = (item.unit_price || item.price) * item.quantity;
                // Dùng hàm fixImgPath có sẵn để lấy ảnh
                const imgUrl = fixImgPath(item.image_url, 'product'); 
                
                return `
                    <tr>
                        <td>
                            <img src="${imgUrl}" width="50" height="50" style="object-fit:cover; border-radius:4px;">
                        </td>
                        <td>
                            <b>${item.product_name}</b><br>
                            <small>Mã: ${item.product_id}</small>
                        </td>
                        <td>${formatCurrency(item.unit_price || item.price)}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="font-weight: bold;">${formatCurrency(total)}</td>
                    </tr>
                `;
            }).join('');
        } else {
            itemsBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Không có sản phẩm nào</td></tr>';
        }

        // 3. Hiển thị Modal
        document.getElementById('orderModal').style.display = "block";

    } catch (e) {
        console.error(e);
        alert("Lỗi tải chi tiết đơn hàng: " + e.message);
    }
}

// Hàm đóng Modal
function closeModal() {
    document.getElementById('orderModal').style.display = "none";
}

// Đóng modal khi click ra ngoài vùng nội dung
window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}