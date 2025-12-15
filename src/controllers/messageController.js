import Message from '../models/Message.js';

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverModel, type, content, subject } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.role === 'staff' ? 'Faculty' : (req.user.role === 'student' ? 'studentModel' : 'Admin'); // Assuming role in req.user

    const message = new Message({
      senderId,
      senderModel,
      receiverId,
      receiverModel,
      type: type || 'message',
      content,
      subject: subject || ''
    });

    await message.save();
    res.status(201).json({ message: 'Message sent', message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages for current user (inbox)
const getInbox = async (req, res) => {
  try {
    const userId = req.user.id;
    const userModel = req.user.role === 'staff' ? 'Faculty' : (req.user.role === 'student' ? 'studentModel' : 'Admin');

    const messages = await Message.find({ receiverId: userId, receiverModel: userModel })
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get sent messages
const getSent = async (req, res) => {
  try {
    const userId = req.user.id;
    const userModel = req.user.role === 'staff' ? 'Faculty' : (req.user.role === 'student' ? 'studentModel' : 'Admin');

    const messages = await Message.find({ senderId: userId, senderModel: userModel })
      .populate('receiverId', 'name email')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json({ message: 'Marked as read', message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { sendMessage, getInbox, getSent, markAsRead };
