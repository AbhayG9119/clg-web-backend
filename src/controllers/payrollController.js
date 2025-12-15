import Payroll from '../models/Payroll.js';
import Faculty from '../models/Faculty.js';

// Get staff's payroll history
const getPayroll = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { month } = req.query; // Optional filter by month

    let query = { staffId };
    if (month) {
      query.month = month;
    }

    const payrolls = await Payroll.find(query)
      .populate('staffId', 'name designation')
      .sort({ createdAt: -1 });

    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate payslip for a month (basic calculation)
const generatePayslip = async (req, res) => {
  try {
    const { month } = req.body; // e.g., "2024-10"
    const staffId = req.user.id;

    const staff = await Faculty.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Basic calculation: assume base from staff.basicSalary, add allowances, deduct
    const baseSalary = staff.basicSalary || 0;
    const allowances = [
      { type: 'HRA', amount: baseSalary * 0.24 }, // 24% HRA example
      { type: 'DA', amount: baseSalary * 0.12 }   // 12% DA example
    ];
    const deductions = [
      { type: 'PF', amount: baseSalary * 0.12 },  // 12% PF example
      { type: 'Tax', amount: baseSalary * 0.05 }  // 5% Tax example
    ];

    const allowanceTotal = allowances.reduce((sum, a) => sum + a.amount, 0);
    const deductionTotal = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netSalary = baseSalary + allowanceTotal - deductionTotal;

    // Check if already generated
    let payroll = await Payroll.findOne({ staffId, month });
    if (payroll) {
      return res.status(400).json({ message: 'Payslip already generated for this month' });
    }

    payroll = new Payroll({
      staffId,
      month,
      baseSalary,
      allowances,
      deductions,
      netSalary,
      status: 'generated'
      // payslipUrl would be generated via PDF lib or similar, but placeholder for now
    });

    await payroll.save();
    res.status(201).json({ message: 'Payslip generated', payroll });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getPayroll, generatePayslip };
