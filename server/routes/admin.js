import express from 'express'
import User from '../models/User.js'
import Complaint from '../models/Complaint.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

// Apply authentication and admin authorization to all routes
router.use(authenticate)
router.use(authorize('admin'))

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalComplaints, pendingComplaints, resolvedComplaints, totalUsers, totalAgents] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'resolved' }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'agent' })
    ])

    res.json({
      totalComplaints,
      pendingComplaints,
      resolvedComplaints,
      totalUsers,
      totalAgents
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Server error while fetching stats' })
  }
})

// Get all complaints
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('user', 'name email')
      .populate('assignedAgent', 'name email')
      .sort({ createdAt: -1 })

    res.json({ complaints })
  } catch (error) {
    console.error('Get complaints error:', error)
    res.status(500).json({ message: 'Server error while fetching complaints' })
  }
})

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })
    res.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ message: 'Server error while fetching users' })
  }
})

// Assign agent to complaint
router.put('/complaints/:id/assign', async (req, res) => {
  try {
    const { agentId } = req.body
    
    // Verify agent exists and has agent role
    const agent = await User.findById(agentId)
    if (!agent || agent.role !== 'agent') {
      return res.status(400).json({ message: 'Invalid agent ID' })
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { 
        assignedAgent: agentId,
        status: 'in-progress'
      },
      { new: true }
    ).populate('assignedAgent', 'name email')

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' })
    }

    res.json({
      message: 'Agent assigned successfully',
      complaint
    })
  } catch (error) {
    console.error('Assign agent error:', error)
    res.status(500).json({ message: 'Server error while assigning agent' })
  }
})

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body
    
    if (!['user', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      message: 'User role updated successfully',
      user
    })
  } catch (error) {
    console.error('Update role error:', error)
    res.status(500).json({ message: 'Server error while updating user role' })
  }
})

export default router