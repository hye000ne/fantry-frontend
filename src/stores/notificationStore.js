import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const auctions = ref([])

  const isIncludeAuction = (auctionId) => {
    return auctions.value.includes(auctionId)
  }

  const addAuction = (auctionId) => {
    if (!isIncludeAuction(auctionId)) {
      auctions.value.push(auctionId)
    }
  }
  return { auctions, isIncludeAuction, addAuction }
})
