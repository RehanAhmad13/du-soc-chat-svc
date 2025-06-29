#!/usr/bin/env python3
"""
Test script to verify admin API endpoints are working
"""
import requests
import json
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8000"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def get_admin_token():
    """Get JWT token for admin user"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login/", {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access"]
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_admin_endpoints(token):
    """Test admin API endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        "/api/admin/dashboard/stats/",
        "/api/admin/system/health/",
        "/api/admin/activity/feed/",
        "/api/admin/threads/",
        "/api/admin/users/",
        "/api/admin/tenants/",
        "/api/admin/templates/"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"\nTesting {endpoint}...")
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Success!")
                if isinstance(data, dict) and len(data) <= 3:
                    print(f"Response: {json.dumps(data, indent=2)[:200]}...")
                elif isinstance(data, list) and len(data) > 0:
                    print(f"Response: List with {len(data)} items")
                else:
                    print(f"Response type: {type(data)}")
            else:
                print(f"❌ Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    print("Testing Admin API Endpoints")
    print("=" * 50)
    
    token = get_admin_token()
    if token:
        print(f"✅ Got admin token: {token[:20]}...")
        test_admin_endpoints(token)
    else:
        print("❌ Failed to get admin token")
        sys.exit(1)