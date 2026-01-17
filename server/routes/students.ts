import express, { Request, Response } from 'express';
import { Student } from '../models/Student';

const router = express.Router();

// Get student data
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const student = await Student.findOne({ userId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).json({ error: 'Failed to fetch student data' });
  }
});

// Assign lecture to student
router.post('/:userId/lectures', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { lectureId, lectureTitle, courseId } = req.body;

    if (!lectureId || !lectureTitle || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const student = await Student.findOne({ userId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if lecture already assigned
    const existingLecture = student.lectures.find(l => l.lectureId === lectureId);
    
    if (!existingLecture) {
      student.lectures.push({
        lectureId,
        lectureTitle,
        courseId,
        assignedAt: new Date(),
        rewindEvents: [],
      });
    }

    await student.save();

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error('Error assigning lecture to student:', error);
    res.status(500).json({ error: 'Failed to assign lecture' });
  }
});

export default router;
