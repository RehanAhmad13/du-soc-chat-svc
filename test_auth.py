#!/usr/bin/env python3
import requests
import json

# Test authentication
def test_auth():
    print("Testing authentication...")
    
    # Try to login with admin credentials
    login_url = "http://localhost:8000/api/auth/login/"
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access')
            print(f"Token received: {token[:50]}..." if token else "No token received")
            
            if token:
                # Test admin API access
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test tenant-config endpoint
                tenant_url = "http://localhost:8000/api/admin/tenant-config/"
                tenant_response = requests.get(tenant_url, headers=headers)
                print(f"Tenant API response: {tenant_response.status_code}")
                
                if tenant_response.status_code == 200:
                    tenant_data = tenant_response.json()
                    print(f"Tenant data received: {len(tenant_data.get('results', []))} tenants")
                else:
                    print(f"Tenant API error: {tenant_response.text}")
                
                # Test overview endpoint
                overview_url = "http://localhost:8000/api/admin/tenant-config/overview/"
                overview_response = requests.get(overview_url, headers=headers)
                print(f"Overview API response: {overview_response.status_code}")
                
                if overview_response.status_code == 200:
                    overview_data = overview_response.json()
                    print(f"Overview data: {overview_data}")
                else:
                    print(f"Overview API error: {overview_response.text}")
                    
        else:
            print(f"Login failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Could not connect to server. Is it running on localhost:8000?")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_auth()