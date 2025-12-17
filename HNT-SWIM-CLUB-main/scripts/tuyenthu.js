document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api/athletes';

    const squadGrid = document.querySelector('.squad-grid');
    
    if (squadGrid) {
        loadAthletes();
    }

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-detail')) {
            e.preventDefault();
            const athleteId = e.target.getAttribute('data-id');
            
            if (athleteId) {
                try {
                    const response = await fetch(`${API_URL}/${athleteId}`);
                    if (!response.ok) throw new Error('Không tìm thấy tuyển thủ');
                    
                    const athlete = await response.json();

                    window.location.href = `chitiet_tt.html?id=${athleteId}`;

                    localStorage.setItem('currentAthlete', JSON.stringify(athlete));
                } catch (error) {
                    console.error('Lỗi khi lấy thông tin tuyển thủ:', error);
                    alert('Không tìm thấy thông tin chi tiết của tuyển thủ này.');
                }
            }
        }
    });


    async function loadAthletes() {
        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                throw new Error('Không thể tải dữ liệu tuyển thủ');
            }
            
            const athletes = await response.json();
            
            if (athletes.length === 0) {
                squadGrid.innerHTML = '<p class="no-data">Không có tuyển thủ nào.</p>';
                return;
            }

            squadGrid.innerHTML = '';

            athletes.forEach(athlete => {
                const athleteCard = createAthleteCard(athlete);
                squadGrid.appendChild(athleteCard);
            });
            
        } catch (error) {
            console.error('Lỗi khi tải danh sách tuyển thủ:', error);
            squadGrid.innerHTML = `
                <div class="error-message">
                    <p>Không thể tải danh sách tuyển thủ. Vui lòng thử lại sau.</p>
                    <button onclick="location.reload()">Tải lại</button>
                </div>
            `;
        }
    }

function createAthleteCard(athlete) {
    const card = document.createElement('div');
    card.className = 'player-card';

    let imageUrl = athlete.image_url || 'http://localhost:3000/tuyenthu/default.png';

    const onErrorHandler = `this.onerror=null; this.src='http://localhost:3000/tuyenthu/default.png'`;

    card.innerHTML = `
        <div class="player-image">
            <img src="${imageUrl}" 
                 alt="Tuyển thủ ${athlete.full_name}" 
                 onerror="${onErrorHandler}">
        </div>
        <div class="player-info">
            <span class="player-position">${athlete.position || ''} | ${athlete.specialty || ''}</span>
            <h2 class="player-name">${athlete.full_name || ''}</h2>
            <p class="player-nickname">"${athlete.nickname || ''}"</p>
            <ul class="player-stats">
                <li>Tuổi: ${athlete.age || 'N/A'}</li>
                <li>Thành tích: ${athlete.achievements ? athlete.achievements.substring(0, 50) + '...' : 'Chưa có thông tin'}</li>
            </ul>
            <a href="chitiet_tt.html?id=${athlete.athlete_id}" class="btn-detail" data-id="${athlete.athlete_id}">Xem Chi Tiết</a>
        </div>
    `;
    
    return card;
}  

    const detailPage = document.querySelector('.athlete-detail-container');
    if (detailPage) {
        console.log('Trang chi tiết cũ được load - có thể cần update để dùng API mới');
    }
});

const style = document.createElement('style');
style.textContent = `
    .loading-message, .no-data, .error-message {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        font-size: 18px;
        color: #666;
    }
    
    .error-message {
        color: #e74c3c;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }
    
    .error-message button {
        padding: 8px 16px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .error-message button:hover {
        background: #2980b9;
    }
    
    .player-card .btn-detail {
        display: inline-block;
        margin-top: 10px;
        padding: 10px 20px;
        background: #1e3c72;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        transition: background 0.3s;
    }
    
    .player-card .btn-detail:hover {
        background: #2a5298;
    }
`;
document.head.appendChild(style);