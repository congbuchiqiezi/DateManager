<template>
  <view class="content">
    <view class="header">
      <text class="title">DateManager</text>
      <text class="subtitle">食品生产日期与保质期管理</text>
    </view>

    <!-- 添加表单 -->
    <view class="add-form">
      <text class="section-title">添加食品</text>
      <view class="form-item">
        <text class="label">食品名称</text>
        <input v-model="newFood.name" class="input" placeholder="例如：牛奶" />
      </view>
      <view class="form-item">
        <text class="label">生产日期</text>
        <picker mode="date" @change="onProductionDateChange">
          <view class="picker">
            <text :class="newFood.productionDate ? 'value' : 'placeholder'">
              {{ newFood.productionDate || '请选择生产日期' }}
            </text>
          </view>
        </picker>
      </view>
      <view class="form-item">
        <text class="label">保质期（天）</text>
        <input v-model.number="newFood.shelfLife" class="input" type="number" placeholder="例如：30" />
      </view>
      <button class="btn-primary" @click="addFood">添加食品</button>
    </view>

    <!-- 临期提醒 -->
    <view v-if="expiringFoods.length > 0" class="alert-section">
      <text class="section-title">临期提醒</text>
      <view v-for="item in expiringFoods" :key="item.id" class="alert-item">
        <text class="alert-name">{{ item.name }}</text>
        <text class="alert-days">{{ item.daysLeft <= 0 ? '已过期' : `剩余 ${item.daysLeft} 天` }}</text>
      </view>
    </view>

    <!-- 食品列表 -->
    <view class="food-list">
      <text class="section-title">食品列表</text>
      <view v-if="sortedFoods.length === 0" class="empty">暂无食品记录</view>
      <view v-else v-for="item in sortedFoods" :key="item.id" class="food-item">
        <view class="food-info">
          <view class="food-name-row">
            <text class="food-name">{{ item.name }}</text>
            <text :class="['status', getStatus(item)]">{{ getStatusText(item) }}</text>
          </view>
          <text class="food-date">
            生产日期：{{ item.productionDate }} | 保质期：{{ item.shelfLife }} 天 | 过期日期：{{ getExpiryDate(item) }}
          </text>
        </view>
        <view class="food-actions">
          <button class="btn-success" @click="consumeFood(item.id)">已消耗</button>
          <button class="btn-danger" @click="deleteFood(item.id)">删除</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStorage } from '@/store/food'

interface Food {
  id: number
  name: string
  productionDate: string
  shelfLife: number
  createdAt: string
}

const store = useStorage()
store.init()

const newFood = ref<Partial<Food>>({
  name: '',
  productionDate: '',
  shelfLife: null,
})

const onProductionDateChange = (e: any) => {
  newFood.value.productionDate = e.detail.value
}

const addFood = () => {
  if (!newFood.value.name || !newFood.value.productionDate || !newFood.value.shelfLife) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }

  store.add({
    id: Date.now(),
    name: newFood.value.name,
    productionDate: newFood.value.productionDate,
    shelfLife: newFood.value.shelfLife,
    createdAt: new Date().toISOString(),
  } as Food)

  newFood.value = { name: '', productionDate: '', shelfLife: null }
  uni.showToast({ title: '添加成功', icon: 'success' })
}

const getExpiryDate = (food: Food): string => {
  const date = new Date(food.productionDate)
  date.setDate(date.getDate() + food.shelfLife)
  return date.toISOString().split('T')[0]
}

const getDaysLeft = (food: Food): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiryDate = new Date(getExpiryDate(food))
  return Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const getStatus = (food: Food): string => {
  const daysLeft = getDaysLeft(food)
  if (daysLeft <= 0) return 'expired'
  if (daysLeft <= 7) return 'warning'
  return 'normal'
}

const getStatusText = (food: Food): string => {
  const status = getStatus(food)
  if (status === 'expired') return '已过期'
  if (status === 'warning') return '临期'
  return '正常'
}

const expiringFoods = computed(() => {
  return store.foods
    .map(food => ({ ...food, daysLeft: getDaysLeft(food) }))
    .filter(food => food.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft)
})

const sortedFoods = computed(() => {
  return [...store.foods].sort((a, b) => {
    const aExpiry = new Date(getExpiryDate(a))
    const bExpiry = new Date(getExpiryDate(b))
    return aExpiry.getTime() - bExpiry.getTime()
  })
})

const deleteFood = (id: number) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这个食品记录吗？',
    success: (res) => {
      if (res.confirm) {
        store.remove(id)
        uni.showToast({ title: '删除成功', icon: 'success' })
      }
    },
  })
}

const consumeFood = (id: number) => {
  uni.showModal({
    title: '提示',
    content: '确定已消耗这个食品吗？',
    success: (res) => {
      if (res.confirm) {
        store.remove(id)
        uni.showToast({ title: '已标记为已消耗', icon: 'success' })
      }
    },
  })
}
</script>

<style lang="scss" scoped>
.content {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30rpx;
}

.header {
  text-align: center;
  margin-bottom: 30rpx;

  .title {
    display: block;
    font-size: 48rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 10rpx;
  }

  .subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.add-form,
.food-list,
.alert-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.form-item {
  margin-bottom: 20rpx;

  .label {
    display: block;
    font-size: 28rpx;
    color: #555;
    margin-bottom: 10rpx;
  }

  .input {
    width: 100%;
    height: 80rpx;
    padding: 0 20rpx;
    border: 2rpx solid #e0e0e0;
    border-radius: 8rpx;
    font-size: 28rpx;
  }

  .picker {
    width: 100%;
    height: 80rpx;
    padding: 0 20rpx;
    border: 2rpx solid #e0e0e0;
    border-radius: 8rpx;
    display: flex;
    align-items: center;

    .value {
      font-size: 28rpx;
      color: #333;
    }

    .placeholder {
      font-size: 28rpx;
      color: #999;
    }
  }
}

.btn-primary {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.alert-section {
  background: #fff3cd;
  border: 1rpx solid #ffc107;

  .section-title {
    color: #856404;
  }
}

.alert-item {
  background: #fff8e1;
  padding: 20rpx;
  border-radius: 8rpx;
  margin-bottom: 10rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .alert-name {
    font-weight: 600;
    color: #856404;
  }

  .alert-days {
    color: #d32f2f;
    font-weight: 600;
  }
}

.empty {
  text-align: center;
  color: #999;
  padding: 40rpx;
  font-size: 28rpx;
}

.food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #eee;

  &:last-child {
    border-bottom: none;
  }
}

.food-info {
  flex: 1;

  .food-name-row {
    display: flex;
    align-items: center;
    margin-bottom: 10rpx;
  }

  .food-name {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
  }

  .status {
    display: inline-block;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
    font-weight: 500;
    margin-left: 16rpx;

    &.normal {
      background: #e8f5e9;
      color: #2e7d32;
    }

    &.warning {
      background: #fff3e0;
      color: #ef6c00;
    }

    &.expired {
      background: #ffebee;
      color: #c62828;
    }
  }

  .food-date {
    font-size: 26rpx;
    color: #666;
  }
}

.food-actions {
  display: flex;
  gap: 16rpx;

  .btn-success,
  .btn-danger {
    padding: 16rpx 24rpx;
    font-size: 26rpx;
    border: none;
    border-radius: 8rpx;
    color: #fff;
  }

  .btn-success {
    background: #4caf50;
  }

  .btn-danger {
    background: #f44336;
  }
}
</style>