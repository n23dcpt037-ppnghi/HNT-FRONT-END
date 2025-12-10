const API_URL = 'http://localhost:3000/api';

// Hàm tiện ích: Định dạng tiền Việt Nam (VND)
const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Hàm tiện ích: Kiểm tra đăng nhập
const checkLogin = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Vui lòng đăng nhập để tiếp tục!");
        window.location.href = "login.html";
        return null;
    }
    return token;
};

// ==============================================
// 1. LOGIC TRANG CHỦ (HIỂN THỊ SẢN PHẨM)
// ==============================================
async function loadProducts() {
    const productContainer = document.getElementById('product-list'); // ID của thẻ chứa danh sách SP
    if (!productContainer) return; // Nếu không phải trang chủ thì dừng

    try {
        const res = await fetch(`${API_URL}/products`);
        const products = await res.json();

        productContainer.innerHTML = ''; // Xóa dữ liệu mẫu

        if (products.length === 0) {
            productContainer.innerHTML = '<p class="empty-msg">Chưa có sản phẩm nào.</p>';
            return;
        }

        products.forEach(product => {
            // Thay đổi HTML bên dưới cho khớp với thiết kế của bạn
            const html = `
                <div class="product-card">
                    <img src="${product.image_url || 'https://via.placeholder.com/150'}" alt="${product.product_name}">
                    <h3>${product.product_name}</h3>
                    <p class="price">${formatMoney(product.price_vnd)}</p>
                    <button class="add-btn" onclick="addToCart(${product.product_id})">
                        <i class="fa fa-cart-plus"></i> Thêm vào giỏ
                    </button>
                </div>
            `;
            productContainer.innerHTML += html;
        });
    } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
        productContainer.innerHTML = '<p class="error-msg">Lỗi kết nối Server!</p>';
    }
}

// Hàm thêm vào giỏ hàng (Gọi API)
async function addToCart(productId) {
    const token = checkLogin();
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ Đã thêm vào giỏ hàng thành công!");
            // Có thể thêm logic cập nhật số lượng trên icon giỏ hàng ở đây
        } else {
            alert(`❌ Lỗi: ${data.message}`);
        }
    } catch (error) {
        console.error("Lỗi thêm giỏ hàng:", error);
        alert("Lỗi kết nối Server.");
    }
}

// ==============================================
// 2. LOGIC TRANG GIỎ HÀNG
// ==============================================
async function loadCart() {
    const cartContainer = document.getElementById('cart-items'); // ID của tbody hoặc div chứa items
    const totalElement = document.getElementById('total-price'); // ID hiển thị tổng tiền
    
    if (!cartContainer) return; // Nếu không phải trang giỏ hàng thì dừng

    const token = checkLogin();
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cartItems = await res.json();

        cartContainer.innerHTML = '';
        let total = 0;

        if (cartItems.length === 0) {
            cartContainer.innerHTML = '<tr><td colspan="5" style="text-align:center">Giỏ hàng trống.</td></tr>';
            if (totalElement) totalElement.innerText = formatMoney(0);
            return;
        }

        cartItems.forEach(item => {
            const itemTotal = item.price_vnd * item.quantity;
            total += itemTotal;

            // HTML hiển thị 1 dòng trong giỏ hàng (Sửa lại cho khớp với table của bạn)
            const html = `
                <tr>
                    <td><img src="${item.image_url}" width="50"></td>
                    <td>${item.product_name}</td>
                    <td>${formatMoney(item.price_vnd)}</td>
                    <td>
                        <input type="number" value="${item.quantity}" min="1" readonly style="width: 50px">
                    </td>
                    <td>${formatMoney(itemTotal)}</td>
                    <td>
                        <button class="remove-btn" onclick="removeFromCart(${item.product_id})">Xóa</button>
                    </td>
                </tr>
            `;
            cartContainer.innerHTML += html;
        });

        if (totalElement) totalElement.innerText = formatMoney(total);

    } catch (error) {
        console.error("Lỗi tải giỏ hàng:", error);
    }
}

// Hàm xóa sản phẩm
async function removeFromCart(productId) {
    const token = checkLogin();
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
        const res = await fetch(`${API_URL}/cart/remove`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId })
        });

        if (res.ok) {
            loadCart(); // Tải lại giỏ hàng để cập nhật giao diện
        } else {
            alert("Lỗi khi xóa sản phẩm.");
        }
    } catch (error) {
        console.error(error);
    }
}

// Hàm thanh toán (Checkout)
async function checkout() {
    const token = checkLogin();
    if (!token) return;

    // Lấy thông tin giao hàng từ form (Sửa ID cho đúng với HTML của bạn)
    const name = document.getElementById('shipping-name')?.value || "Khách hàng";
    const address = document.getElementById('shipping-address')?.value || "Tại cửa hàng";
    const phone = document.getElementById('shipping-phone')?.value || "0000000000";

    if (!confirm("Xác nhận đặt hàng?")) return;

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                shipping_name: name,
                shipping_address: address,
                shipping_phone: phone
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert("🎉 Đặt hàng thành công! Vui lòng kiểm tra email.");
            window.location.href = "index.html"; // Quay về trang chủ
        } else {
            alert(`Lỗi: ${data.message}`);
        }
    } catch (error) {
        console.error("Lỗi đặt hàng:", error);
        alert("Lỗi kết nối Server.");
    }
}

// ==============================================
// KHỞI CHẠY (Khi trang web load xong)
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    loadProducts(); // Tự động chạy nếu ở trang chủ
    loadCart();     // Tự động chạy nếu ở trang giỏ hàng
    
    // Gán sự kiện cho nút Thanh toán (nếu có)
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
});