// detail.js - PHIÊN BẢN ĐÃ SỬA (THÊM HÀM THIẾU)

const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Trang chi tiết đang khởi chạy...');
    
    // Lấy ID sản phẩm
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
        loadProductDetail(productId);
    } else {
        alert('Không tìm thấy ID sản phẩm!');
    }
    
    // Gắn sự kiện thêm vào giỏ
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCart);
    }
});

// ==================== HÀM BỊ THIẾU ====================
// Hàm tải chi tiết sản phẩm
function loadProductDetail(id) {
    console.log('🔄 Đang tải chi tiết sản phẩm ID:', id);
    
    fetch(`${API_BASE_URL}/products/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(product => {
            console.log('✅ Dữ liệu sản phẩm:', product);
            renderProductDetail(product);
        })
        .catch(error => {
            console.error('❌ Lỗi tải sản phẩm:', error);
            document.getElementById('product-name').innerText = 'Lỗi tải sản phẩm';
            document.getElementById('product-desc').innerText = 'Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.';
            
            // Hiển thị ảnh placeholder
            document.getElementById('main-img').src = 'https://placehold.co/500x500?text=Lỗi+tải+sản+phẩm';
        });
}
// ==================== END HÀM BỊ THIẾU ====================

// --- HÀM THÊM VÀO GIỎ HÀNG - ĐÚNG VỚI BACKEND CỦA BẠN ---
async function handleAddToCart() {
    console.log('=== BẮT ĐẦU THÊM VÀO GIỎ ===');
    
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    if (!token) {
        alert('⚠️ Vui lòng đăng nhập để thêm vào giỏ hàng!');
        window.location.href = '../đn/login.html';
        return;
    }
    
    // 2. KIỂM TRA: ĐỒNG BỘ GIỎ HÀNG TỪ BACKEND TRƯỚC
    await syncCartFromBackend(token);
    
    // 3. Kiểm tra size
    const sizeBtn = document.querySelector('.size-btn.active');
    if (!sizeBtn) {
        alert('Vui lòng chọn Kích cỡ (Size) trước!');
        return;
    }
    
    // 4. Lấy số lượng
    const qtyInput = document.querySelector('.quantity-selector input');
    let quantity = parseInt(qtyInput?.value) || 1;
    if (quantity < 1) quantity = 1;
    
    // 5. Kiểm tra thông tin sản phẩm
    if (!window.currentProductInfo || !window.currentProductInfo.id) {
        alert('Lỗi: Không có thông tin sản phẩm!');
        return;
    }
    
    const productId = window.currentProductInfo.id;
    
    // 6. KIỂM TRA: Sản phẩm đã có trong giỏ chưa?
    const currentCart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const existingItem = currentCart.find(item => item.id == productId);
    
    if (existingItem) {
        // Nếu đã có, hỏi người dùng
        const confirmUpdate = confirm(`"${existingItem.name}" đã có trong giỏ hàng (${existingItem.quantity} cái). Bạn có muốn thêm ${quantity} cái nữa không?`);
        
        if (!confirmUpdate) {
            return; // Người dùng không muốn thêm
        }
    }
    
    // 7. Gọi Backend API - ĐÚNG ENDPOINT CỦA BẠN
    try {
        // Hiển thị loading
        const addBtn = document.querySelector('.add-to-cart-btn');
        const originalText = addBtn.innerHTML;
        addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang thêm...';
        addBtn.disabled = true;
        
        // Gọi API: POST /api/cart/add
        const response = await fetch(`${API_BASE_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: productId,  // ĐÚNG field name backend cần
                quantity: quantity     // ĐÚNG field name backend cần
            })
        });
        
        console.log('📡 Response status:', response.status);
        
        // Parse response
        let result;
        try {
            result = await response.json();
            console.log('📨 Response data:', result);
        } catch (jsonError) {
            console.error('Lỗi parse JSON:', jsonError);
            result = { message: 'Lỗi server' };
        }
        
        // Xử lý kết quả
        if (response.ok) {
            // THÀNH CÔNG
            console.log('✅ Đã thêm vào giỏ hàng backend');
            
            // Đồng bộ localStorage
            await syncCartFromBackend(token);
            
            // Cập nhật header
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }
            
            // Thông báo
            alert(`✅ ${result.message || 'Đã thêm vào giỏ hàng!'}`);
            
            // Hiệu ứng UI
            addBtn.innerHTML = '✅ Đã thêm!';
            addBtn.style.backgroundColor = '#4CAF50';
            
            setTimeout(() => {
                addBtn.innerHTML = originalText;
                addBtn.style.backgroundColor = '';
                addBtn.disabled = false;
            }, 1500);
            
        } else {
            // LỖI TỪ BACKEND
            console.error('❌ Backend error:', result);
            const errorMsg = result.message || `Lỗi ${response.status}`;
            alert(`❌ ${errorMsg}`);
            
            addBtn.innerHTML = originalText;
            addBtn.disabled = false;
        }
        
    } catch (networkError) {
        console.error('❌ Lỗi kết nối:', networkError);
        alert('❌ Lỗi kết nối đến server. Vui lòng thử lại!');
        
        const addBtn = document.querySelector('.add-to-cart-btn');
        addBtn.innerHTML = '🛒 Thêm vào Giỏ Hàng';
        addBtn.disabled = false;
    }
}

// Đồng bộ giỏ hàng từ backend về localStorage
async function syncCartFromBackend(token) {
    try {
        console.log('🔄 Đang đồng bộ từ backend...');
        
        // Gọi API: GET /api/cart
        const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const backendItems = await response.json();
            
            console.log('🔥 ĐÃ CHẠY CODE MỚI, DATA LÀ:', backendItems);

            // Chuyển đổi format backend → frontend
            const localItems = backendItems.map(item => ({
                id: item.product_id,
                name: item.product_name,
                price: item.price_vnd,
                quantity: item.quantity,
                // Backend của bạn không lưu size trong cart_items
                size: 'M', // Mặc định
                image: item.image_url || 'images/default.jpg'
            }));
            
            // Lưu vào localStorage
            localStorage.setItem('shoppingCart', JSON.stringify(localItems));
            console.log('💾 Đã lưu vào localStorage:', localItems);
        }
    } catch (error) {
        console.error('Lỗi đồng bộ:', error);
    }
}

// Hàm hiển thị dữ liệu lên giao diện
function renderProductDetail(product) {
    if (!product) return;

    // Lưu thông tin sản phẩm hiện tại
    window.currentProductInfo = {
        id: product.product_id || product.id,
        name: product.product_name,
        price: product.price_vnd || product.price,
        image: product.image_url || 'images/default.jpg'
    };

    // 1. Điền Tên
    const productNameElement = document.getElementById('product-name');
    if (productNameElement) {
        productNameElement.innerText = product.product_name || 'Không có tên';
    }

    // 2. Điền Giá
    const priceElement = document.getElementById('product-price');
    if (priceElement) {
        const price = parseInt(product.price_vnd || product.price || 0);
        const formattedPrice = price.toLocaleString('vi-VN');
        priceElement.innerText = formattedPrice + ' VNĐ';
    }

    // 3. Điền Mô tả
    const descElement = document.getElementById('product-desc');
    if (descElement) {
        const desc = product.description || "Chưa có mô tả cho sản phẩm này.";
        descElement.innerText = desc;
    }

    // 4. Xử lý Ảnh
    const img1 = product.image_url || 'https://placehold.co/500x500?text=No+Image';
    const img2 = product.image_url_2 || 'https://placehold.co/500x500?text=View+2'; 

    // Gán ảnh vào Ảnh Lớn
    const mainImg = document.getElementById('main-img');
    if (mainImg) {
        mainImg.src = img1;
        mainImg.alt = product.product_name || 'Ảnh sản phẩm';
    }

    // Gán ảnh vào Thumbnail nhỏ
    const thumb1 = document.getElementById('thumb-1');
    if (thumb1) {
        thumb1.src = img1;
        thumb1.alt = 'View 1';
        thumb1.classList.add('active-thumb');
    }
    
    const thumb2 = document.getElementById('thumb-2');
    if (thumb2) {
        thumb2.src = img2;
        thumb2.alt = 'View 2';
        thumb2.classList.remove('active-thumb');
    }
}

// --- CHỨC NĂNG GIAO DIỆN (UI) ---

// 1. Hàm chọn Size (S, M, L)
function selectSize(btn) {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// 2. Hàm chuyển đổi ảnh khi click vào Thumbnail
function changeImage(thumbElement) {
    const newSrc = thumbElement.src;
    const mainImg = document.getElementById('main-img');
    if (mainImg) {
        mainImg.src = newSrc;
    }
    
    document.querySelectorAll('.thumbnail-gallery img').forEach(img => {
        img.classList.remove('active-thumb');
    });
    thumbElement.classList.add('active-thumb');
}


// Export các hàm
if (typeof window !== 'undefined') {
    window.selectSize = selectSize;
    window.changeImage = changeImage;
    window.handleAddToCart = handleAddToCart;
}