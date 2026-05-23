const STORAGE_KEY = 'datemanager_foods';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    loadAndRenderFoods();
    setupFormHandler();
});

// 设置表单提交处理
function setupFormHandler() {
    const form = document.getElementById('foodForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addFood();
    });
}

// 添加食品
function addFood() {
    const name = document.getElementById('foodName').value.trim();
    const productionDate = document.getElementById('productionDate').value;
    const shelfLife = parseInt(document.getElementById('shelfLife').value);

    if (!name || !productionDate || !shelfLife) {
        alert('请填写完整信息');
        return;
    }

    const foods = getFoods();
    const food = {
        id: Date.now(),
        name,
        productionDate,
        shelfLife,
        createdAt: new Date().toISOString()
    };

    foods.push(food);
    saveFoods(foods);

    // 重置表单
    document.getElementById('foodForm').reset();

    // 重新渲染
    loadAndRenderFoods();
}

// 获取食品列表
function getFoods() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// 保存食品列表
function saveFoods(foods) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(foods));
}

// 加载并渲染食品列表
function loadAndRenderFoods() {
    const foods = getFoods();
    renderFoods(foods);
}

// 渲染食品列表
function renderFoods(foods) {
    const foodListEl = document.getElementById('foodList');
    const alertListEl = document.getElementById('alertList');
    const alertSection = document.getElementById('alertSection');
    const emptyMsg = document.getElementById('emptyMsg');

    if (foods.length === 0) {
        foodListEl.innerHTML = '';
        alertSection.style.display = 'none';
        emptyMsg.style.display = 'block';
        return;
    }

    emptyMsg.style.display = 'none';

    // 按过期日期排序
    const sortedFoods = [...foods].sort((a, b) => {
        const aExpiry = getExpiryDate(a.productionDate, a.shelfLife);
        const bExpiry = getExpiryDate(b.productionDate, b.shelfLife);
        return new Date(aExpiry) - new Date(bExpiry);
    });

    // 分离临期食品和正常食品
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiringFoods = [];
    const normalFoods = [];

    sortedFoods.forEach(food => {
        const expiryDate = new Date(getExpiryDate(food.productionDate, food.shelfLife));
        const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 7) {
            expiringFoods.push({ ...food, daysLeft });
        } else {
            normalFoods.push({ ...food, daysLeft });
        }
    });

    // 渲染临期提醒
    if (expiringFoods.length > 0) {
        alertSection.style.display = 'block';
        alertListEl.innerHTML = expiringFoods.map(food => `
            <div class="alert-item">
                <span class="food-name">${escapeHtml(food.name)}</span>
                <span class="days-left">${food.daysLeft <= 0 ? '已过期' : `剩余 ${food.daysLeft} 天`}</span>
            </div>
        `).join('');
    } else {
        alertSection.style.display = 'none';
    }

    // 渲染食品列表
    const allRenderFoods = [...expiringFoods, ...normalFoods];
    foodListEl.innerHTML = allRenderFoods.map(food => {
        const expiryDate = getExpiryDate(food.productionDate, food.shelfLife);
        const status = getStatus(food.productionDate, food.shelfLife);
        const statusText = status === 'expired' ? '已过期' : (status === 'warning' ? '临期' : '正常');

        return `
            <div class="food-item">
                <div class="food-info">
                    <div class="name">
                        ${escapeHtml(food.name)}
                        <span class="status ${status}">${statusText}</span>
                    </div>
                    <div class="date-info">
                        生产日期：${food.productionDate} | 保质期：${food.shelfLife} 天 | 过期日期：${expiryDate}
                    </div>
                </div>
                <div class="food-actions">
                    <button class="btn-consume" onclick="consumeFood(${food.id})">已消耗</button>
                    <button class="btn-delete" onclick="deleteFood(${food.id})">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 计算过期日期
function getExpiryDate(productionDate, shelfLife) {
    const date = new Date(productionDate);
    date.setDate(date.getDate() + shelfLife);
    return date.toISOString().split('T')[0];
}

// 获取状态
function getStatus(productionDate, shelfLife) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(getExpiryDate(productionDate, shelfLife));
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return 'expired';
    if (daysLeft <= 7) return 'warning';
    return 'normal';
}

// 删除食品
function deleteFood(id) {
    if (!confirm('确定要删除这个食品记录吗？')) return;

    const foods = getFoods().filter(f => f.id !== id);
    saveFoods(foods);
    loadAndRenderFoods();
}

// 标记已消耗
function consumeFood(id) {
    if (!confirm('确定已消耗这个食品吗？')) return;

    const foods = getFoods().filter(f => f.id !== id);
    saveFoods(foods);
    loadAndRenderFoods();
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 暴露函数到全局
window.consumeFood = consumeFood;
window.deleteFood = deleteFood;