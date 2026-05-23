import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Food {
  id: number
  name: string
  productionDate: string
  shelfLife: number
  createdAt: string
}

const STORAGE_KEY = 'datemanager_foods'

export const useStorage = defineStore('food', () => {
  const foods = ref<Food[]>([])

  const init = () => {
    const data = uni.getStorageSync(STORAGE_KEY)
    foods.value = data ? JSON.parse(data) : []
  }

  const save = () => {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(foods.value))
  }

  const add = (food: Food) => {
    foods.value.push(food)
    save()
  }

  const remove = (id: number) => {
    foods.value = foods.value.filter(f => f.id !== id)
    save()
  }

  return {
    foods,
    init,
    add,
    remove,
  }
})