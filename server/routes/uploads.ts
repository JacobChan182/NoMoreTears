// ...existing code...

// When creating a new lecture, ALWAYS include lectureId
const newLecture = {
  lectureId: `lecture-${Date.now()}`, // or use UUID: require('uuid').v4()
  lectureTitle: req.body.lectureTitle || 'Untitled',
  courseId: req.body.courseId,
  videoUrl: uploadedVideoUrl,
  createdAt: new Date(),
  // ...other fields...
};

// ...existing code...
