import Bootpay from '@bootpay/client-js'
import {
  requestPaymentApprove,
  requestPaymentCreate,
  requestPaymentApproveVerify,
  requestPaymentCancelVerify,
  requestPaymentCancel,
  requestPaymentReturnVerify,
  requestPaymentVoid,
} from '@/api/payment'

const PAYMENT_APP_ID = import.meta.env.VITE_BOOTPAY_APPLICATION_ID
const INSTALLMENT = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const INSTALLMENT_STRING = INSTALLMENT.join(',')
const EXPOSUR_TYPE = Object.freeze({
  IFRAME: 'iframe',
  POPUP: 'popup',
})
const RESPONSE_EVENT = Object.freeze({
  CONFIRM: 'confirm', //분리 승인으로 결제요청시 결제 승인이 되기 전 호출되는 이벤트입니다. data에 결제정보가 포함되어 전달됩니다.
  DONE: 'done', //성공적으로 결제 승인 되었을 호출되는 이벤트입니다. data에 결제정보가 포함되어 전달됩니다.
  CANCEL: 'cancel', //결제 진행 중 구매자가 취소 혹은 닫기 버튼을 눌러 나온 경우 호출되는 이벤트입니다.
  ERROR: 'error', //결제 진행 중 오류가 발생된 경우 호출되는 이벤트입니다.
  ISSUED: 'issued', //가상계좌 발급이 완료되면 호출되는 이벤트입니다.
  CLOSE: 'close', //(앱 SDK 전용) 결제창이 닫힐때 호출됩니다. 성공, 실패, 취소에 상관없이 모두 호출됩니다. bootpay-js를 통한 웹 개발시에는 이 이벤트는 호출되지 않습니다.
})

const PAYMENT_STATUS = Object.freeze({
  VERIFYING: 'verifying',
  COMPLETE: 'complete',
  FORGED: 'forged',
  RETURNED: 'return',
  CANCELED: 'cancel',
})

const BOOTPAY_STATUS = Object.freeze({
  // 현금영수증 관련 실패
  CASH_RECEIPT_CANCEL_FAILED: -61, //현금영수증 발행취소가 실패한 상태값입니다.
  CASH_RECEIPT_ISSUE_FAILED: -60, //현금영수증 발행이 실패한 상태값입니다.

  // 자동결제(빌링키) 관련 실패
  BILLING_KEY_ISSUE_FAILED: -40, //자동결제 빌링키 발급 실패 상태값입니다.
  BILLING_KEY_CANCELLED: -11, //자동결제 빌링키 발급 취소 상태값입니다.

  // 결제 실패
  PAYMENT_APPROVAL_FAILED: -2, //결제 승인실패 오류가 발생된 상태값입니다.
  VIRTUAL_ACCOUNT_CANCELLED: -3, //가상계좌 발급 취소된 상태값입니다.
  PAYMENT_REQUEST_FAILED: -4, //결제 요청 실패가 발생된 상태값입니다.

  // 결제 진행 중 상태
  PAYMENT_PENDING: 0, //결제 대기 상태입니다. PG사 결제창이 생성되었을때의 상태입니다.
  PAYMENT_APPROVAL_IN_PROGRESS: 2, //결제승인중 상태입니다. 클라이언트 승인, 서버 승인 전 상태입니다.

  // 결제 완료 상태
  PAYMENT_COMPLETED: 1, //결제완료된 상태입니다. 부분취소가 된 상태에서 전체금액이 취소되지 않았다면, 결제완료 상태입니다.
  VIRTUAL_ACCOUNT_ISSUED: 5, //가상계좌 발급완료 및 입금 대기 상태입니다.
  PAYMENT_CANCELLED: 20, //결제취소 완료상태입니다. 결제된 금액 전액이 취소되면, 결제취소 완료상태가 됩니다.

  // 자동결제(빌링키) 상태
  BILLING_KEY_READY: 40, //자동결제 빌링키 발급 준비 상태입니다.
  BILLING_KEY_PRE_ISSUE: 41, //자동결제 빌링키 발급 이전 상태입니다. 생체인증, 비밀번호 결제시나리오에서 서버 승인 전 상태이기도 합니다.
  BILLING_KEY_ISSUED: 11, //자동결제 빌링키 발급 완료 상태값입니다.
  BILLING_KEY_SUCCESS: 42, //자동결제 빌링키 발급 성공 상태값입니다.

  // 본인인증 상태
  IDENTITY_VERIFICATION_READY: 50, //본인인증 시작 준비 상태값입니다.
  IDENTITY_VERIFICATION_COMPLETED: 12, //본인인증이 완료된 상태값입니다.

  // 현금영수증 상태
  CASH_RECEIPT_ISSUED: 60, //현금영수증을 별도 발행시 현금영수증 발행 완료된 상태값입니다.
  CASH_RECEIPT_CANCELLED: 61, //현금영수증 별도 발행시 현금영수증 발행 취소가 완료된 상태값입니다.
})
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const requestPayment = async (member, item, price, metadata, onSuccess, onError) => {
  if (!member) {
    throw {
      errorMessage: '멤버 정보가 존재하지 않습니다.',
      description: '클라이언트에 멤버정보 없음.',
    }
  }

  if (!item) {
    throw {
      errorMessage: '아이템 정보가 존재하지 않습니다.',
      description: '클라이언트에 아이템정보 없음.',
    }
  }

  try {
    const responseCreated = await requestPaymentCreate({
      username: member.name,
      itemId: item.id,
      price: price,
    })
    if (!responseCreated.data.success) {
      throw {
        errorMessage: responseCreated.data.errorMessage || '결제 생성에 실패했습니다.',
      }
    }
    const resultReceipt = await requestPaymentToBootpay(
      member,
      responseCreated.data.data.orderId,
      item,
      price,
      metadata
    )
    try {
      const responseSendReceipt = await requestPaymentApprove(resultReceipt.order_id, {
        receiptData: JSON.stringify(resultReceipt),
      })
      if (!responseSendReceipt.data.success) {
        throw {
          errorMessage: responseSendReceipt.data.errorMessage || '영수증 전송에 실패했습니다.',
        }
      }
    } catch (error) {
      await requestPaymentVoid(resultReceipt.receipt_id)
      throw error
    }
    await confirmPayment(async () => {
      return await requestPaymentApproveVerify(resultReceipt.order_id, {
        receiptId: resultReceipt.receipt_id,
        paymentStatus: PAYMENT_STATUS.COMPLETE,
      })
    }, onSuccess)
  } catch (error) {
    // 이미 객체 형태면 그대로, 아니면 객체로 변환
    const errorObj =
      typeof error === 'object' && error !== null ? error : { errorMessage: String(error) }
    if (typeof onError == 'function' && errorObj.event !== 'cancel') {
      onError(errorObj)
    }
  }
}

const requestPaymentToBootpay = async (member, orderId, item, price, shippingAddress) => {
  const response = await Bootpay.requestPayment({
    application_id: PAYMENT_APP_ID,
    price: item.price * item.qty,
    order_name: item.name,
    order_id: orderId,
    tax_free: 0,
    user: createUserData(member),
    metadata: shippingAddress,
    items: [
      {
        id: item.id,
        name: item.name,
        qty: 1,
        price: price,
      },
    ],
    extra: {
      open_type: EXPOSUR_TYPE.POPUP,
      card_quota: INSTALLMENT_STRING,
      escrow: false,
      separately_confirmed: false,
      display_error_result: true,
      timeout: 5,
    },
  })

  if (response.event === RESPONSE_EVENT.DONE) {
    return response.data
  } else if (response.event === RESPONSE_EVENT.ERROR) {
    throw response.data
  }
}

const confirmPayment = async (func, onSuccess) => {
  const maxRetries = 10
  const baseInterval = 500
  const maxInterval = 5000
  const timeoutMs = 30000
  const startTime = Date.now()
  for (let i = 0; i < maxRetries; i++) {
    if (Date.now() - startTime > timeoutMs) {
      throw {
        errorMessage: '결제 확인 지연 중입니다. 마이페이지에서 확인해주세요.',
        code: 'VERIFICATION_TIMEOUT',
      }
    }
    try {
      const response = await func()
      const data = response.data
      if (data.success) {
        if (typeof onSuccess === 'function') {
          onSuccess(data)
        }
        return
      }
      const delay = Math.min(baseInterval * Math.pow(2, i), maxInterval)
      await sleep(delay)
    } catch (error) {
      if (i === maxRetries - 1) {
        throw {
          errorMessage: '결제 확인 중 오류가 발생했습니다.',
          originalError: error,
        }
      }
      const delay = Math.min(baseInterval * Math.pow(2, i), maxInterval)
      await sleep(delay)
    }
  }

  throw {
    errorMessage: '결제 확인 지연 중입니다. 마이페이지에서 확인해주세요.',
  }
}

const createUserData = (member) => {
  return {
    id: member.id,
    username: member.name,
    phone: member.phone,
    email: member.email,
  }
}

const requestVerification = async (
  orderId,
  cancelPrice,
  username,
  cancelReason,
  verificationType,
  onSuccess,
) => {
  const resultCancel = await requestPaymentCancel(orderId, {
    orderId,
    cancelPrice,
    username,
    cancelReason,
  })

  if (!resultCancel.data.success) {
    throw {
      errorMessage: resultCancel.data.errorMessage || '취소 요청에 실패했습니다.',
      code: 'CANCEL_REQUEST_FAILED',
    }
  }

  // 응답에서 receiptId 추출
  const receiptId = resultCancel.data.receiptId || resultCancel.data.data?.receiptId

  if (!receiptId) {
    throw {
      errorMessage: '영수증 ID를 찾을 수 없습니다.',
      code: 'RECEIPT_ID_MISSING',
    }
  }

  if (onSuccess) {
    const verifyFunc =
      verificationType === PAYMENT_STATUS.CANCELED
        ? requestPaymentCancelVerify
        : requestPaymentReturnVerify

    await confirmPayment(async () => {
      return await verifyFunc(orderId, {
        receiptId,
        paymentStatus: verificationType,
      })
    }, onSuccess)
  }
}

const requestCancel = (orderId, cancelPrice, username, cancelReason, onSuccess) =>
  requestVerification(
    orderId,
    cancelPrice,
    username,
    cancelReason,
    PAYMENT_STATUS.CANCELED,
    onSuccess,
  )

const requestReturn = (orderId, cancelPrice, username, cancelReason, onSuccess) =>
  requestVerification(
    orderId,
    cancelPrice,
    username,
    cancelReason,
    PAYMENT_STATUS.RETURNED,
    onSuccess,
  )

const Payment = {
  purchase: requestPayment,
  return: requestReturn,
  cancel: requestCancel,
}

export { Payment, RESPONSE_EVENT, BOOTPAY_STATUS, PAYMENT_STATUS, EXPOSUR_TYPE }
