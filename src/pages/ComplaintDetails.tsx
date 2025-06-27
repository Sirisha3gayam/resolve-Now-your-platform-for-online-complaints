import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Send, 
  FileText,
  Download
} from 'lucide-react'

interface Complaint {
  _id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  category: string
  contactPhone?: string
  address?: string
  attachments: string[]
  assignedAgent?: {
    _id: string
    name: string
    email: string
  }
  user: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface Message {
  _id: string
  sender: {
    _id: string
    name: string
    role: string
  }
  message: string
  createdAt: string
}

const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (id) {
      fetchComplaintDetails()
      fetchMessages()
    }
  }, [id])

  const fetchComplaintDetails = async () => {
    try {
      const response = await axios.get(`/api/complaints/${id}`)
      setComplaint(response.data.complaint)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch complaint details')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/complaints/${id}/messages`)
      setMessages(response.data.messages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSendingMessage(true)
    try {
      const response = await axios.post(`/api/complaints/${id}/messages`, {
        message: newMessage
      })
      
      setMessages(prev => [...prev, response.data.message])
      setNewMessage('')
      toast.success('Message sent successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />
      case 'in-progress':
        return <AlertCircle className="h-5 w-5" />
      case 'resolved':
        return <CheckCircle className="h-5 w-5" />
      case 'closed':
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-badge status-pending'
      case 'in-progress':
        return 'status-badge status-in-progress'
      case 'resolved':
        return 'status-badge status-resolved'
      case 'closed':
        return 'status-badge status-closed'
      default:
        return 'status-badge status-pending'
    }
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Complaint not found</h1>
          <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Complaint Details</h1>
          <div className="flex items-center space-x-3">
            <span className={getStatusClass(complaint.status)}>
              {getStatusIcon(complaint.status)}
              <span className="ml-1 capitalize">{complaint.status.replace('-', ' ')}</span>
            </span>
            <span className={`status-badge ${getPriorityClass(complaint.priority)}`}>
              {complaint.priority.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Info */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{complaint.title}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <span className="ml-2 text-gray-600">{complaint.category}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-gray-600">
                  {format(new Date(complaint.createdAt), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <span className="ml-2 text-gray-600">
                  {format(new Date(complaint.updatedAt), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
              {complaint.assignedAgent && (
                <div>
                  <span className="font-medium text-gray-700">Assigned Agent:</span>
                  <span className="ml-2 text-gray-600">{complaint.assignedAgent.name}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">Description:</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{complaint.description}</p>
            </div>

            {(complaint.contactPhone || complaint.address) && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Contact Information:</h3>
                {complaint.contactPhone && (
                  <p className="text-gray-600">Phone: {complaint.contactPhone}</p>
                )}
                {complaint.address && (
                  <p className="text-gray-600">Address: {complaint.address}</p>
                )}
              </div>
            )}

            {complaint.attachments.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Attachments:</h3>
                <div className="space-y-2">
                  {complaint.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{attachment}</span>
                      <button className="text-primary-600 hover:text-primary-700">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication</h3>
            
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No messages yet</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.sender._id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender._id === user?.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {message.sender.name} ({message.sender.role})
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 input-field"
                disabled={sendingMessage}
              />
              <button
                type="submit"
                disabled={sendingMessage || !newMessage.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h3>
            <div className="space-y-3">
              <div className={`flex items-center space-x-3 ${complaint.status === 'pending' ? 'text-yellow-600' : 'text-gray-400'}`}>
                <Clock className="h-4 w-4" />
                <span className="text-sm">Pending</span>
              </div>
              <div className={`flex items-center space-x-3 ${complaint.status === 'in-progress' ? 'text-blue-600' : 'text-gray-400'}`}>
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">In Progress</span>
              </div>
              <div className={`flex items-center space-x-3 ${complaint.status === 'resolved' ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Resolved</span>
              </div>
              <div className={`flex items-center space-x-3 ${complaint.status === 'closed' ? 'text-gray-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Closed</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full btn-secondary text-left">
                Request Update
              </button>
              <button className="w-full btn-secondary text-left">
                Escalate Issue
              </button>
              {complaint.status === 'resolved' && (
                <button className="w-full btn-primary text-left">
                  Mark as Closed
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComplaintDetails