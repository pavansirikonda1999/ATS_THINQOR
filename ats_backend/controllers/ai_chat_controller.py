from flask import Blueprint, request, jsonify
from typing import Any, Dict

from utils.llm_client import call_llm
from services.ai_data_service import (
	get_candidate_by_name_for_user,
	get_candidate_track_for_user,
	get_interviews_for_user,
	get_requirement_by_id_for_user,
	list_requirements_for_recruiter,
	list_requirements_for_client,
	get_client_by_id_for_user,
	get_allocations_for_requirement,
)


ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


SYSTEM_PROMPT = (
	"You are an ATS assistant. Answer ONLY from the CONTEXT. The current database "
	"contains: requirements, requirement_allocations, clients, users. It does NOT contain "
	"candidate or interview tables. If the user asks for candidates or interviews, clearly say that the "
	"current ATS database doesn’t have those tables and offer requirement/client/allocation info instead. "
	"Obey role rules: admin can access everything; recruiter may access requirements allocated to them; "
	"client may only access requirements where client_id matches their id. Never invent data. If a record or "
	"access is missing, say so directly and propose related information available (e.g., requirement details, client data, allocations)."
)


def _detect_intent(message: str) -> str:

	ml = (message or "").lower()
	if any(k in ml for k in ["requirement", "opening", "req ", "req-", "r-"]):
		return "requirement"
	if "client" in ml:
		return "client"
	if any(k in ml for k in ["my allocations", "my requirements", "allocated", "assigned to me", "recruiter"]):
		return "allocations"
	return "general"


@ai_bp.route("/chat", methods=["POST"])
def chat() -> Any:

	# 1) Read user and message. We expect frontend to include logged-in user payload
	#    since this project does not attach req.user automatically.
	data = request.get_json() or {}
	message = (data.get("message") or "").strip()
	user = data.get("user") or {}

	if not user or not user.get("role"):
		return jsonify({"answer": "Unauthorized: missing user/role.", "context": None}), 401
	if not message:
		return jsonify({"answer": "Please provide a message.", "context": None}), 400

	# 2) Simple routing/intent
	intent = _detect_intent(message)

	context: Dict[str, Any] = {"user": {"id": user.get("id"), "role": user.get("role"), "client_id": user.get("client_id")}, "query": message}

	try:
		# 3) Fetch ATS data with role-based filtering
		if intent == "requirement":
			# try to extract a requirement id pattern like R-123
			req_id = None
			for tok in message.replace("#", " ").replace(",", " ").split():
				if tok.upper().startswith("R-") or tok.upper().startswith("REQ-"):
					req_id = tok.upper().replace("REQ-", "R-")
					break
			# if explicit id present fetch exact, else leave None and let LLM summarize available lists
			context["requirement"] = get_requirement_by_id_for_user(req_id, user) if req_id else None
			if req_id:
				context["allocations"] = get_allocations_for_requirement(req_id)

		elif intent == "client":
			# extract numeric/id after 'client'
			client_id = None
			parts = message.split()
			if "client" in [p.lower() for p in parts]:
				idx = [p.lower() for p in parts].index("client")
				if idx + 1 < len(parts):
					client_id = parts[idx + 1]
			context["client"] = get_client_by_id_for_user(client_id, user) if client_id else None
			# also include this client's requirements for convenience
			if context.get("client"):
				context["requirements"] = list_requirements_for_client(client_id)

		elif intent == "allocations":
			# recruiter scope
			if user.get("role", "").upper() == "RECRUITER":
				context["requirements"] = list_requirements_for_recruiter(user.get("id"))
			else:
				context["requirements"] = []

		# 4) Call LLM with system prompt, original question, and structured context
		answer = call_llm(SYSTEM_PROMPT, context, message)
		return jsonify({"answer": answer, "context": context}), 200

	except Exception as e:
		# Never crash; provide a safe message
		return jsonify({"answer": f"AI processing failed: {e}", "context": context}), 200


def register_ai_routes(app) -> None:

	# Attach blueprint to the Flask app without changing existing routes
	app.register_blueprint(ai_bp)


