import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

try:
    models = genai.list_models()
    for m in models:
        print(m.name)
except Exception as e:
    print("Error:", e)
