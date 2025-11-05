from typing import Any, Dict, List, Optional, Tuple

# This module provides role-aware, plain-JSON data fetchers for the AI assistant.
# It reuses the existing DB connection factory from the Flask app without altering models.

import os
import mysql.connector
from mysql.connector import Error
from pathlib import Path

# Load environment variables (same as app.py)
try:
	from dotenv import load_dotenv
	env_file = Path(__file__).parent.parent / ".env"
	if not env_file.exists():
		env_file = Path(__file__).parent.parent / "config.env"
	if env_file.exists():
		load_dotenv(dotenv_path=env_file, override=True)
except ImportError:
	pass  # dotenv not available, use system env vars


def get_db_connection():

	try:
		connection = mysql.connector.connect(
			host=os.getenv('DB_HOST', 'localhost'),
			user=os.getenv('DB_USER', 'root'),
			password=os.getenv('DB_PASSWORD', ''),
			database=os.getenv('DB_NAME', 'ats_system')
		)
		if connection.is_connected():
			return connection
	except Error as e:
		print("❌ AI service DB connection failed:", e)
		return None


UserDict = Dict[str, Any]


def _fetch_one(query: str, params: Tuple[Any, ...]) -> Optional[Dict[str, Any]]:

	conn = get_db_connection()
	if not conn:
		return None
	cursor = conn.cursor(dictionary=True)
	try:
		cursor.execute(query, params)
		row = cursor.fetchone()
		return dict(row) if row else None
	finally:
		cursor.close()
		conn.close()


def _fetch_all(query: str, params: Tuple[Any, ...]) -> List[Dict[str, Any]]:

	conn = get_db_connection()
	if not conn:
		return []
	cursor = conn.cursor(dictionary=True)
	try:
		cursor.execute(query, params)
		rows = cursor.fetchall()
		return [dict(r) for r in rows] if rows else []
	finally:
		cursor.close()
		conn.close()


def _is_admin(user: UserDict) -> bool:

	return (user or {}).get("role", "").upper() == "ADMIN"


def _is_recruiter(user: UserDict) -> bool:

	return (user or {}).get("role", "").upper() == "RECRUITER"


def _is_client(user: UserDict) -> bool:

	return (user or {}).get("role", "").upper() == "CLIENT"


def get_candidate_by_name_for_user(name: str, user: UserDict) -> Optional[Dict[str, Any]]:

	# Current schema has no candidates table; return None safely
	return None


def get_candidate_track_for_user(candidate_id: str, user: UserDict) -> List[Dict[str, Any]]:

	# Current schema has no candidate_track table; return empty safely
	return []


def get_requirement_for_user(requirement_id: str, user: UserDict) -> Optional[Dict[str, Any]]:

	if _is_admin(user):
		return _fetch_one("SELECT * FROM requirements WHERE id = %s", (requirement_id,))

	if _is_recruiter(user):
		# requirement created by recruiter or allocated to recruiter
		return _fetch_one(
			"""
			SELECT DISTINCT r.*
			FROM requirements r
			LEFT JOIN requirement_allocations ra ON ra.requirement_id = r.id
			WHERE r.id = %s AND (r.created_by = %s OR ra.recruiter_id = %s)
			""",
			(requirement_id, user.get("id"), user.get("id")),
		)

	if _is_client(user):
		return _fetch_one(
			"SELECT * FROM requirements WHERE id = %s AND client_id = %s",
			(requirement_id, user.get("client_id")),
		)

	return None


def get_interviews_for_user(candidate_id: str, user: UserDict) -> List[Dict[str, Any]]:

	# Current schema has no interviews table; return empty safely
	return []


# New helpers aligned to current schema

def get_requirement_by_id_for_user(requirement_id: str, user: UserDict) -> Optional[Dict[str, Any]]:

	if _is_admin(user):
		return _fetch_one(
			"""
			SELECT r.*, c.name AS client_name
			FROM requirements r
			LEFT JOIN clients c ON c.id = r.client_id
			WHERE r.id = %s
			""",
			(requirement_id,),
		)

	if _is_recruiter(user):
		return _fetch_one(
			"""
			SELECT r.*, c.name AS client_name
			FROM requirements r
			JOIN requirement_allocations ra ON ra.requirement_id = r.id
			LEFT JOIN clients c ON c.id = r.client_id
			WHERE r.id = %s AND ra.recruiter_id = %s
			""",
			(requirement_id, user.get("id")),
		)

	if _is_client(user):
		return _fetch_one(
			"""
			SELECT r.*, c.name AS client_name
			FROM requirements r
			JOIN clients c ON c.id = r.client_id
			WHERE r.id = %s AND r.client_id = %s
			""",
			(requirement_id, user.get("client_id")),
		)

	return None


def list_requirements_for_recruiter(user_id: str) -> List[Dict[str, Any]]:

	return _fetch_all(
		"""
		SELECT r.id, r.title, r.location, r.status, c.name AS client_name
		FROM requirements r
		JOIN requirement_allocations ra ON ra.requirement_id = r.id
		LEFT JOIN clients c ON c.id = r.client_id
		WHERE ra.recruiter_id = %s
		ORDER BY r.created_at DESC
		""",
		(user_id,),
	)


def list_requirements_for_client(client_id: str) -> List[Dict[str, Any]]:

	return _fetch_all(
		"""
		SELECT r.id, r.title, r.location, r.status
		FROM requirements r
		WHERE r.client_id = %s
		ORDER BY r.created_at DESC
		""",
		(client_id,),
	)


def get_client_by_id_for_user(client_id: str, user: UserDict) -> Optional[Dict[str, Any]]:

	if _is_admin(user):
		return _fetch_one("SELECT id, name, contact_person, email, phone FROM clients WHERE id = %s", (client_id,))

	if _is_recruiter(user):
		# Recruiter can view client if they have an allocation to any requirement of this client
		return _fetch_one(
			"""
			SELECT DISTINCT c.id, c.name, c.contact_person, c.email, c.phone
			FROM clients c
			JOIN requirements r ON r.client_id = c.id
			JOIN requirement_allocations ra ON ra.requirement_id = r.id
			WHERE c.id = %s AND ra.recruiter_id = %s
			""",
			(client_id, user.get("id")),
		)

	if _is_client(user):
		if str(user.get("client_id")) == str(client_id):
			return _fetch_one("SELECT id, name, contact_person, email, phone FROM clients WHERE id = %s", (client_id,))
		return None

	return None


def get_allocations_for_requirement(requirement_id: str) -> List[Dict[str, Any]]:

	return _fetch_all(
		"""
		SELECT ra.recruiter_id, u.name AS recruiter_name
		FROM requirement_allocations ra
		LEFT JOIN users u ON u.id = ra.recruiter_id
		WHERE ra.requirement_id = %s
		""",
		(requirement_id,),
	)


def get_client_for_user(client_id: str, user: UserDict) -> Optional[Dict[str, Any]]:

	if _is_admin(user):
		return _fetch_one("SELECT * FROM clients WHERE id = %s", (client_id,))

	if _is_recruiter(user):
		# Recruiters can view client if they own a requirement for that client or are allocated to it
		return _fetch_one(
			"""
			SELECT DISTINCT c.*
			FROM clients c
			JOIN requirements r ON r.client_id = c.id
			LEFT JOIN requirement_allocations ra ON ra.requirement_id = r.id
			WHERE c.id = %s AND (r.created_by = %s OR ra.recruiter_id = %s)
			""",
			(client_id, user.get("id"), user.get("id")),
		)

	if _is_client(user):
		# Client can view itself only
		if str(user.get("client_id")) == str(client_id):
			return _fetch_one("SELECT * FROM clients WHERE id = %s", (client_id,))
		return None

	return None


