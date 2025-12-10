/**
 * news.js - Quản lý bài báo từ Backend API
 */

const API_BASE_URL = 'http://localhost:3000/api';
const ARTICLES_API = `${API_BASE_URL}/articles`;

// Biến toàn cục
let allArticles = [];
let currentCategory = 'all';

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📰 news.js loaded - Kết nối đến Backend API');
    
    // Load bài báo từ API
    loadArticlesFromAPI();
    
    // Thiết lập sự kiện
    setupEventListeners();
});

/**
 * Load bài báo từ API Backend
 */
async function loadArticlesFromAPI() {
    showLoadingState();
    
    try {
        const response = await fetch(ARTICLES_API);
        
        if (!response.ok) {
            throw new Error(`Lỗi API: ${response.status}`);
        }
        
        const articles = await response.json();
        console.log('✅ Đã load bài báo từ API:', articles.length, 'bài');
        
        // Xử lý dữ liệu
        allArticles = processArticlesData(articles);
        
        // Render bài báo
        renderArticles(allArticles);
        
    } catch (error) {
        console.error('❌ Lỗi khi load bài báo:', error);
        showErrorState(error.message);
    }
}

/**
 * Xử lý dữ liệu bài báo từ API
 */
function processArticlesData(articles) {
    return articles.map(article => {
        // Xác định category dựa trên title/content
        let category = determineCategory(article);
        
        return {
            id: article.article_id,
            title: article.title,
            summary: article.summary || article.content?.substring(0, 150) + '...',
            content: article.content,
            image_url: article.image_url || getDefaultImage(category),
            author: article.author || 'Ban Biên Tập',
            published_at: formatDate(article.published_at || article.created_at),
            views: article.views || 0,
            category: category,
            category_tag: getCategoryTag(category)
        };
    }).sort((a, b) => new Date(b.published_at) - new Date(a.published_at)); // Sắp xếp mới nhất
}

/**
 * Xác định category dựa trên nội dung
 */
function determineCategory(article) {
    const title = article.title?.toLowerCase() || '';
    const content = article.content?.toLowerCase() || '';
    
    if (title.includes('giải đấu') || title.includes('vô địch') || title.includes('chiến thắng')) {
        return 'tournament';
    } else if (title.includes('phỏng vấn') || title.includes('chia sẻ') || title.includes('trò chuyện')) {
        return 'interview';
    } else if (title.includes('giới thiệu') || title.includes('gương mặt') || title.includes('tài năng')) {
        return 'profile';
    } else if (title.includes('giải thưởng') || title.includes('vinh danh') || title.includes('danh hiệu')) {
        return 'award';
    }
    
    // Mặc định
    return 'tournament';
}

/**
 * Lấy ảnh mặc định theo category
 */
function getDefaultImage(category) {
    const defaultImages = {
        'tournament': '../sp_home/images/banner.png',
        'interview': '../tuyenthu/B.png',
        'profile': '../tuyenthu/C.png',
        'award': '../sk/TT.png'
    };
    
    return defaultImages[category] || '../sp_home/images/banner.png';
}

/**
 * Lấy tag hiển thị cho category
 */
function getCategoryTag(category) {
    const tags = {
        'tournament': 'Giải Đấu',
        'interview': 'Phỏng Vấn',
        'profile': 'Giới Thiệu',
        'award': 'Giải Thưởng'
    };
    
    return tags[category] || 'Tin Tức';
}

/**
 * Format ngày tháng
 */
function formatDate(dateString) {
    if (!dateString) return '01/01/2024';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return '01/01/2024';
    }
}

/**
 * Hiển thị trạng thái loading
 */
function showLoadingState() {
    const container = document.getElementById('article-list');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Đang tải bài viết từ máy chủ...</p>
            </div>
        `;
    }
}

/**
 * Hiển thị lỗi
 */
function showErrorState(errorMessage) {
    const container = document.getElementById('article-list');
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <p style="color: #d32f2f; font-size: 1.2em;">⚠️ Không thể tải bài viết</p>
                <p style="font-size: 0.9em; color: #666;">${errorMessage}</p>
                <button onclick="loadArticlesFromAPI()" class="btn-retry">
                    <i class="fas fa-redo"></i> Thử lại
                </button>
                <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                    <h4>📋 Bài viết mẫu (dùng khi API lỗi):</h4>
                    <div id="fallback-articles"></div>
                </div>
            </div>
        `;
        
        // Hiển thị bài viết mẫu
        showFallbackArticles();
    }
}

/**
 * Hiển thị bài viết mẫu khi API lỗi
 */
function showFallbackArticles() {
    const fallbackContainer = document.getElementById('fallback-articles');
    if (!fallbackContainer) return;
    
    const fallbackArticles = [
        {
            id: 1,
            title: "HNT Chiến Thắng Áp Đảo Tại Giải Vô Địch Quốc Gia 2024",
            summary: "Các vận động viên đã mang về tổng cộng 15 huy chương vàng, thiết lập kỷ lục mới cho Câu lạc bộ.",
            image_url: "../sp_home/images/banner.png",
            author: "Ban Biên Tập",
            published_at: "20/11/2024",
            category: "tournament",
            category_tag: "Giải Đấu"
        },
        {
            id: 2,
            title: "Trần Thị B Chia Sẻ: 'Tất cả là nhờ sự khổ luyện'",
            summary: "Buổi phỏng vấn độc quyền với kình ngư trẻ tuổi Trần Thị B sau thành tích ấn tượng tại SEA Games 33.",
            image_url: "../tuyenthu/B.png",
            author: "Thanh Hà",
            published_at: "15/11/2024",
            category: "interview",
            category_tag: "Phỏng Vấn"
        }
    ];
    
    let html = '<div class="fallback-grid">';
    fallbackArticles.forEach(article => {
        html += createArticleCardHTML(article);
    });
    html += '</div>';
    
    fallbackContainer.innerHTML = html;
}

/**
 * Render danh sách bài báo
 */
function renderArticles(articles) {
    const container = document.getElementById('article-list');
    if (!container) return;
    
    if (articles.length === 0) {
        container.innerHTML = `
            <div class="no-articles">
                <i class="fas fa-newspaper" style="font-size: 3em; color: #ccc; margin-bottom: 20px;"></i>
                <p>Chưa có bài viết nào.</p>
                <button onclick="loadArticlesFromAPI()" class="btn-retry">
                    <i class="fas fa-redo"></i> Tải lại
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Lọc theo category nếu cần
    let filteredArticles = articles;
    if (currentCategory !== 'all') {
        filteredArticles = articles.filter(article => article.category === currentCategory);
    }
    
    // Render từng bài
    filteredArticles.forEach(article => {
        html += createArticleCardHTML(article);
    });
    
    // Thêm thông tin số lượng
    html += `
        <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #666;">
            <p>Hiển thị ${filteredArticles.length} trên tổng số ${articles.length} bài viết</p>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Thêm sự kiện click cho các link "Đọc thêm"
    setupArticleLinks();
}

/**
 * Tạo HTML cho 1 card bài viết
 */
function createArticleCardHTML(article) {
    return `
        <article class="article-card ${article.category}" data-id="${article.id}">
            <img src="${article.image_url}" 
                 alt="${article.title}"
                 onerror="this.onerror=null; this.src='https://placehold.co/400x250?text=HNT+News'">
            <div class="card-content">
                <span class="category-tag ${article.category}">${article.category_tag}</span>
                <h3>${getCategoryIcon(article.category)} ${article.title}</h3>
                <p>${article.summary}</p>
                <a href="#" class="read-more" data-id="${article.id}">
                    Đọc thêm <i class="fas fa-arrow-right"></i>
                </a>
                <div class="article-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${article.published_at}</span>
                    <span><i class="fas fa-user"></i> ${article.author}</span>
                    ${article.views ? `<span><i class="fas fa-eye"></i> ${article.views} lượt xem</span>` : ''}
                </div>
            </div>
        </article>
    `;
}

/**
 * Lấy icon theo category
 */
function getCategoryIcon(category) {
    const icons = {
        'tournament': '🏆',
        'interview': '🎤',
        'profile': '⭐',
        'award': '🏅'
    };
    
    return icons[category] || '📰';
}

/**
 * Thiết lập event listeners
 */
function setupEventListeners() {
    // Lọc theo category
    const filter = document.getElementById('category-filter');
    if (filter) {
        filter.addEventListener('change', function() {
            currentCategory = this.value;
            renderArticles(allArticles);
        });
    }
}

/**
 * Thiết lập sự kiện cho các link bài viết
 */
function setupArticleLinks() {
    // Link "Đọc thêm"
    document.querySelectorAll('.read-more').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const articleId = this.getAttribute('data-id');
            viewArticleDetail(articleId);
        });
    });
    
    // Click vào card bài viết
    document.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Chỉ xử lý nếu không click vào link "Đọc thêm"
            if (!e.target.closest('.read-more')) {
                const articleId = this.getAttribute('data-id');
                viewArticleDetail(articleId);
            }
        });
    });
}

/**
 * Xem chi tiết bài viết
 */
async function viewArticleDetail(articleId) {
    console.log(`📖 Viewing article ${articleId}`);
    
    try {
        // Gọi API để tăng view count
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Lấy chi tiết bài viết
        const response = await fetch(`${ARTICLES_API}/${articleId}`, { headers });
        
        if (response.ok) {
            const article = await response.json();
            
            // Tạo modal hoặc chuyển trang xem chi tiết
            showArticleModal(article);
            
            // Tăng view count (gọi API update)
            await updateViewCount(articleId, article.views || 0);
            
        } else {
            // Nếu không lấy được chi tiết, hiển thị thông báo
            alert('Không thể tải chi tiết bài viết. Vui lòng thử lại sau.');
        }
        
    } catch (error) {
        console.error('Lỗi xem bài viết:', error);
        alert('Lỗi kết nối đến server.');
    }
}

/**
 * Hiển thị modal chi tiết bài viết
 */
function showArticleModal(article) {
    // Tạo modal HTML
    const modalHTML = `
        <div class="article-modal" id="article-modal">
            <div class="modal-content">
                <button class="close-modal" onclick="closeArticleModal()">&times;</button>
                <div class="modal-header">
                    <span class="category-tag ${article.category || 'tournament'}">
                        ${getCategoryTag(article.category || 'tournament')}
                    </span>
                    <h2>${article.title}</h2>
                    <div class="modal-meta">
                        <span><i class="fas fa-user"></i> ${article.author || 'Ban Biên Tập'}</span>
                        <span><i class="fas fa-calendar-alt"></i> ${formatDate(article.published_at)}</span>
                        <span><i class="fas fa-eye"></i> ${(article.views || 0) + 1} lượt xem</span>
                    </div>
                </div>
                <div class="modal-body">
                    ${article.image_url ? `
                        <img src="${article.image_url}" 
                             alt="${article.title}"
                             onerror="this.onerror=null; this.src='https://placehold.co/800x400?text=HNT+News'">
                    ` : ''}
                    <div class="article-content">
                        ${article.content ? article.content.replace(/\n/g, '<br>') : 'Nội dung đang được cập nhật...'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Thêm modal vào body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Thêm CSS cho modal
    addModalStyles();
    
    // Ngăn scroll body
    document.body.style.overflow = 'hidden';
}

/**
 * Đóng modal
 */
function closeArticleModal() {
    const modal = document.getElementById('article-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

/**
 * Thêm CSS cho modal
 */
function addModalStyles() {
    if (!document.getElementById('modal-styles')) {
        const styles = `
            <style id="modal-styles">
                .article-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 1000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }
                
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 900px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                
                .close-modal {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #666;
                    z-index: 1001;
                }
                
                .close-modal:hover {
                    color: #333;
                }
                
                .modal-header {
                    padding: 30px 30px 20px;
                    border-bottom: 1px solid #eee;
                }
                
                .modal-header h2 {
                    margin: 15px 0 10px;
                    color: #333;
                }
                
                .modal-meta {
                    display: flex;
                    gap: 20px;
                    color: #666;
                    font-size: 0.9em;
                }
                
                .modal-body {
                    padding: 20px 30px 30px;
                }
                
                .modal-body img {
                    width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin-bottom: 25px;
                }
                
                .article-content {
                    line-height: 1.8;
                    color: #444;
                    font-size: 1.05em;
                }
                
                .btn-retry {
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-top: 10px;
                }
                
                .btn-retry:hover {
                    background: #2980b9;
                }
                
                .no-articles {
                    text-align: center;
                    padding: 50px;
                    grid-column: 1 / -1;
                }
                
                .fallback-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

/**
 * Tăng view count
 */
async function updateViewCount(articleId, currentViews) {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Gọi API update view count
        await fetch(`${ARTICLES_API}/${articleId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({
                views: currentViews + 1
            })
        });
        
        console.log(`✅ Updated view count for article ${articleId}`);
        
    } catch (error) {
        console.error('Lỗi update view count:', error);
    }
}

// Export hàm cho window
window.closeArticleModal = closeArticleModal;
window.loadArticlesFromAPI = loadArticlesFromAPI;

// Thêm CSS inline nếu cần
const inlineStyles = document.createElement('style');
inlineStyles.textContent = `
    .error-state {
        text-align: center;
        padding: 40px;
        background: #ffebee;
        border-radius: 8px;
        margin: 20px 0;
    }
    
    .category-tag {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8em;
        font-weight: bold;
        margin-bottom: 10px;
    }
    
    .category-tag.tournament {
        background: #e3f2fd;
        color: #1976d2;
    }
    
    .category-tag.interview {
        background: #f3e5f5;
        color: #7b1fa2;
    }
    
    .category-tag.profile {
        background: #e8f5e9;
        color: #388e3c;
    }
    
    .category-tag.award {
        background: #fff3e0;
        color: #f57c00;
    }
`;
document.head.appendChild(inlineStyles);