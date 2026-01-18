def get_segments_for_quiz(db, lecture_id):
    if db is None:
        print("❌ Database not connected")
        return "ERROR: Database not connected."
    
    if not lecture_id:
        print("❌ No lecture ID provided")
        return "ERROR: No lecture ID provided."
    
    print(f"🔍 Searching for lecture_id: {lecture_id}")
    
    # Try lecturers first
    collection = db["lecturers"]
    doc = collection.find_one(
        {"lectures.lectureId": lecture_id},
        {"lectures.$": 1}
    )

    # Fallback to courses if not found in lecturers
    if not doc or "lectures" not in doc or not doc["lectures"]:
        print("ℹ️ Not found in lecturers, falling back to courses")
        courses_col = db["courses"]
        doc = courses_col.find_one(
            {"lectures.lectureId": lecture_id},
            {"lectures.$": 1}
        )

    if not doc or "lectures" not in doc or not doc["lectures"]:
        print(f"❌ No lecture found with lectureId: {lecture_id}")
        # Try to find any lecture to help debug
        try:
            sample_doc = collection.find_one({}, {"lectures": {"$slice": 1}})
            if sample_doc and "lectures" in sample_doc and len(sample_doc["lectures"]) > 0:
                print(f"💡 Sample lectureId from lecturers: {sample_doc['lectures'][0].get('lectureId')}")
            sample_doc2 = db["courses"].find_one({}, {"lectures": {"$slice": 1}})
            if sample_doc2 and "lectures" in sample_doc2 and len(sample_doc2["lectures"]) > 0:
                print(f"💡 Sample lectureId from courses: {sample_doc2['lectures'][0].get('lectureId')}")
        except Exception as e:
            print(f"⚠️ Debug sampling failed: {e}")
        return f"ERROR: No segments found for lecture {lecture_id}."

    try:
        lecture_data = doc["lectures"][0]
        print(f"✅ Found lecture: {lecture_data.get('lectureTitle')}")
        
        raw_meta = lecture_data.get("rawAiMetaData", {})
        segments = raw_meta.get("segments", [])
        
        print(f"📊 Found {len(segments)} segments")

        if not segments:
            return f"ERROR: TwelveLabs data is still processing for lecture {lecture_id}."

        context = "LECTURE DATA FOR QUIZ GENERATION:\n"
        for s in segments:
            context += f"- Topic: {s.get('title')}\n  Summary: {s.get('summary')}\n\n"
        
        print(f"✅ Returning context with {len(segments)} segments")
        return context
    except Exception as e:
        print(f"❌ Error parsing lecture segments for {lecture_id}: {e}")
        import traceback
        traceback.print_exc()
        return f"ERROR: Failed to read lecture content for {lecture_id}."