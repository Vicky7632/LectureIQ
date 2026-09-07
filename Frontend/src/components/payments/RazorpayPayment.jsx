import React from 'react'
import { toast } from 'react-hot-toast'
import { paymentApi } from '../../api/paymentapi'

const RazorpayPayment = ({ course, user, onSuccess, onClose }) => {
  const [loading, setLoading] = React.useState(false)

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async () => {
    try {
      setLoading(true)
      
      // Load Razorpay script
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        toast.error('Failed to load payment gateway')
        return
      }

      // Create order
      const orderRes = await paymentApi.createOrder(course._id)
      const { orderId, amount, currency, key } = orderRes.data

      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'LectureIQ',
        description: `Payment for ${course.title}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            // Verify payment
            await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            
            toast.success('Payment successful!')
            onSuccess()
          } catch (error) {
            toast.error('Payment verification failed')
          }
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phoneNumber || ''
        },
        theme: {
          color: '#4f46e5'
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled')
            onClose()
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-bold mb-4">Complete Payment</h3>
      
      <div className="mb-6 p-4 bg-base-200 rounded-lg">
        <div className="flex justify-between mb-2">
          <span>Course:</span>
          <span className="font-semibold">{course.title}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Price:</span>
          <span className="text-2xl font-bold">₹{course.price}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Payment Gateway:</span>
          <span>Razorpay</span>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Processing...
            </>
          ) : (
            `Pay ₹${course.price}`
          )}
        </button>
        
        <button
          onClick={onClose}
          className="btn btn-ghost w-full"
          disabled={loading}
        >
          Cancel
        </button>
      </div>

      <div className="mt-6 text-xs text-center text-gray-500">
        <p>Secure payment powered by Razorpay</p>
        <p className="mt-1">Your payment is secure and encrypted</p>
      </div>
    </div>
  )
}

export default RazorpayPayment