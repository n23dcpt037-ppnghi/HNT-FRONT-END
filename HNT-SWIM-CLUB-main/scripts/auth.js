// scripts/auth.js

// Cấu hình đường dẫn API (Check lại port backend của bà nha, thường là 3000)
const API_URL = 'http://localhost:3000/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    // --- XỬ LÝ ĐĂNG KÝ ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Lấy dữ liệu từ các ô input theo ID trong file đk.html
            const fullname = document.getElementById('reg_fullname').value.trim();
            const email = document.getElementById('reg_email').value.trim();
            const password = document.getElementById('reg_password').value.trim();
            const confirmPassword = document.getElementById('reg_confirm_password').value.trim();
            const messageBox = document.getElementById('message'); // Chỗ hiện thông báo

            // 2. Validate cơ bản ở Client
            if (password !== confirmPassword) {
                showMessage(messageBox, 'Mật khẩu xác nhận không khớp!', 'error');
                return;
            }
            if (password.length < 6) {
                showMessage(messageBox, 'Mật khẩu phải từ 6 ký tự trở lên!', 'error');
                return;
            }

            // 3. GỌI API BACKEND (Phần quan trọng nhất nè)
            try {
                // Hiển thị trạng thái đang xử lý
                const btnSubmit = document.getElementById('registerBtn');
                const originalText = btnSubmit.innerText;
                btnSubmit.innerText = 'Đang xử lý...';
                btnSubmit.disabled = true;

                // Gọi API
                const response = await fetch(`${API_URL}/register`, { // Endpoint này phải khớp với Postman của bà
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        full_name: fullname, // Tên trường phải khớp với Backend quy định
                        email: email,
                        password: password
                    })
                });

                const data = await response.json();

                // 4. Xử lý kết quả trả về
                if (response.ok) {
                    // Thành công -> Báo xanh & Chuyển trang login
                    showMessage(messageBox, 'Đăng ký thành công! Đang chuyển hướng...', 'success');
                    setTimeout(() => {
                        window.location.href = '../đn/login.html';
                    }, 1500);
                } else {
                    // Thất bại (ví dụ: Email trùng) -> Báo đỏ
                    showMessage(messageBox, data.message || 'Đăng ký thất bại!', 'error');
                }

            } catch (error) {
                console.error('Lỗi kết nối:', error);
                showMessage(messageBox, 'Lỗi kết nối đến server. Vui lòng thử lại sau.', 'error');
            } finally {
                // Trả lại nút bấm
                const btnSubmit = document.getElementById('registerBtn');
                btnSubmit.innerText = 'Đăng ký';
                btnSubmit.disabled = false;
            }
        });
    }
});

// Hàm phụ để hiện thông báo đẹp đẹp xíu
function showMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.className = type; // class "success" hoặc "error" đã có CSS trong file html
}