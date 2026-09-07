import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { DollarSign, Calendar, User, BookOpen, Search, Download } from 'lucide-react'
import { adminApi } from '../../api/adminApi'

const AdminPayments = () => {
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({ totalRevenue: 0, totalTransactions: 0 })

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredPayments(payments.filter(p => 
        p.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.providerPaymentId?.includes(searchTerm)
      ))
    } else {
      setFilteredPayments(payments)
    }
  }, [payments, searchTerm])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const [paymentsRes, revenueRes] = await Promise.all([
        adminApi.getAllPayments(),
        adminApi.getRevenueStats()
      ])
      setPayments(paymentsRes.data.payments || [])
      setStats(revenueRes.data)
    } catch (error) {
      console.error('Failed to fetch payments:', error)
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const headers = ['Student', 'Email', 'Course', 'Amount', 'Date', 'Status', 'Transaction ID']
    const rows = filteredPayments.map(p => [
      `${p.student?.firstName || ''} ${p.student?.lastName || ''}`,
      p.student?.email || '',
      p.course?.title || '',
      `₹${p.amount}`,
      new Date(p.createdAt).toLocaleDateString(),
      p.status,
      p.providerPaymentId || ''
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const formatAmount = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-gray-600 mt-1">
            Total Revenue: <span className="font-bold text-success">{formatAmount(stats.totalRevenue)}</span> • {stats.totalTransactions} transactions
          </p>
        </div>
        <button onClick={handleExport} className="btn btn-outline btn-sm">
          <Download size={16} className="mr-2" />
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="form-control w-full md:w-96">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by student, course, or transaction ID..."
            className="input input-bordered w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg"></span></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <div>
                        <div className="font-medium">{payment.student?.firstName} {payment.student?.lastName}</div>
                        <div className="text-xs text-gray-500">{payment.student?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-gray-400" />
                      <span className="font-medium">{payment.course?.title}</span>
                    </div>
                  </td>
                  <td className="font-bold">{formatAmount(payment.amount, payment.currency)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      payment.status === 'success' ? 'badge-success' :
                      payment.status === 'failed' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-mono">{payment.providerPaymentId || payment.providerOrderId || '—'}</span>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr><td colSpan="6" className="text-center py-8">No payments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPayments