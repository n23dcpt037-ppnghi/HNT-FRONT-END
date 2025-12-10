const API_URL = 'http://localhost:3000/api/products'; 

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('add-product-form');
    const noteElement = document.querySelector('.note');
    const titleElement = document.querySelector('.admin-title');
    
    // Lấy ID từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // --- PHẦN 1: LOAD DỮ LIỆU CŨ (NẾU ĐANG SỬA) ---
    if (productId) {
        if(titleElement) titleElement.innerText = `✏️ Cập Nhật Sản Phẩm: ${productId}`;
        const idInput = document.getElementById('product-id');
        if(idInput) {
            idInput.value = productId;
            idInput.readOnly = true;
            idInput.style.backgroundColor = '#e9ecef';
        }

        try {
            const res = await fetch(`${API_URL}/${productId}`);
            if (!res.ok) throw new Error('Lỗi tải sản phẩm');
            const data = await res.json();

            // Điền dữ liệu
            if(document.getElementById('product-name')) document.getElementById('product-name').value = data.product_name || '';
            if(document.getElementById('category')) document.getElementById('category').value = data.category || '';
            if(document.getElementById('inventory')) document.getElementById('inventory').value = data.stock || 0;
            if(document.getElementById('price')) document.getElementById('price').value = data.price_vnd || 0;
            
            // Xử lý mô tả (Backend 1 trường, Frontend 2 trường -> Điền vào ô chi tiết)
            if(document.getElementById('long-desc')) document.getElementById('long-desc').value = data.description || '';

            // Xử lý ảnh cũ (Fix lỗi lặp chữ images/)
            if (data.image_url && noteElement) {
                let cleanPath = data.image_url.replace(/^images\//, '').replace(/^sp_home\/images\//, '');
                noteElement.innerHTML = `Ảnh cũ: <a href="http://localhost:3000/sp_home/images/${cleanPath}" target="_blank" style="color:blue">Xem</a>`;
            }
        } catch (e) { console.error(e); }
    }

    // --- PHẦN 2: XỬ LÝ LƯU (SUBMIT) ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // BƯỚC 1: Lấy giá trị input TRƯỚC (Fix lỗi fullDescription before initialization)
            const shortVal = document.getElementById('short-desc') ? document.getElementById('short-desc').value : '';
            const longVal = document.getElementById('long-desc') ? document.getElementById('long-desc').value : '';
            
            // BƯỚC 2: Gộp thành biến xong mới dùng
            const fullDescription = `Mô tả ngắn: ${shortVal}\n----------------\n${longVal}`;

            // BƯỚC 3: Đưa vào FormData
            const formData = new FormData();
            formData.append('product_id', document.getElementById('product-id').value);
            formData.append('product_name', document.getElementById('product-name').value);
            formData.append('category', document.getElementById('category').value);
            formData.append('stock', document.getElementById('inventory').value);
            formData.append('price_vnd', document.getElementById('price').value);
            formData.append('description', fullDescription); // Gửi biến đã gộp

            const fileInput = document.getElementById('image-upload');
            if (fileInput && fileInput.files.length > 0) {
                formData.append('image', fileInput.files[0]);
            }

            // BƯỚC 4: Gửi đi
            try {
                const token = localStorage.getItem('token');
                const method = productId ? 'PUT' : 'POST';
                const submitUrl = productId ? `${API_URL}/${productId}` : API_URL;

                const res = await fetch(submitUrl, {
                    method: method,
                    headers: { 'Authorization': `Bearer ${token}` }, // Không set Content-Type
                    body: formData
                });

                if (res.ok) {
                    alert('Thành công!');
                    window.location.href = 'adminsp.html';
                } else {
                    const err = await res.json();
                    alert('Lỗi: ' + (err.message || 'Thất bại'));
                }
            } catch (error) {
                console.error(error);
                alert('Lỗi kết nối server');
            }
        });
    }
});