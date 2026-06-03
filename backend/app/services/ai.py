import json
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai
import chromadb
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Journal, Goal, Habit, HabitLog

logger = logging.getLogger("app.ai")

# Initialize Chroma Client dynamically
def get_chroma_client():
    if settings.CHROMA_HOST and settings.CHROMA_HOST != "localhost":
        try:
            return chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
        except Exception as e:
            logger.warning(f"Could not connect to ChromaDB host {settings.CHROMA_HOST}:{settings.CHROMA_PORT}, falling back to local persistent store. Error: {e}")
    return chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)

def get_journal_collection():
    try:
        client = get_chroma_client()
        return client.get_or_create_collection(name="user_journals")
    except Exception as e:
        logger.error(f"Error accessing ChromaDB collection: {e}")
        return None

def is_gemini_active() -> bool:
    return bool(settings.GEMINI_API_KEY) and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE"

def get_embedding(text: str, is_query: bool = False) -> List[float]:
    """Generate text embeddings using Gemini Embedding API."""
    if not is_gemini_active():
        return [0.0] * 768
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        task_type = "retrieval_query" if is_query else "retrieval_document"
        result = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type=task_type
        )
        return result['embedding']
    except Exception as e:
        logger.error(f"Gemini embedding error: {e}")
        return [0.0] * 768

def analyze_journal(text: str) -> Dict[str, Any]:
    """Analyze journal text to extract mood and descriptive tags."""
    fallback_result = {
        "mood": "Neutral",
        "tags": ["personal"]
    }
    
    if not is_gemini_active():
        # Heuristic fallback
        lower_text = text.lower()
        mood = "Neutral"
        if any(w in lower_text for w in ["happy", "glad", "great", "joy", "excited", "awesome"]):
            mood = "Excited" if "excited" in lower_text else "Happy"
        elif any(w in lower_text for w in ["sad", "depressed", "down", "cry", "lonely", "bad"]):
            mood = "Sad"
        elif any(w in lower_text for w in ["stress", "anxious", "worry", "tired", "busy", "hard"]):
            mood = "Stressed"
        elif any(w in lower_text for w in ["motivate", "goal", "work", "focus", "achieve", "grow"]):
            mood = "Motivated"
            
        tags = []
        words = lower_text.split()
        potential_tags = ["work", "health", "family", "learning", "finance", "hobby", "social", "fitness"]
        for tag in potential_tags:
            if tag in lower_text:
                tags.append(tag)
        if not tags:
            tags = ["journal"]
        return {"mood": mood, "tags": tags[:4]}

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = (
            "Analyze the following journal entry. Output a JSON object (and nothing else) "
            "containing two keys:\n"
            "1. 'mood': One string from [Happy, Sad, Neutral, Motivated, Excited, Stressed].\n"
            "2. 'tags': A list of 1-4 short, lowercase keyword strings representing the key topics of the journal entry.\n\n"
            f"Journal Entry:\n\"\"\"\n{text}\n\"\"\"\n"
        )
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        data = json.loads(response.text.strip())
        # Validate keys
        if "mood" in data and "tags" in data:
            return data
        return fallback_result
    except Exception as e:
        logger.error(f"Gemini journal analysis error: {e}")
        return fallback_result

def upsert_journal_vector(journal_id: int, user_id: int, text: str, date_str: str):
    """Upsert journal vector and metadata into ChromaDB."""
    collection = get_journal_collection()
    if collection is None:
        return
    
    embedding = get_embedding(text)
    # Check if vector elements are all zero (indicates failure/no key) -> skip if they are all zero
    # actually, chroma doesn't support empty/zero vectors well, but if we don't have api key we don't strictly need vector storage working.
    if all(v == 0.0 for v in embedding):
        return
        
    try:
        collection.upsert(
            ids=[str(journal_id)],
            embeddings=[embedding],
            metadatas=[{"user_id": user_id, "date": date_str}],
            documents=[text]
        )
    except Exception as e:
        logger.error(f"ChromaDB upsert error: {e}")

def delete_journal_vector(journal_id: int):
    """Delete a journal entry from ChromaDB."""
    collection = get_journal_collection()
    if collection is None:
        return
    try:
        collection.delete(ids=[str(journal_id)])
    except Exception as e:
        logger.error(f"ChromaDB delete error: {e}")

def query_journal_vectors(user_id: int, query_text: str, n_results: int = 5) -> List[Dict[str, Any]]:
    """Retrieve semantically relevant journal texts from ChromaDB."""
    collection = get_journal_collection()
    if collection is None:
        return []
        
    embedding = get_embedding(query_text, is_query=True)
    if all(v == 0.0 for v in embedding):
        return []
        
    try:
        results = collection.query(
            query_embeddings=[embedding],
            where={"user_id": user_id},
            n_results=n_results
        )
        journals = []
        if results and 'documents' in results and results['documents']:
            documents = results['documents'][0]
            metadatas = results['metadatas'][0] if 'metadatas' in results and results['metadatas'] else []
            for i in range(len(documents)):
                date_str = metadatas[i].get("date", "Unknown") if i < len(metadatas) else "Unknown"
                journals.append({
                    "content": documents[i],
                    "date": date_str
                })
        return journals
    except Exception as e:
        logger.error(f"ChromaDB query error: {e}")
        return []

def generate_twin_response(message: str, chat_history: List[Dict[str, Any]], user_id: int, db: Session) -> str:
    """Generate Digital Twin conversational response with RAG context."""
    # 1. Retrieve RAG context (semantically relevant journals)
    relevant_journals = query_journal_vectors(user_id, message, n_results=5)
    
    # 2. Get recent metadata (goals and habits)
    goals = db.query(Goal).filter(Goal.user_id == user_id, Goal.is_archived == False).all()
    habits = db.query(Habit).filter(Habit.user_id == user_id).all()
    
    # 3. Format context strings
    journal_context = "\n".join([f"- [{j['date']}] {j['content']}" for j in relevant_journals])
    goal_context = "\n".join([f"- {g.title} ({g.category}): {g.progress}% complete. Completed: {g.is_completed}" for g in goals])
    habit_context = "\n".join([f"- {h.name} (Frequency: {h.frequency})" for h in habits])
    
    # 4. Formulate System Prompt
    system_prompt = (
        "You are the user's Digital Twin - an AI clone of their personality, reflecting their behaviors, goals, "
        "and thoughts. You speak in the FIRST PERSON ('I', 'me', 'my'), representing their own inner reflections "
        "and double. Speak in a warm, reflective, supportive, and slightly analytical tone. "
        "Acknowledge the user's thoughts and remind them of their goals, habits, and past journals when relevant.\n\n"
        "Here is the context about yourself (retrieved from your history):\n"
        "--- PAST JOURNAL MEMORIES ---\n"
        f"{journal_context or 'No past memories found.'}\n\n"
        "--- CURRENT GOALS ---\n"
        f"{goal_context or 'No active goals.'}\n\n"
        "--- ACTIVE HABITS ---\n"
        f"{habit_context or 'No active habits.'}\n"
        "-------------------------------\n\n"
        "Guidelines:\n"
        "- Mirror the sentiment of the user (e.g. support, challenge, plan).\n"
        "- Refer to specific memories (dates) or goals if they tie into the user's message.\n"
        "- Keep it conversational, empathetic, and engaging. Avoid long bulleted essays unless compiling a plan.\n"
    )
    
    # Formulate conversational prompt
    gemini_messages = []
    # Add history
    for msg in chat_history[-10:]:  # Keep last 10 messages
        role = "user" if msg.get("sender") == "user" else "model"
        gemini_messages.append({"role": role, "parts": [msg.get("text")]})
        
    # Append system prompt and active query
    prompt_with_system = f"{system_prompt}\n\nUser Message: {message}\n\nTwin Response:"
    
    if not is_gemini_active():
        # Fallback response
        fallback_replies = [
            "I'm here reflecting on our goals. I see we have some tasks we're working on, like our habits. Let's stay consistent today!",
            "Looking back at our memories, we've had our ups and downs, but we are growing. Tell me, what's on our mind right now?",
            "As your digital double, I agree that we need to focus on what matters. Let's review our goals and keep pushing forward."
        ]
        import random
        return random.choice(fallback_replies)

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # We can construct the request
        chat = model.start_chat(history=gemini_messages[:-1] if len(gemini_messages) > 1 else [])
        response = chat.send_message(prompt_with_system)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini twin response error: {e}")
        return "I'm experiencing a connection glitch with our cloud mind right now. But let's stay focused on our journals and goals!"

def generate_evolution_report(user_id: int, db: Session) -> Dict[str, Any]:
    """Generate structured personality evolution report."""
    fallback_report = {
        "summary": "You are actively building habits and charting out your goals. Consistent journal writing will help refine this analysis.",
        "traits": [
            {"name": "Openness", "score": 60, "description": "Curious and open to new experiences."},
            {"name": "Conscientiousness", "score": 50, "description": "Structured in planning goals."},
            {"name": "Extraversion", "score": 40, "description": "Reflective and focused on inner thoughts."},
            {"name": "Agreeableness", "score": 70, "description": "Supportive and collaborative in self-reflections."},
            {"name": "Neuroticism", "score": 50, "description": "Experiencing standard day-to-day emotional variances."}
        ],
        "strengths": ["Goal setting", "Self-reflection"],
        "weaknesses": ["Consistency in habit completion"],
        "evolution_index": 55,
        "recommendations": [
            "Write in your journal at least 3 times a week to improve AI mapping.",
            "Break down large goals into smaller, weekly habits."
        ]
    }
    
    # Gathers user records
    journals = db.query(Journal).filter(Journal.user_id == user_id).order_by(Journal.date.desc()).limit(15).all()
    goals = db.query(Goal).filter(Goal.user_id == user_id).all()
    habits = db.query(Habit).filter(Habit.user_id == user_id).all()
    
    if not journals and not goals:
        return {
            "summary": "We don't have enough data to model your personality yet. Try writing 2-3 journal entries and setting some goals!",
            "traits": [
                {"name": "Openness", "score": 50, "description": "Need more journal entries to evaluate."},
                {"name": "Conscientiousness", "score": 50, "description": "Need more goals to evaluate."},
                {"name": "Extraversion", "score": 50, "description": "Need more social entries to evaluate."},
                {"name": "Agreeableness", "score": 50, "description": "Need more reflection to evaluate."},
                {"name": "Neuroticism", "score": 50, "description": "Need more mood logs to evaluate."}
            ],
            "strengths": ["Beginning your self-discovery journey"],
            "weaknesses": ["Lack of historical logs"],
            "evolution_index": 0,
            "recommendations": ["Create your first journal entry.", "Add a habit to build consistency."]
        }
        
    if not is_gemini_active():
        # Heuristics adjustment based on counts
        journal_count = db.query(Journal).filter(Journal.user_id == user_id).count()
        goal_count = len(goals)
        habit_count = len(habits)
        comp_goals = sum(1 for g in goals if g.is_completed)
        
        idx = min(100, int((journal_count * 5) + (goal_count * 10) + (comp_goals * 15) + (habit_count * 5)))
        fallback_report["evolution_index"] = max(10, idx)
        if comp_goals > 0:
            fallback_report["strengths"].append("Task execution")
        return fallback_report

    # Format text for prompt
    journal_text = "\n".join([f"[{j.date}] (Mood: {j.mood}): {j.content}" for j in journals])
    goal_text = "\n".join([f"- {g.title} (Category: {g.category}, Progress: {g.progress}%)" for g in goals])
    habit_text = "\n".join([f"- {h.name} (Frequency: {h.frequency})" for h in habits])
    
    prompt = (
        "You are an expert psychometrist analyzing a user's digital twin database. "
        "Analyze the user's journals, goals, and habits below and generate a structured personality evolution report.\n\n"
        "--- USER JOURNALS ---\n"
        f"{journal_text or 'None'}\n\n"
        "--- USER GOALS ---\n"
        f"{goal_text or 'None'}\n\n"
        "--- USER HABITS ---\n"
        f"{habit_text or 'None'}\n\n"
        "Output a single, valid JSON object (and nothing else) with the following structure:\n"
        "{\n"
        "  \"summary\": \"A short 2-3 sentence overview of the user's current mindset and growth phase.\",\n"
        "  \"traits\": [\n"
        "     {\"name\": \"Openness\", \"score\": 0-100, \"description\": \"brief summary of openness trait based on content\"},\n"
        "     {\"name\": \"Conscientiousness\", \"score\": 0-100, \"description\": \"brief summary\"},\n"
        "     {\"name\": \"Extraversion\", \"score\": 0-100, \"description\": \"brief summary\"},\n"
        "     {\"name\": \"Agreeableness\", \"score\": 0-100, \"description\": \"brief summary\"},\n"
        "     {\"name\": \"Neuroticism\", \"score\": 0-100, \"description\": \"brief summary\"}\n"
        "  ],\n"
        "  \"strengths\": [\"Strength 1\", \"Strength 2\"],\n"
        "  \"weaknesses\": [\"Area of improvement 1\", \"Area of improvement 2\"],\n"
        "  \"evolution_index\": 0-100 (an overall growth progress percentage based on goals, habit completions, and reflections),\n"
        "  \"recommendations\": [\"Tip 1\", \"Tip 2\"]\n"
        "}\n"
    )

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(response_mime_type="application/json")
        )
        return json.loads(response.text.strip())
    except Exception as e:
        logger.error(f"Gemini evolution engine error: {e}")
        return fallback_report

def generate_timeline_chapters(user_id: int, db: Session) -> List[Dict[str, Any]]:
    """Group user's journal entries and milestones into compiled thematic life chapters."""
    journals = db.query(Journal).filter(Journal.user_id == user_id).order_by(Journal.date.asc()).all()
    goals = db.query(Goal).filter(Goal.user_id == user_id, Goal.is_completed == True).order_by(Goal.created_at.asc()).all()
    
    if not journals:
        return [{
            "id": 1,
            "title": "A New Beginning",
            "start_date": "Today",
            "end_date": "Present",
            "summary": "This is the start of your digital twin journey. As you write entries and log your habits, your timeline chapters will evolve.",
            "milestones": ["Created CloneMe account"]
        }]
        
    if not is_gemini_active():
        # Fallback: Group journals by month
        from collections import defaultdict
        grouped = defaultdict(list)
        for j in journals:
            month_key = j.date.strftime("%B %Y")
            grouped[month_key].append(j)
            
        chapters = []
        for idx, (month, j_list) in enumerate(sorted(grouped.items(), key=lambda x: x[1][0].date)):
            chapter_goals = [g.title for g in goals if g.created_at.date().strftime("%B %Y") == month]
            chapters.append({
                "id": idx + 1,
                "title": f"Chapter: {month}",
                "start_date": j_list[0].date.strftime("%Y-%m-%d"),
                "end_date": j_list[-1].date.strftime("%Y-%m-%d"),
                "summary": f"Reflected on {len(j_list)} items, including thoughts on: " + ", ".join(list(set([t.strip() for j in j_list for t in (j.tags or '').split(',') if t.strip()]))[:3]),
                "milestones": chapter_goals or ["Maintained reflections"]
            })
        return chapters

    # Build prompt for Gemini
    journal_data = "\n".join([f"[{j.date}]: {j.content[:200]}" for j in journals])
    goal_data = "\n".join([f"[{g.created_at.date()}] Completed: {g.title}" for g in goals])
    
    prompt = (
        "Analyze the user's chronological journal log and completed goals below. "
        "Divide their timeline into 1 to 4 thematic 'life chapters' or 'growth phases' (e.g. 'Overcoming Career Stress', 'Focusing on Physical Health').\n\n"
        "--- USER REFLECTIONS ---\n"
        f"{journal_data}\n\n"
        "--- USER COMPLETED MILESTONES ---\n"
        f"{goal_data}\n\n"
        "Output a single, valid JSON array (and nothing else) containing objects with the following format:\n"
        "[\n"
        "  {\n"
        "    \"id\": 1,\n"
        "    \"title\": \"Chapter Title\",\n"
        "    \"start_date\": \"YYYY-MM-DD or Month YYYY\",\n"
        "    \"end_date\": \"YYYY-MM-DD, Month YYYY, or Present\",\n"
        "    \"summary\": \"A short narrative describing this period in the user's life.\",\n"
        "    \"milestones\": [\"Key achievement 1\", \"Crucial realization 2\"]\n"
        "  }\n"
        "]\n"
    )

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(response_mime_type="application/json")
        )
        return json.loads(response.text.strip())
    except Exception as e:
        logger.error(f"Gemini timeline chapter compiler error: {e}")
        # Fall back to month-based grouping
        return [{
            "id": 1,
            "title": "A New Beginning",
            "start_date": journals[0].date.strftime("%Y-%m-%d"),
            "end_date": journals[-1].date.strftime("%Y-%m-%d"),
            "summary": "A period of starting self-reflection logs and mapping goals.",
            "milestones": [g.title for g in goals] or ["Began logging memories"]
        }]

def generate_future_projections(user_id: int, db: Session) -> Dict[str, Any]:
    """Generate predictive future self projections based on habit and goal consistency."""
    fallback_projection = {
        "one_month": "In one month, you'll feel a solid rhythm forming if you check off your habits at least 4 days a week. Keep goals highly visible.",
        "six_months": "In six months, you will have completed your short-term learning goals. Your personality evolution will show improved focus and conscientiousness.",
        "one_year": "One year from now, these daily small actions will aggregate into complete career and lifestyle adjustments. Keep documenting the process!"
    }
    
    journals = db.query(Journal).filter(Journal.user_id == user_id).limit(10).all()
    goals = db.query(Goal).filter(Goal.user_id == user_id).all()
    habits = db.query(Habit).filter(Habit.user_id == user_id).all()
    
    if not journals and not habits:
        return {
            "one_month": "Start logging journals and daily habits to unlock customized one-month projections.",
            "six_months": "Your six-month projections will formulate once we can calculate habit streaks.",
            "one_year": "A year from now, your twin will map your personality trajectory based on consistency metrics."
        }
        
    if not is_gemini_active():
        return fallback_projection

    journal_text = "\n".join([f"- {j.content[:200]}" for j in journals])
    goal_text = "\n".join([f"- {g.title} ({g.progress}% progress)" for g in goals])
    habit_text = "\n".join([f"- {h.name} ({h.frequency})" for h in habits])
    
    prompt = (
        "Analyze the user's habits, active goals, and journal summaries below. "
        "Project the user's likely trajectory at three time horizons: 1 month, 6 months, and 1 year. "
        "Base your analysis on their current consistency, self-reflections, and obstacles mentioned.\n\n"
        "--- JOURNALS ---\n"
        f"{journal_text}\n\n"
        "--- GOALS ---\n"
        f"{goal_text}\n\n"
        "--- HABITS ---\n"
        f"{habit_text}\n\n"
        "Output a single, valid JSON object (and nothing else) structured as follows:\n"
        "{\n"
        "  \"one_month\": \"Short, encouraging prediction for next month, highlighting goal progress or habit changes.\",\n"
        "  \"six_months\": \"Mid-term projections reflecting changes in personality traits or career milestones.\",\n"
        "  \"one_year\": \"Long-term outlook detailing complete habits and lifestyle differences.\"\n"
        "}\n"
    )

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(response_mime_type="application/json")
        )
        return json.loads(response.text.strip())
    except Exception as e:
        logger.error(f"Gemini future predictor error: {e}")
        return fallback_projection
