"""
SatQuery Storage Package — MinIO, MongoDB, Redis clients.
Each client has graceful fallback: if the service is not running,
operations log a warning and return a safe default so the API never crashes.
"""
