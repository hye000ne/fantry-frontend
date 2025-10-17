import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePaymentStore = defineStore('payment', () => {
  // Auction context
  const auctionId = ref(null)
  const auctionDetails = ref(null)

  // User information (주문자 정보)
  const userInfo = ref({
    memberId: null,
    name: '',
    phone: '',
    email: '',
  })

  // Delivery information (배송지 정보)
  const deliveryInfo = ref({
    recipientName: '',
    recipientPhone: '',
    addressId: null,
    address: '',
    detailAddress: '',
    deliveryRequest: '',
  })

  // Legacy fields (for compatibility)
  const productInfo = ref(null)
  const serviceCharger = ref(0)
  const shippingAddress = ref(null)
  const shippingAddressDetail = ref(null)
  const paymentResult = ref(null)

  // Set auction context
  const setAuctionContext = (id, details = null) => {
    auctionId.value = id
    auctionDetails.value = details
    // Backup to sessionStorage
    sessionStorage.setItem('paymentAuctionId', id)
    if (details) {
      sessionStorage.setItem('paymentAuctionDetails', JSON.stringify(details))
    }
  }

  // Set user information
  const setUserInfo = (info) => {
    userInfo.value = { ...info }
    sessionStorage.setItem('paymentUserInfo', JSON.stringify(info))
  }

  // Set delivery information
  const setDeliveryInfo = (info) => {
    deliveryInfo.value = { ...info }
    sessionStorage.setItem('paymentDeliveryInfo', JSON.stringify(info))
  }

  // Restore from sessionStorage (for page refresh)
  const restoreFromSession = () => {
    const savedAuctionId = sessionStorage.getItem('paymentAuctionId')
    const savedAuctionDetails = sessionStorage.getItem('paymentAuctionDetails')
    const savedUserInfo = sessionStorage.getItem('paymentUserInfo')
    const savedDeliveryInfo = sessionStorage.getItem('paymentDeliveryInfo')

    if (savedAuctionId) {
      auctionId.value = savedAuctionId
    }
    if (savedAuctionDetails) {
      try {
        auctionDetails.value = JSON.parse(savedAuctionDetails)
      } catch (e) {
        console.error('Failed to parse auction details:', e)
      }
    }
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
      } catch (e) {
        console.error('Failed to parse user info:', e)
      }
    }
    if (savedDeliveryInfo) {
      try {
        deliveryInfo.value = JSON.parse(savedDeliveryInfo)
      } catch (e) {
        console.error('Failed to parse delivery info:', e)
      }
    }
  }

  // Validate payment flow state
  const isFlowValid = () => {
    console.log(auctionId.value)
    console.log(userInfo.value.name)
    console.log(userInfo.value.phone)
    console.log(userInfo.value.email)
    console.log(deliveryInfo.value.recipientName)
    console.log(deliveryInfo.value.recipientPhone)
    console.log(deliveryInfo.value.address)

    return (
      auctionId.value &&
      userInfo.value.name &&
      userInfo.value.phone &&
      userInfo.value.email &&
      deliveryInfo.value.recipientName &&
      deliveryInfo.value.recipientPhone &&
      deliveryInfo.value.address
    )
  }

  // Reset all payment state
  const reset = () => {
    auctionId.value = null
    auctionDetails.value = null
    userInfo.value = { name: '', phone: '', email: '' }
    deliveryInfo.value = {
      recipientName: '',
      recipientPhone: '',
      addressId: null,
      address: '',
      detailAddress: '',
      deliveryRequest: '',
    }
    productInfo.value = null
    serviceCharger.value = 0
    shippingAddress.value = null
    shippingAddressDetail.value = null
    paymentResult.value = null

    // Clear sessionStorage
    sessionStorage.removeItem('paymentAuctionId')
    sessionStorage.removeItem('paymentAuctionDetails')
    sessionStorage.removeItem('paymentUserInfo')
    sessionStorage.removeItem('paymentDeliveryInfo')
    sessionStorage.removeItem('checkoutProduct')
    sessionStorage.removeItem('checkoutDeliveryInfo')
    sessionStorage.removeItem('paymentResult')
    sessionStorage.removeItem('deliveryInfo')
  }

  return {
    // State
    auctionId,
    auctionDetails,
    userInfo,
    deliveryInfo,
    productInfo,
    serviceCharger,
    shippingAddress,
    shippingAddressDetail,
    paymentResult,

    // Actions
    setAuctionContext,
    setUserInfo,
    setDeliveryInfo,
    restoreFromSession,
    isFlowValid,
    reset,
  }
})
