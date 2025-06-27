import mongoose from 'mongoose'

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Product Quality',
      'Service Issue',
      'Billing Problem',
      'Delivery Issue',
      'Technical Support',
      'Account Access',
      'Refund Request',
      'Other'
    ]
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contactPhone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  attachments: [{
    type: String
  }],
  resolution: {
    type: String
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Update resolvedAt when status changes to resolved
complaintSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date()
    } else if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date()
    }
  }
  next()
})

export default mongoose.model('Complaint', complaintSchema)