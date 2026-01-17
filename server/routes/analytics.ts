import express, { Request, Response } from 'express';
import { Student } from '../models/Student';
import { Lecturer } from '../models/Lecturer';

const router = express.Router();

// Track rewind event for a student
router.post('/rewind', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      pseudonymId,
      lectureId,
      lectureTitle,
      courseId,
      rewindEvent,
    } = req.body;

    if (!userId || !lectureId || !rewindEvent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update Student collection
    const student = await Student.findOne({ userId });
    
    if (!student) {
      // Create new student if doesn't exist
      const newStudent = new Student({
        userId,
        pseudonymId,
        courseIds: [courseId],
        lectures: [{
          lectureId,
          lectureTitle,
          courseId,
          rewindEvents: [rewindEvent],
          lastAccessedAt: new Date(),
        }],
      });
      await newStudent.save();
    } else {
      // Update existing student
      const lectureProgress = student.lectures.find(l => l.lectureId === lectureId);
      
      if (!lectureProgress) {
        // Add new lecture assignment
        student.lectures.push({
          lectureId,
          lectureTitle,
          courseId,
          assignedAt: new Date(),
          rewindEvents: [rewindEvent],
          lastAccessedAt: new Date(),
        });
      } else {
        // Add rewind event to existing lecture
        lectureProgress.rewindEvents.push(rewindEvent);
        lectureProgress.lastAccessedAt = new Date();
      }
      
      await student.save();
    }

    // Update Lecturer collection
    // Find lecturer who owns this lecture (by courseId and lectureId)
    // First, try to find by lectureId
    let lecturer = await Lecturer.findOne({ 'lectures.lectureId': lectureId });
    
    // If lecturer not found, we may need to create one based on the courseId
    // For now, we'll try to find or create based on instructor pattern
    // In a real app, you'd have a mapping of courseId -> instructorId
    // For this implementation, we'll assume the instructor ID is derived from course
    if (!lecturer) {
      // Try to find lecturer by course pattern (instructor-1 is the default instructor)
      const instructorId = 'instructor-1'; // In production, get from courseId mapping
      lecturer = await Lecturer.findOne({ userId: instructorId });
      
      if (!lecturer) {
        // Create new lecturer if doesn't exist
        lecturer = new Lecturer({
          userId: instructorId,
          lectures: [{
            lectureId,
            lectureTitle,
            courseId,
            createdAt: new Date(),
            studentRewindEvents: [{
              studentId: userId,
              studentPseudonymId: pseudonymId,
              rewindEvents: [rewindEvent],
            }],
          }],
        });
        await lecturer.save();
      } else {
        // Check if lecture already exists in lecturer's lectures
        const existingLecture = lecturer.lectures.find(l => l.lectureId === lectureId);
        
        if (!existingLecture) {
          // Add lecture to existing lecturer
          lecturer.lectures.push({
            lectureId,
            lectureTitle,
            courseId,
            createdAt: new Date(),
            studentRewindEvents: [{
              studentId: userId,
              studentPseudonymId: pseudonymId,
              rewindEvents: [rewindEvent],
            }],
          });
          await lecturer.save();
        } else {
          // Lecture exists, add rewind event
          const studentRewindData = existingLecture.studentRewindEvents.find(
            s => s.studentId === userId
          );
          
          if (!studentRewindData) {
            existingLecture.studentRewindEvents.push({
              studentId: userId,
              studentPseudonymId: pseudonymId,
              rewindEvents: [rewindEvent],
            });
          } else {
            studentRewindData.rewindEvents.push(rewindEvent);
          }
          
          await lecturer.save();
        }
      }
    } else {
      // Lecturer found with lecture
      const lecture = lecturer.lectures.find(l => l.lectureId === lectureId);
      
      if (lecture) {
        const studentRewindData = lecture.studentRewindEvents.find(
          s => s.studentId === userId
        );
        
        if (!studentRewindData) {
          // Add new student to lecture
          lecture.studentRewindEvents.push({
            studentId: userId,
            studentPseudonymId: pseudonymId,
            rewindEvents: [rewindEvent],
          });
        } else {
          // Add rewind event to existing student
          studentRewindData.rewindEvents.push(rewindEvent);
        }
        
        await lecturer.save();
      }
    }

    res.status(200).json({ success: true, message: 'Rewind event tracked' });
  } catch (error) {
    console.error('Error tracking rewind event:', error);
    res.status(500).json({ error: 'Failed to track rewind event' });
  }
});

export default router;
