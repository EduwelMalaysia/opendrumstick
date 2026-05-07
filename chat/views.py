import os
import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
from django.shortcuts import render

def index_view(request):
    return render(request, 'chat/index.html')

# Load environment variables
load_dotenv()

HF_TOKEN = os.getenv("HUGGING_FACE_TOKEN")
client = InferenceClient(model="Qwen/Qwen2.5-72B-Instruct", token=HF_TOKEN)

@csrf_exempt  # Remove this and add CSRF token in fetch() for production
@require_POST
def chat_api(request):
    try:
        data = json.loads(request.body)
        user_msg = data.get("message", "").strip()
        if not user_msg:
            return JsonResponse({"error": "Message cannot be empty"}, status=400)

        # Initialize chat history in session
        if "chat_history" not in request.session:
            request.session["chat_history"] = [
                {"role": "system", "content": "You are 小鸡腿 or OpenChicken, a helpful coding assistant."}
            ]

        # Append user message
        request.session["chat_history"].append({"role": "user", "content": user_msg})
        request.session.modified = True

        # Call Hugging Face API
        response = client.chat_completion(
            messages=request.session["chat_history"],
            max_tokens=500
        )
        bot_reply = response.choices[0].message.content

        # Save assistant response to history
        request.session["chat_history"].append({"role": "assistant", "content": bot_reply})
        request.session.modified = True

        return JsonResponse({"reply": bot_reply})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)