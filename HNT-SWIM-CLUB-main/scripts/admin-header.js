// File: scripts/admin-header.js

document.addEventListener("DOMContentLoaded", function () {
    const headerContainer = document.getElementById("admin-header-container");

    if (headerContainer) {
        // 1. CHÈN HTML HEADER 
        headerContainer.innerHTML = `
        <header class="admin-header">
            <div class="header-container">
                <div class="logo">
                    <a href="home.html" style="text-decoration: none; color: white;">HNT Admin Panel</a>
                </div>
                <nav class="admin-nav">
                    <a href="admin.html" id="nav-tuyenthu">Tuyển Thủ</a>
                    <a href="adminsp.html" id="nav-sanpham">Sản Phẩm</a>
                    <a href="admindonhang.html" id="nav-donhang">Đơn Hàng</a>
                    <a href="adminbao.html" id="nav-thongtin">Thông Tin</a>
                    <a href="adminsk.html" id="nav-sukien">Sự Kiện</a>
                </nav>
                <div class="user-actions">
                    <a href="#" onclick="logoutAdmin()">Đăng xuất <i class="fas fa-user-circle"></i></a>
                </div>
            </div>
        </header>
        `;

        // 2. TỰ ĐỘNG TÔ MÀU MENU (Active)
        const currentPage = window.location.pathname;
        console.log('📄 Current page:', currentPage); // Debug
        
        // Hàm hỗ trợ active
        function activeMenu(id) {
            const el = document.getElementById(id);
            if(el) {
                el.classList.add('active-admin');
                console.log(`✅ Active menu: ${id}`);
            }
        }

        // SỬA LOGIC ACTIVE Ở ĐÂY
        if (currentPage.includes('admin.html') || currentPage.includes('addtt_admin')) {
            activeMenu('nav-tuyenthu');
        } else if (currentPage.includes('adminsp.html') || currentPage.includes('adminaddsp')) {
            activeMenu('nav-sanpham');
        } else if (currentPage.includes('admindonhang.html')) {
            activeMenu('nav-donhang');
        } else if (currentPage.includes('adminbao.html') || currentPage.includes('adminaddtt')) {
            activeMenu('nav-thongtin'); // FIX: Trang bài báo active menu Thông Tin
        } else if (currentPage.includes('adminsk.html') || currentPage.includes('adminaddsk')) {
            activeMenu('nav-sukien');
        }
    }
});

// Hàm đăng xuất dành riêng cho Admin
function logoutAdmin() {
    if(confirm('Admin muốn đăng xuất?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '../đn/login.html';
    }
}