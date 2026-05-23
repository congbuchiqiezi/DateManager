const STORAGE_KEY = 'datemanager_foods';

const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const foods = ref([]);
        const newFood = ref({
            name: '',
            productionDate: '',
            shelfLife: null
        });

        // 加载食品列表
        const loadFoods = () => {
            const data = localStorage.getItem(STORAGE_KEY);
            foods.value = data ? JSON.parse(data) : [];
        };

        // 保存食品列表
        const saveFoods = () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(foods.value));
        };

        // 加载完成时读取数据
        onMounted(() => {
            loadFoods();
        });

        // 添加食品
        const addFood = () => {
            if (!newFood.value.name || !newFood.value.productionDate || !newFood.value.shelfLife) {
                alert('请填写完整信息');
                return;
            }

            const food = {
                id: Date.now(),
                name: newFood.value.name.trim(),
                productionDate: newFood.value.productionDate,
                shelfLife: newFood.value.shelfLife,
                createdAt: new Date().toISOString()
            };

            foods.value.push(food);
            saveFoods();

            // 重置表单
            newFood.value = {
                name: '',
                productionDate: '',
                shelfLife: null
            };
        };

        // 计算过期日期
        const getExpiryDate = (food) => {
            const date = new Date(food.productionDate);
            date.setDate(date.getDate() + food.shelfLife);
            return date.toISOString().split('T')[0];
        };

        // 获取状态
        const getStatus = (food) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiryDate = new Date(getExpiryDate(food));
            const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            if (daysLeft <= 0) return 'expired';
            if (daysLeft <= 7) return 'warning';
            return 'normal';
        };

        // 获取状态文本
        const getStatusText = (food) => {
            const status = getStatus(food);
            if (status === 'expired') return '已过期';
            if (status === 'warning') return '临期';
            return '正常';
        };

        // 计算剩余天数
        const getDaysLeft = (food) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiryDate = new Date(getExpiryDate(food));
            return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        };

        // 临期食品（7天内）
        const expiringFoods = computed(() => {
            return foods.value
                .map(food => ({ ...food, daysLeft: getDaysLeft(food) }))
                .filter(food => food.daysLeft <= 7)
                .sort((a, b) => a.daysLeft - b.daysLeft);
        });

        // 按过期日期排序的所有食品
        const sortedFoods = computed(() => {
            return [...foods.value]
                .map(food => ({ ...food, daysLeft: getDaysLeft(food) }))
                .sort((a, b) => {
                    const aExpiry = new Date(getExpiryDate(a));
                    const bExpiry = new Date(getExpiryDate(b));
                    return aExpiry - bExpiry;
                });
        });

        // 删除食品
        const deleteFood = (id) => {
            if (!confirm('确定要删除这个食品记录吗？')) return;
            foods.value = foods.value.filter(f => f.id !== id);
            saveFoods();
        };

        // 标记已消耗
        const consumeFood = (id) => {
            if (!confirm('确定已消耗这个食品吗？')) return;
            foods.value = foods.value.filter(f => f.id !== id);
            saveFoods();
        };

        return {
            foods,
            newFood,
            expiringFoods,
            sortedFoods,
            addFood,
            getExpiryDate,
            getStatus,
            getStatusText,
            deleteFood,
            consumeFood
        };
    }
}).mount('#app');