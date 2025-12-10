// CNPM CK/scripts/giohang.js - VERSION FINAL WITH IMAGE MAPPING

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api';
    
    const cartBody = document.querySelector('tbody'); 
    const totalProductSpan = document.getElementById('total-product-price');
    const shippingFeeSpan = document.getElementById('shipping-fee');
    const finalTotalSpan = document.getElementById('final-total-price');
    const SHIPPING_FEE = 30000;

    // BIẾN LƯU TRỮ ẢNH THEO PRODUCT_ID
    let productImageCache = {};

    function formatCurrency(amount) {
        return parseInt(amount).toLocaleString('vi-VN') + ' VND';
    }

    function updateTotals(totalProductPrice = 0) {
        if (totalProductSpan) totalProductSpan.textContent = formatCurrency(totalProductPrice);
        if (shippingFeeSpan) shippingFeeSpan.textContent = formatCurrency(SHIPPING_FEE);
        if (finalTotalSpan) finalTotalSpan.textContent = formatCurrency(totalProductPrice + SHIPPING_FEE);
    }

    // HÀM QUAN TRỌNG: TẢI TẤT CẢ SẢN PHẨM ĐỂ LẤY ẢNH
    async function loadAllProductsForImages() {
        try {
            console.log('🔄 Đang tải danh sách sản phẩm để lấy ảnh...');
            
            const response = await fetch(`${API_BASE_URL}/products`);
            if (response.ok) {
                const products = await response.json();
                
                // Tạo cache: product_id → image_url
                products.forEach(product => {
                    if (product.product_id && product.image_url) {
                        productImageCache[product.product_id] = product.image_url;
                    }
                });
                
                console.log('✅ Đã load ảnh cho sản phẩm:', productImageCache);
                console.log('📊 Tổng số sản phẩm có ảnh:', Object.keys(productImageCache).length);
                
                // Render lại giỏ hàng với ảnh đã có
                renderCart();
                
            } else {
                console.error('❌ Lỗi tải danh sách sản phẩm');
            }
        } catch (error) {
            console.error('❌ Lỗi network khi tải sản phẩm:', error);
        }
    }

    // HÀM FIX ẢNH - DÙNG CACHE ĐÃ TẢI
    function fixImagePath(productId, productName) {
        console.log(`🖼️ Getting image for: ${productName} (ID: ${productId})`);
        
        // 1. Ưu tiên: Lấy từ cache (image_url từ API products)
        if (productImageCache[productId]) {
            const imageUrl = productImageCache[productId];
            console.log(`   Found in cache: ${imageUrl}`);
            
            // Xử lý đường dẫn
            if (imageUrl.startsWith('http')) {
                return imageUrl; // URL đầy đủ
            } else if (imageUrl.startsWith('images/')) {
                // "images/ao1.jpg" → "../sp_home/images/ao1.jpg"
                return `../sp_home/${imageUrl}`;
            } else {
                // "ao1.jpg" → "../sp_home/images/ao1.jpg"
                return `../sp_home/images/${imageUrl}`;
            }
        }
        
        // 2. Fallback: Mapping cứng theo ID (cho 5 sản phẩm hiện tại)
        const hardcodedMap = {
            1: 'images/ao1.jpg',       // Áo Thun CLB
            2: 'images/non1.png',      // Nón bơi CLB HNT
            3: 'images/khan.jpg',      // Khăn tấm CLB HNT
            4: 'images/binh2.png',     // Bình nước CLB HNT
            5: 'images/hoodie.jpg'     // Áo Hoodie CLB HNT
        };
        
        if (hardcodedMap[productId]) {
            console.log(`   Using hardcoded map: ${hardcodedMap[productId]}`);
            return `../sp_home/${hardcodedMap[productId]}`;
        }
        
        // 3. Fallback cuối: Dựa trên tên sản phẩm
        const name = productName.toLowerCase();
        
        if (name.includes('hoodie')) {
            return '../sp_home/images/hoodie.jpg';
        } else if (name.includes('áo thun') || name.includes('ao thun')) {
            return '../sp_home/images/ao1.jpg';
        } else if (name.includes('nón') || name.includes('non')) {
            return '../sp_home/images/non1.png';
        } else if (name.includes('khăn') || name.includes('khan')) {
            return '../sp_home/images/khan.jpg';
        } else if (name.includes('bình') || name.includes('binh')) {
            return '../sp_home/images/binh2.png';
        }
        
        // 4. Placeholder
        console.warn(`⚠️ No image found for product ${productId}`);
        return 'https://placehold.co/100x100/4a90e2/ffffff?text=HNT';
    }

    // HÀM XÓA SẢN PHẨM
    async function deleteCartItem(itemIndex, productId, productName) {
        try {
            const token = localStorage.getItem('token');
            
            // 1. Xóa localStorage
            let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
            if (itemIndex >= 0 && itemIndex < cart.length) {
                cart.splice(itemIndex, 1);
                localStorage.setItem('shoppingCart', JSON.stringify(cart));
                console.log(`🗑️ Đã xóa "${productName}" khỏi localStorage`);
            }
            
            // 2. Xóa backend
            if (token && productId) {
                try {
                    const response = await fetch(`${API_BASE_URL}/cart/remove`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ productId: productId })
                    });
                    
                    if (response.ok) {
                        console.log('✅ Đã xóa khỏi backend');
                    }
                } catch (backendError) {
                    console.warn('⚠️ Lỗi backend delete:', backendError);
                }
            }
            
            // 3. Cập nhật UI
            renderCart();
            if (typeof updateCartCount === 'function') updateCartCount();
            
            alert(`Đã xóa "${productName}" khỏi giỏ hàng!`);
            
        } catch (error) {
            console.error('Lỗi khi xóa:', error);
            alert('Đã xóa khỏi giỏ hàng cục bộ!');
        }
    }

    // HÀM RENDER - VỚI ẢNH CHÍNH XÁC
    function renderCart() {
        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        console.log('🛒 Rendering cart with', cart.length, 'items');
        
        cartBody.innerHTML = '';
        
        if (cart.length === 0) {
            cartBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Giỏ hàng trống. <a href="../sp_home/danhmuc_sp.html">Mua ngay</a></td></tr>';
            updateTotals(0);
            return;
        }
        
        let totalProductPrice = 0;
        
        cart.forEach((item, index) => {
            // Fix encoding
            const fixedName = fixVietnameseEncoding(item.name);
            const itemTotal = item.price * item.quantity;
            totalProductPrice += itemTotal;
            
            // Lấy ảnh CHÍNH XÁC
            const imgSrc = fixImagePath(item.id, fixedName);
            console.log(`   ${fixedName}: ${imgSrc}`);
            
            const row = document.createElement('tr');
            row.classList.add('cart-item-row');
            row.innerHTML = `
                <td class="col-image">
                    <img src="${imgSrc}" alt="${fixedName}" 
                         style="width: 100px; height: 100px; object-fit: cover;"
                         onerror="handleImageError(this, ${item.id}, '${fixedName}')">
                </td>
                <td class="col-info">
                    <p class="item-name">${fixedName}</p>
                    <p class="item-option">Size: ${item.size || 'M'} | Giá: ${formatCurrency(item.price)}</p>
                </td>
                <td class="col-qty">
                    <input type="number" value="${item.quantity}" min="1" class="qty-input" 
                           data-index="${index}" data-product-id="${item.id}">
                </td>
                <td class="col-price item-total-price">${formatCurrency(itemTotal)}</td>
                <td class="col-select-action">
                    <button class="btn-delete-single" 
                            data-index="${index}" 
                            data-product-id="${item.id}"
                            data-product-name="${fixedName}">
                        Xóa
                    </button>
                </td>
            `;
            cartBody.appendChild(row);
        });
        
        updateTotals(totalProductPrice);
        
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        }
    }

    // HÀM XỬ LÝ LỖI ẢNH
    function handleImageError(imgElement, productId, productName) {
        console.error(`❌ Image failed: ${imgElement.src}`);
        
        // Thử đường dẫn khác
        const alternativePaths = [
            `../sp_home/images/product-${productId}.jpg`,
            `../sp_home/images/${productId}.jpg`,
            `https://placehold.co/100x100/4a90e2/ffffff?text=${encodeURIComponent(productName.substring(0, 10))}`
        ];
        
        // Thử từng đường dẫn
        let currentIndex = 0;
        function tryNextImage() {
            if (currentIndex < alternativePaths.length) {
                imgElement.src = alternativePaths[currentIndex];
                currentIndex++;
            }
        }
        
        imgElement.onerror = tryNextImage;
        tryNextImage();
    }

    // HÀM FIX ENCODING
    function fixVietnameseEncoding(text) {
        if (!text) return '';
        
        const fixes = {
            'Ã¡': 'á', 'Ã ': 'à', 'Ã£': 'ã', 'Ã¢': 'â', 'Ã¤': 'ä',
            'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
            'Ã­': 'í', 'Ã¬': 'ì', 'Ã®': 'î', 'Ã¯': 'ï',
            'Ã³': 'ó', 'Ã²': 'ò', 'Ãµ': 'õ', 'Ã´': 'ô', 'Ã¶': 'ö',
            'Ãº': 'ú', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã¼': 'ü',
            'Ã½': 'ý', 'Ã¿': 'ÿ',
            'Ã': 'í', 'Â': '', 'Ã': 'à',
            'MÂu': 'Mẫu', 'M6': 'Mới', 't5t': 'tốt', 
            'Gu': 'gọn', 'nuéc': 'nước', 'nudcnhanh': 'nước nhanh',
            'dung tich': 'dung tích', 'Thiét': 'Thiết', 'ké': 'kế'
        };
        
        let fixedText = text;
        for (const [wrong, correct] of Object.entries(fixes)) {
            fixedText = fixedText.replace(new RegExp(wrong, 'gi'), correct);
        }
        
        return fixedText;
    }

    // NÚT TIẾP TỤC MUA SẮM
    const btnContinue = document.getElementById('btn-continue-shopping');
    if (btnContinue) {
        btnContinue.addEventListener('click', () => {
            window.location.href = '../sp_home/danhmuc_sp.html';
        });
    }

    // NÚT ĐẶT HÀNG
    const btnOrder = document.getElementById('btn-order');
    if (btnOrder) {
        btnOrder.addEventListener('click', () => {
            const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
            
            if (cart.length === 0) {
                alert('Giỏ hàng trống! Vui lòng mua thêm sản phẩm.');
                return;
            }
            
            window.location.href = 'thanhtoan.html';
        });
    }

    // SỰ KIỆN XÓA
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-delete-single')) {
            const index = e.target.getAttribute('data-index');
            const productId = e.target.getAttribute('data-product-id');
            const productName = e.target.getAttribute('data-product-name');
            
            if (confirm(`Bạn có chắc muốn xóa "${productName}" khỏi giỏ hàng?`)) {
                deleteCartItem(parseInt(index), productId, productName);
            }
        }
    });
    
    // SỰ KIỆN THAY ĐỔI SỐ LƯỢNG
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('qty-input')) {
            const index = e.target.getAttribute('data-index');
            const newQty = parseInt(e.target.value) || 1;
            
            if (newQty >= 1) {
                let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
                if (index >= 0 && index < cart.length) {
                    cart[index].quantity = newQty;
                    localStorage.setItem('shoppingCart', JSON.stringify(cart));
                    renderCart();
                }
            }
        }
    });

    // HÀM ĐỒNG BỘ TỪ BACKEND
    async function syncCartFromBackend() {
        const token = localStorage.getItem('token');
        
        try {
            if (token) {
                console.log('🔄 Đồng bộ giỏ hàng từ backend...');
                const response = await fetch(`${API_BASE_URL}/cart`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const backendItems = await response.json();
                    console.log('📦 Backend cart data:', backendItems);
                    
                    // Chuyển đổi format
                    const localItems = backendItems.map(item => ({
                        id: item.product_id,
                        name: item.product_name,
                        price: parseInt(item.price_vnd),
                        quantity: item.quantity,
                        size: 'M'
                    }));
                    
                    localStorage.setItem('shoppingCart', JSON.stringify(localItems));
                    console.log('💾 Đã lưu vào localStorage');
                }
            }
        } catch (error) {
            console.error('Lỗi đồng bộ:', error);
        }
        
        // LUÔN render (dù có token hay không)
        renderCart();
    }

    // KHỞI CHẠY CHÍNH
    async function initCartPage() {
        console.log('🚀 Initializing cart page...');
        
        // 1. Đồng bộ giỏ hàng
        await syncCartFromBackend();
        
        // 2. Tải danh sách sản phẩm để lấy ảnh
        await loadAllProductsForImages();
        
        console.log('✅ Cart page ready');
    }

    // BẮT ĐẦU
    initCartPage();
    
    // EXPORT HÀM handleImageError để dùng inline
    window.handleImageError = handleImageError;
});