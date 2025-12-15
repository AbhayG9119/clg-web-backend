import Contact from '../models/Contact.js';

// Submit Contact
export const submitContact = async (req, res) => {
  try {
    const { name, email, phone, location, subject, message } = req.body;
    const attachment = req.file ? req.file.path : null;

    const newContact = new Contact({
      name,
      email,
      phone,
      location,
      subject,
      message,
      attachment
    });

    await newContact.save();

    res.status(201).json({ message: 'Contact submitted successfully', contact: newContact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all Contacts for admin
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
