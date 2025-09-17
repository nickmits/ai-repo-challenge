#!/usr/bin/env python3
"""
Simple test script to verify RAG functionality
"""

import requests
import json
import os
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8000"
API_KEY = os.getenv("OPENAI_API_KEY", "")

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{API_BASE_URL}/api/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_pdf_status():
    """Test PDF status endpoint"""
    print("\n🔍 Testing PDF status endpoint...")
    response = requests.get(f"{API_BASE_URL}/api/pdf-status")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_chat_without_pdf():
    """Test chat without PDF uploaded"""
    print("\n🔍 Testing chat without PDF...")
    
    if not API_KEY:
        print("❌ OPENAI_API_KEY environment variable not set")
        return False
    
    payload = {
        "developer_message": "You are a helpful assistant.",
        "user_message": "Hello, how are you?",
        "model": "gpt-4o-mini",
        "api_key": API_KEY
    }
    
    response = requests.post(
        f"{API_BASE_URL}/api/chat",
        json=payload,
        stream=True
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print("Response: ", end="", flush=True)
        for chunk in response.iter_content(chunk_size=1, decode_unicode=True):
            if chunk:
                print(chunk, end="", flush=True)
        print("\n✅ Chat without PDF working!")
        return True
    else:
        print(f"❌ Error: {response.text}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing RAG-Powered AI Chat API")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health),
        ("PDF Status", test_pdf_status),
        ("Chat without PDF", test_chat_without_pdf),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The API is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the error messages above.")

if __name__ == "__main__":
    main()
