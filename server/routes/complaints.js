import express from 'express'
import multer from 'multer'
import Complaint from '../models/Complaint.js'
import Message from '../models/Message.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'), false)
    }
  }
})

// Create complaint
router.post('/', authenticate, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, category, priority, contactPhone, address } = req.body
    
    const attachments = req.files ? req.files.map(file => file.filename) : []
    
    const complaint = new Complaint({
      title,
      description,
      category,
      priority,
      contactPhone,
      address,
      attachments,
      user: req.user._id
    })

    await complaint.save()
    await complaint.populate('user', 'name email')

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint
    })
  } catch (error) {
    console.error('Create complaint error:', error)
    res.status(500).json({ message: 'Server error while creating complaint' })
  }
})

// Get user's complaints
router.get('/my-complaints', authenticate, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id })
      .populate('assignedAgent', 'name email')
      .sort({ createdAt: -1 })

    res.json({ complaints })
  } catch (error) {
    console.error('Get complaints error:', error)
    res.status(500).json({ message: 'Server error while fetching complaints' })
  }
})

// Get complaint by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedAgent', 'name email')

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' })
    }

    // Check if user owns the complaint or is an agent/admin
    if (complaint.user._id.toString() !== req.user._id.toString() && 
        !['agent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json({ complaint })
  } catch (error) {
    console.error('Get complaint error:', error)
    res.status(500).json({ message: 'Server error while fetching complaint' })
  }
})

// Get messages for a complaint
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' })
    }

    // Check access permissions
    if (complaint.user.toString() !== req.user._id.toString() && 
        !['agent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const messages = await Message.find({ complaint: req.params.id })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 })

    res.json({ messages })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ message: 'Server error while fetching messages' })
  }
})

// Send message
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const { message } = req.body
    
    const complaint = await Complaint.findById(req.params.id)
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' })
    }

    // Check access permissions
    if (complaint.user.toString() !== req.user._id.toString() && 
        !['agent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const newMessage = new Message({
      complaint: req.params.id,
      sender: req.user._id,
      message
    })

    await newMessage.save()
    await newMessage.populate('sender', 'name role')

    res.status(201).json({
      message: 'Message sent successfully',
      message: newMessage
    })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ message: 'Server error while sending message' })
  }
})

export default router