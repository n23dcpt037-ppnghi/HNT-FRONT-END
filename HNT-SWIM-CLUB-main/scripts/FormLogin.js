// CNPM CK/scripts/FormLogin.js - ĐÃ FIX GOOGLE LOGIN & XÓA DEVTOOL

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. KIỂM TRA NẾU ĐÃ ĐĂNG NHẬP -> REDIRECT
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '../sp_home/trangchu.html';
        return;
    }

    // 2. LẤY CÁC PHẦN TỬ DOM
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const messageDiv = document.getElementById("message");
    const loginBtn = document.getElementById("loginBtn");

    // ====================
    // XỬ LÝ LOGIN THƯỜNG
    // ====================
    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const email = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            
            messageDiv.textContent = "Đang xử lý...";
            messageDiv.className = "";
            loginBtn.disabled = true;

            try {
                // Gọi API Login thường
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Thành công -> Lưu data
                    saveAuthData(data);
                    messageDiv.textContent = "Đăng nhập thành công!";
                    messageDiv.className = "success";

                    // 👇👇👇 SỬA ĐOẠN CHUYỂN TRANG Ở ĐÂY 👇👇👇
                    setTimeout(() => {
                        // Lấy quyền từ data trả về hoặc localStorage
                        const role = data.role || localStorage.getItem('role');

                        if (role === 'admin') {
                            // Nếu là Admin -> Vào trang Admin
                            // (Kiểm tra lại đường dẫn file home.html của bà nha)
                            window.location.href = '../admin/home.html'; 
                        } else {
                            // Nếu là Khách -> Vào trang chủ bán hàng
                            window.location.href = '../sp_home/trangchu.html';
                        }
                    }, 1000);
                } else {
                    // Thất bại
                    messageDiv.textContent = data.message || "Đăng nhập thất bại!";
                    messageDiv.className = "error";
                    loginBtn.disabled = false;
                }
            } catch (error) {
                console.error("Lỗi:", error);
                messageDiv.textContent = "Lỗi kết nối Server!";
                messageDiv.className = "error";
                loginBtn.disabled = false;
            }
        });
    }
});

// ====================
// XỬ LÝ GOOGLE LOGIN (QUAN TRỌNG: PHẢI ĐỂ NGOÀI CÙNG)
// ====================

// Hàm này Google sẽ tự gọi khi đăng nhập xong
async function handleCredentialResponse(response) {
    console.log("Google Token nhận được:", response.credential);
    const messageDiv = document.getElementById("message");
    
    if(messageDiv) {
        messageDiv.textContent = "Đang xác thực với Google...";
        messageDiv.className = "";
    }
    
    try {
        // Gửi Token Google xuống Backend để xác thực
        const res = await fetch('http://localhost:3000/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential })
        });

        const data = await res.json();

        if (res.ok) {
            if(messageDiv) {
                messageDiv.textContent = "Đăng nhập Google thành công!";
                messageDiv.className = "success";
            }

            // Lưu Token hệ thống
            saveAuthData(data);

            setTimeout(() => {
                const role = data.role || localStorage.getItem('role');

                if (role === 'admin') {
                    window.location.href = '../admin/home.html'; 
                } else {
                    window.location.href = '../sp_home/trangchu.html';
                }
            }, 1000);
        } else {
            if(messageDiv) {
                messageDiv.textContent = "Lỗi Backend: " + (data.message || "Không xác định");
                messageDiv.className = "error";
            }
        }

    } catch (error) {
        console.error("Lỗi kết nối:", error);
        if(messageDiv) {
            messageDiv.textContent = "Lỗi kết nối Server!";
            messageDiv.className = "error";
        }
    }
}

// Hàm hỗ trợ lưu data
function saveAuthData(data) {
    localStorage.setItem('token', data.token);
    if (data.userId) localStorage.setItem('userId', data.userId);
    if (data.role) localStorage.setItem('role', data.role);
    if (data.email) localStorage.setItem('userEmail', data.email);
}

// Xuất hàm ra window để Google gọi được (BẮT BUỘC)
window.handleCredentialResponse = handleCredentialResponse;