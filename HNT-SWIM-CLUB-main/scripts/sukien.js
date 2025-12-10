// file: scripts/sukien.js - HOÀN THIỆN PHẦN SUBMIT
const EVENT_API_URL = 'http://localhost:3000/api/events';

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('add-event-form');
    const titleElement = document.querySelector('.admin-title');
    
    // Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
        alert('Vui lòng đăng nhập quyền Admin!');
        window.location.href = '../đn/login.html';
        return;
    }
    
    // Lấy ID từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    // --- PHẦN 1: LOAD DỮ LIỆU CŨ (NẾU ĐANG SỬA) ---
    if (eventId) {
        if(titleElement) titleElement.innerText = `✏️ Cập Nhật Sự Kiện`;
        
        try {
            const res = await fetch(`${EVENT_API_URL}/${eventId}`);
            
            if (!res.ok) {
                throw new Error('Lỗi tải sự kiện');
            }
            
            const data = await res.json();
            console.log('Dữ liệu sự kiện:', data);
            
            // Hiển thị ID
            const idInput = document.getElementById('event-id');
            if(idInput) {
                idInput.value = `SK${String(data.event_id).padStart(3, '0')}`;
                idInput.readOnly = true;
                idInput.style.backgroundColor = '#e9ecef';
            }

            // Điền dữ liệu vào form
            document.getElementById('event-title').value = data.title || '';
            document.getElementById('location').value = data.location || '';
            document.getElementById('description').value = data.description || '';
            
            // Xử lý ngày
            if (data.event_date) {
                let dateStr = data.event_date;
                if (dateStr.includes(' ')) {
                    dateStr = dateStr.split(' ')[0]; // Lấy phần date
                }
                document.getElementById('event-date').value = dateStr;
            }
            
            // Xử lý giờ
            if (data.event_time) {
                let timeStr = data.event_time;
                if (timeStr.length === 8) { // HH:MM:SS
                    timeStr = timeStr.substring(0, 5); // Chỉ lấy HH:MM
                }
                document.getElementById('event-time').value = timeStr;
            }

            // Hiển thị ảnh cũ nếu có
            if (data.image_url) {
                const noteElement = document.querySelector('.note');
                if (noteElement) {
                    let cleanPath = data.image_url;
                    if (cleanPath.includes('uploads/')) {
                        cleanPath = cleanPath.split('uploads/')[1];
                    }
                    noteElement.innerHTML = `Ảnh cũ: <a href="http://localhost:3000/uploads/${cleanPath}" target="_blank" style="color:blue">Xem</a>`;
                }
            }
        } catch (e) { 
            console.error(e);
            alert('Lỗi tải dữ liệu: ' + e.message);
        }
    }

    // --- PHẦN 2: XỬ LÝ LƯU (SUBMIT) ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate form
            const title = document.getElementById('event-title').value.trim();
            const location = document.getElementById('location').value.trim();
            const eventDate = document.getElementById('event-date').value;
            const eventTime = document.getElementById('event-time').value || '00:00';
            const description = document.getElementById('description').value.trim();
            
            if (!title || !location || !eventDate) {
                alert('Vui lòng điền đầy đủ các trường bắt buộc (*)');
                return;
            }

            // Lấy event ID thực (bỏ chữ SK nếu có)
            let actualEventId = eventId;
            const idInput = document.getElementById('event-id');
            if (idInput && idInput.value && eventId === null) {
                // Nếu đang tạo mới mà có nhập mã, lấy số từ SKxxx
                const rawId = idInput.value.replace('SK', '');
                if (!isNaN(rawId) && rawId.trim() !== '') {
                    // Nếu mã là số, không dùng vì backend tự tăng
                    idInput.value = ''; // Xóa để backend tự sinh
                }
            }

            // Tạo FormData
            const formData = new FormData();
            formData.append('title', title);
            formData.append('location', location);
            formData.append('description', description);
            formData.append('event_date', eventDate);
            
            // Chuyển đổi thời gian thành HH:MM:SS
            const timeWithSeconds = eventTime + ':00';
            formData.append('event_time', timeWithSeconds);

            // Xử lý ảnh
            const fileInput = document.getElementById('image-upload');
            if (fileInput && fileInput.files.length > 0) {
                if (fileInput.files[0].size > 2 * 1024 * 1024) {
                    alert('Kích thước ảnh không được vượt quá 2MB');
                    return;
                }
                formData.append('image', fileInput.files[0]);
            }

            // Gửi request
            try {
                const token = localStorage.getItem('token');
                const method = actualEventId ? 'PUT' : 'POST';
                const submitUrl = actualEventId ? `${EVENT_API_URL}/${actualEventId}` : EVENT_API_URL;

                console.log('Gửi sự kiện:', {
                    method,
                    url: submitUrl,
                    title,
                    location,
                    eventDate,
                    eventTime: timeWithSeconds
                });

                const res = await fetch(submitUrl, {
                    method: method,
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const result = await res.json();
                console.log('Kết quả:', result);
                
                if (res.ok) {
                    alert('Lưu thành công!');
                    window.location.href = 'adminsk.html';
                } else {
                    alert('Lỗi: ' + (result.message || 'Không thể lưu sự kiện'));
                }
            } catch (error) {
                console.error('Lỗi kết nối:', error);
                alert('Lỗi kết nối server. Vui lòng thử lại!');
            }
        });
    }
    
    // --- PHẦN 3: XỬ LÝ HIỂN THỊ ẢNH PREVIEW ---
    const imageInput = document.getElementById('image-upload');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const preview = document.getElementById('image-preview');
            if (!preview) {
                const container = imageInput.parentElement;
                container.insertAdjacentHTML('beforeend', 
                    '<div id="image-preview" style="margin-top:10px; max-width:200px;"></div>'
                );
            }
            
            const previewDiv = document.getElementById('image-preview');
            if (this.files.length > 0) {
                const file = this.files[0];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    previewDiv.innerHTML = `
                        <img src="${e.target.result}" 
                             style="max-width:100%; border-radius:5px; border:1px solid #ddd;">
                        <p style="font-size:12px; color:#666; margin-top:5px;">
                            ${file.name} (${(file.size / 1024).toFixed(1)} KB)
                        </p>
                    `;
                }
                
                reader.readAsDataURL(file);
            } else {
                previewDiv.innerHTML = '';
            }
        });
    }
});