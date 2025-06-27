import express from 'express'
import Complaint from '../models/Complaint.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

// Apply authentication and agent authorization to all routes
router.use(authenticate)
router.use(authorize('agent', 'admin'))

// Get assigned complaints
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find({ assignedAgent: req.user._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })

    res.json({ complaints })
  } catch (error) {
    console.error('Get assigned complaints error:', error)
    res.status(500).json({ message: 'Server error while fetching complaints' })
  }
})

// Update complaint status
router.put('/complaints/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    
    if (!['pending', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const complaint = await Complaint.findOneAndUpdate(
      { 
        _id: req.params.id,
        assignedAgent: req.user._id
      },
      { status },
      { new: true }
    ).populate('user', 'name email')

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found or not assigned to you' })
    }

    res.json({
      message: 'Complaint status updated successfully',
      complaint
    })
  } catch (error) {
    console.error('Update status error:', error)
    res.status(500).json({ message: 'Server error while updating complaint status' })
  }
})

export default router