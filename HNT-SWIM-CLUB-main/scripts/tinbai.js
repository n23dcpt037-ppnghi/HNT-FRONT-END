// file: scripts/tinbai.js
const API_URL = 'http://localhost:3000/api/articles';

console.log('Script tinbai.js đã tải');
console.log('Token:', localStorage.getItem('token'));
console.log('Role:', localStorage.getItem('role'));

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('add-article-form');
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
    const articleId = urlParams.get('id');

    // --- PHẦN 1: LOAD DỮ LIỆU CŨ (NẾU ĐANG SỬA) ---
    if (articleId) {
        if(titleElement) titleElement.innerText = `✏️ Cập Nhật Bài Báo`;
        
        try {
            const res = await fetch(`${API_URL}/${articleId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Lỗi tải bài báo');
            }
            
            const data = await res.json();
            
            // Hiển thị ID
            const idInput = document.getElementById('article-id');
            if(idInput) {
                idInput.value = articleId;
                idInput.readOnly = true;
                idInput.style.backgroundColor = '#e9ecef';
            }

            // Điền dữ liệu vào form
            if(document.getElementById('article-title')) document.getElementById('article-title').value = data.title || '';
            if(document.getElementById('author')) document.getElementById('author').value = data.author || '';
            if(document.getElementById('category')) document.getElementById('category').value = data.category || '';
            if(document.getElementById('published-date')) {
                const date = data.published_at ? new Date(data.published_at) : new Date();
                document.getElementById('published-date').value = date.toISOString().split('T')[0];
            }
            if(document.getElementById('summary')) document.getElementById('summary').value = data.summary || '';
            if(document.getElementById('content')) document.getElementById('content').value = data.content || '';

            // Hiển thị ảnh cũ nếu có
            if (data.image_url) {
                const noteElement = document.querySelector('.note');
                if (noteElement) {
                    // Xử lý đường dẫn ảnh
                    let cleanPath = data.image_url;
                    if (cleanPath.includes('uploads/')) {
                        cleanPath = cleanPath.split('uploads/')[1];
                    }
                    noteElement.innerHTML = `Ảnh cũ: <a href="http://localhost:3000/uploads/${cleanPath}" target="_blank" style="color:blue">Xem</a>`;
                }
            }

            // Hiển thị file cũ nếu có
            if (data.file_url) {
                const fileNote = document.querySelector('.file-old-note');
                if (!fileNote) {
                    const fileSection = document.querySelector('.file-upload-section');
                    if (fileSection) {
                        fileSection.insertAdjacentHTML('beforeend', 
                            `<p class="file-old-note">File hiện tại: <a href="http://localhost:3000/uploads/${data.file_url}" target="_blank">📄 Xem file</a></p>`
                        );
                    }
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
            const title = document.getElementById('article-title').value.trim();
            const author = document.getElementById('author').value.trim();
            const category = document.getElementById('category').value;
            
            if (!title || !author || !category) {
                alert('Vui lòng điền đầy đủ các trường bắt buộc (*)');
                return;
            }

            // Tạo FormData
            const formData = new FormData();
            formData.append('title', title);
            formData.append('author', author);
            formData.append('category', category);
            formData.append('published_at', document.getElementById('published-date').value);
            formData.append('summary', document.getElementById('summary').value.trim());
            formData.append('content', document.getElementById('content').value.trim());

            // Xử lý ảnh
            const fileInput = document.getElementById('image-upload');
            if (fileInput && fileInput.files.length > 0) {
                // Kiểm tra kích thước file (tối đa 2MB)
                if (fileInput.files[0].size > 2 * 1024 * 1024) {
                    alert('Kích thước ảnh không được vượt quá 2MB');
                    return;
                }
                formData.append('image', fileInput.files[0]);
            }

            // Xử lý file nội dung
            const contentFileInput = document.getElementById('content-file');
            if (contentFileInput && contentFileInput.files.length > 0) {
                // Kiểm tra định dạng file
                const allowedExtensions = ['.pdf', '.doc', '.docx'];
                const fileName = contentFileInput.files[0].name.toLowerCase();
                const isValid = allowedExtensions.some(ext => fileName.endsWith(ext));
                
                if (!isValid) {
                    alert('Chỉ chấp nhận file PDF, DOC hoặc DOCX');
                    return;
                }
                
                formData.append('content_file', contentFileInput.files[0]);
            }

            // Gửi request
            try {
                const token = localStorage.getItem('token');
                const method = articleId ? 'PUT' : 'POST';
                const submitUrl = articleId ? `${API_URL}/${articleId}` : API_URL;

                const res = await fetch(submitUrl, {
                    method: method,
                    headers: { 
                        'Authorization': `Bearer ${token}`
                        // KHÔNG set Content-Type khi dùng FormData
                    },
                    body: formData
                });

                const result = await res.json();
                
                if (res.ok) {
                    alert('Lưu thành công!');
                    window.location.href = 'adminbao.html';
                } else {
                    alert('Lỗi: ' + (result.message || 'Không thể lưu bài báo'));
                }
            } catch (error) {
                console.error('Lỗi kết nối:', error);
                alert('Lỗi kết nối server. Vui lòng thử lại!');
            }
        });
    }

    // --- PHẦN 3: XỬ LÝ HIỂN THỊ TÊN FILE ---
    const fileInput = document.getElementById('content-file');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const fileNameDisplay = document.querySelector('.file-name-display');
            if (this.files.length > 0) {
                const file = this.files[0];
                fileNameDisplay.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
                fileNameDisplay.style.color = '#4CAF50';
            } else {
                fileNameDisplay.textContent = 'Không có tệp nào được chọn';
                fileNameDisplay.style.color = '#666';
            }
        });
    }
    
    // --- PHẦN 4: XỬ LÝ XEM TRƯỚC ẢNH ---
    const imageInput = document.getElementById('image-upload');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const preview = document.getElementById('image-preview');
            if (!preview) {
                // Tạo div preview nếu chưa có
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