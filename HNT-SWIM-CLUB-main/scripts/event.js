// event.js 
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api/events';
    const bannerImages = ['../sk/TT.png', '../sk/TT2.png'];
    
    // Khởi tạo banner
    initBanner();
    
    // Tải sự kiện
    loadEvents();

    // --- Banner ---
    function initBanner() {
        const bannerElement = document.getElementById('eventBanner');
        if (!bannerElement) return;
        
        bannerElement.style.backgroundImage = `url('${bannerImages[0]}')`;
        bannerElement.style.backgroundSize = 'cover';
        bannerElement.style.backgroundPosition = 'center';
        bannerElement.style.backgroundRepeat = 'no-repeat';
        
        let currentImageIndex = 0;
        setInterval(() => {
            currentImageIndex = (currentImageIndex + 1) % bannerImages.length;
            bannerElement.style.backgroundImage = `url('${bannerImages[currentImageIndex]}')`;
        }, 5000);
    }

    // --- Tải sự kiện ---
    async function loadEvents() {
        try {
            console.log('🔄 Đang tải sự kiện từ API...');
            const response = await fetch(API_BASE_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const allEvents = await response.json();
            console.log('✅ Dữ liệu từ API:', allEvents);
            
            // Phân loại sự kiện
            const now = new Date();
            const upcomingEvents = [];
            const pastEvents = [];
            
            allEvents.forEach(event => {
                if (!event.event_date) return;
                
                // Tạo Date object từ event_date (YYYY-MM-DD)
                const eventDate = new Date(event.event_date + 'T' + (event.event_time || '00:00:00'));
                
                if (eventDate >= now) {
                    upcomingEvents.push({
                        ...event,
                        is_upcoming: true
                    });
                } else {
                    pastEvents.push({
                        ...event,
                        is_upcoming: false
                    });
                }
            });
            
            // Sắp xếp
            upcomingEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
            pastEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
            
            // Hiển thị số lượng
            updateEventCounts(upcomingEvents.length, pastEvents.length);
            
            // Hiển thị sự kiện
            renderEvents(upcomingEvents, 'upcoming-events');
            renderEvents(pastEvents, 'past-events');
            
        } catch (error) {
            console.error('❌ Lỗi khi tải sự kiện:', error);
            
            // Hiển thị thông báo lỗi
            showErrorMessage('upcoming-events', 'Không thể tải danh sách sự kiện.');
            showErrorMessage('past-events', 'Không thể tải danh sách sự kiện.');
            
            // Tải dữ liệu mẫu
            loadSampleData();
        }
    }

    // --- Cập nhật số lượng ---
    function updateEventCounts(upcomingCount, pastCount) {
        const upcomingElement = document.getElementById('upcoming-count');
        const pastElement = document.getElementById('past-count');
        
        if (upcomingElement) upcomingElement.textContent = `(${upcomingCount})`;
        if (pastElement) pastElement.textContent = `(${pastCount})`;
    }

    // --- Hiển thị sự kiện ---
    function renderEvents(events, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Xóa loading message
        container.innerHTML = '';
        
        if (!events || events.length === 0) {
            container.innerHTML = `
                <div class="no-events-message">
                    <i class="fas fa-calendar-times"></i>
                    <p>Không có sự kiện nào.</p>
                </div>
            `;
            return;
        }
        
        // Tạo card cho mỗi sự kiện
        events.forEach(event => {
            const eventCard = createEventCard(event);
            container.appendChild(eventCard);
        });
    }

    // --- Tạo thẻ sự kiện ---
    function createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';
        
        // Xác định loại sự kiện
        const isUpcoming = event.is_upcoming;
        const badgeClass = isUpcoming ? 'upcoming-badge' : 'past-badge';
        const badgeText = isUpcoming ? 'SẮP DIỄN RA' : 'ĐÃ DIỄN RA';
        
        // Format ngày tháng: YYYY-MM-DD → DD/MM/YYYY
        const displayDate = formatDateForDisplay(event.event_date);
        const displayTime = event.event_time ? formatTimeForDisplay(event.event_time) : '';
        
        card.innerHTML = `
            <div class="event-image-container">
                <img src="${event.image_url || '../sk/default-event.jpg'}" 
                     alt="${event.title}" 
                     class="event-image"
                     onerror="this.src='../sk/default-event.jpg'">
                <span class="event-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="event-info">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-meta">
                    <p class="event-date">
                        <i class="fas fa-calendar-alt"></i> 
                        <span>${displayDate}${displayTime ? ` - ${displayTime}` : ''}</span>
                    </p>
                    <p class="event-location">
                        <i class="fas fa-map-marker-alt"></i> 
                        <span>${event.location || 'Chưa cập nhật'}</span>
                    </p>
                </div>
                <p class="event-description">${event.description || 'Chưa có mô tả chi tiết.'}</p>
                
                <!-- ĐÃ BỎ NÚT "ĐĂNG KÝ THAM GIA" -->
            </div>
        `;
        
        return card;
    }

    // --- Format ngày hiển thị ---
    function formatDateForDisplay(dateStr) {
        if (!dateStr) return 'N/A';
        
        try {
            // Chuyển từ YYYY-MM-DD sang DD/MM/YYYY
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error('Lỗi format date:', dateStr, error);
            return dateStr;
        }
    }

    // --- Format giờ hiển thị ---
    function formatTimeForDisplay(timeStr) {
        if (!timeStr || timeStr === '00:00:00') return '';
        
        try {
            // Lấy giờ:phút
            const [hours, minutes] = timeStr.split(':');
            return `${hours}:${minutes}`;
        } catch (error) {
            return timeStr;
        }
    }

    // --- Hiển thị thông báo lỗi ---
    function showErrorMessage(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button class="btn-retry" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Tải Lại
                    </button>
                </div>
            `;
        }
    }

    // --- Tải dữ liệu mẫu ---
    function loadSampleData() {
        console.log('🔄 Đang tải dữ liệu mẫu...');
        
        const now = new Date();
        
        // Sự kiện sắp diễn ra (tương lai)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 15);
        const nextWeek = new Date(now.getFullYear(), now.getMonth() + 1, 10);
        
        // Sự kiện đã diễn ra (quá khứ)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 20);
        const lastYear = new Date(now.getFullYear() - 1, 11, 15);
        
        const sampleData = {
            upcoming: [
                {
                    event_id: 1,
                    title: "Giải Bơi Mở Rộng Toàn Quốc 2025",
                    description: "Giải đấu lớn nhất năm với sự góp mặt của các vận động viên hàng đầu.",
                    event_date: formatDateForDatabase(nextMonth),
                    event_time: "08:00:00",
                    location: "Hồ bơi Yết Kiêu, TP.HCM",
                    image_url: "../sk/sk1.png",
                    is_upcoming: true
                },
                {
                    event_id: 2,
                    title: "Chương Trình Tập Huấn Kỹ Thuật Bơi Ngửa",
                    description: "Buổi tập huấn chuyên sâu về kỹ thuật bơi Ngửa với kỷ lục gia Trần Thị B.",
                    event_date: formatDateForDatabase(nextWeek),
                    event_time: "14:00:00",
                    location: "CLB HNT, Thủ Đức",
                    image_url: "../sk/sk2.png",
                    is_upcoming: true
                }
            ],
            past: [
                {
                    event_id: 3,
                    title: "Giao Lưu Cộng Đồng 'Hè Vui Khỏe'",
                    description: "Hoạt động bơi lội và trò chơi dưới nước dành cho các gia đình.",
                    event_date: formatDateForDatabase(lastMonth),
                    event_time: "09:00:00",
                    location: "Công viên Nước Hồ Tây, Hà Nội",
                    image_url: "../sk/sk3.png",
                    is_upcoming: false
                },
                {
                    event_id: 4,
                    title: "Giải Bơi Vô Địch CLB HNT Lần 1/2024",
                    description: "Giải đấu nội bộ chọn ra đội hình cho năm mới.",
                    event_date: "2024-12-15",
                    event_time: "08:30:00",
                    location: "Hồ bơi HNT",
                    image_url: "../sk/sk4.png",
                    is_upcoming: false
                },
                {
                    event_id: 5,
                    title: "Hội Thảo Dinh Dưỡng Cho VĐV Bơi Lội",
                    description: "Hội thảo về chế độ dinh dưỡng tối ưu cho vận động viên.",
                    event_date: "2024-11-05",
                    event_time: "19:00:00",
                    location: "Online qua Zoom",
                    image_url: "../sk/sk5.png",
                    is_upcoming: false
                }
            ]
        };
        
        // Hiển thị số lượng
        updateEventCounts(sampleData.upcoming.length, sampleData.past.length);
        
        // Hiển thị sự kiện
        renderEvents(sampleData.upcoming, 'upcoming-events');
        renderEvents(sampleData.past, 'past-events');
        
        // Thêm thông báo demo
        addDemoNotice();
    }

    // --- Format date cho database (YYYY-MM-DD) ---
    function formatDateForDatabase(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --- Thêm thông báo demo ---
    function addDemoNotice() {
        const upcomingContainer = document.getElementById('upcoming-events');
        const pastContainer = document.getElementById('past-events');
        
        if (upcomingContainer && upcomingContainer.children.length > 0) {
            upcomingContainer.insertAdjacentHTML('afterbegin', 
                '<div class="demo-notice"><i class="fas fa-info-circle"></i> Đang hiển thị dữ liệu mẫu.</div>'
            );
        }
        
        if (pastContainer && pastContainer.children.length > 0) {
            pastContainer.insertAdjacentHTML('afterbegin', 
                '<div class="demo-notice"><i class="fas fa-info-circle"></i> Đang hiển thị dữ liệu mẫu.</div>'
            );
        }
    }
});

// Thêm CSS
const style = document.createElement('style');
style.textContent = `
    .event-count {
        background: #3498db;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 14px;
        margin-left: 10px;
    }
    
    .event-card {
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        overflow: hidden;
        transition: all 0.3s ease;
        background: white;
    }
    
    .event-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    
    .event-image-container {
        position: relative;
        height: 200px;
        overflow: hidden;
    }
    
    .event-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }
    
    .event-card:hover .event-image {
        transform: scale(1.05);
    }
    
    .event-badge {
        position: absolute;
        top: 15px;
        right: 15px;
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .upcoming-badge {
        background: #2ecc71;
        color: white;
    }
    
    .past-badge {
        background: #7f8c8d;
        color: white;
    }
    
    .event-info {
        padding: 20px;
    }
    
    .event-title {
        margin: 0 0 15px 0;
        color: #2c3e50;
        font-size: 20px;
        line-height: 1.4;
    }
    
    .event-meta {
        margin-bottom: 15px;
        color: #555;
        font-size: 14px;
    }
    
    .event-meta i {
        width: 20px;
        color: #3498db;
        margin-right: 8px;
    }
    
    .event-description {
        color: #666;
        line-height: 1.6;
        margin-bottom: 20px;
        font-size: 14px;
    }
    
    .no-events-message {
        text-align: center;
        padding: 40px;
        color: #7f8c8d;
        grid-column: 1 / -1;
    }
    
    .no-events-message i {
        font-size: 48px;
        margin-bottom: 20px;
        color: #bdc3c7;
    }
    
    .demo-notice {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 5px;
        padding: 12px;
        margin-bottom: 20px;
        color: #856404;
        grid-column: 1 / -1;
        text-align: center;
        font-size: 14px;
    }
    
    .demo-notice i {
        margin-right: 8px;
        color: #f39c12;
    }
    
    .error-message {
        background: #ffeaea;
        border: 1px solid #ffcccc;
        border-radius: 5px;
        padding: 25px;
        margin: 10px 0;
        color: #c0392b;
        text-align: center;
        grid-column: 1 / -1;
    }
    
    .error-message i {
        font-size: 36px;
        margin-bottom: 15px;
        color: #e74c3c;
        display: block;
    }
    
    .btn-retry {
        padding: 12px 24px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 15px;
        font-weight: bold;
        font-size: 16px;
    }
    
    .btn-retry:hover {
        background: #2980b9;
    }
`;
document.head.appendChild(style);