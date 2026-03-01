#!/usr/bin/env python3
"""Test Mistral API keys for all features"""

import os
import sys
import json
import time
from dotenv import load_dotenv
import requests

# Load .env from server directory
env_path = r"c:\Users\rames\OneDrive\Desktop\Mistral hackathon\server\.env"
load_dotenv(env_path)

def test_api_key(feature_num, key, model):
    """Test a single API key with a simple request"""
    if not key:
        print(f"[FAIL] Feature {feature_num}: No API key found")
        return False

    print(f"\nTesting Feature {feature_num} (Model: {model})")
    print(f"  Key: {key[:10]}...{key[-10:]}")

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    # Simple test prompt
    if feature_num == 4:
        prompt = "Climate data: 26C, 700mm rainfall. What for 2050? Return JSON: {temp: number, rain: number}"
    elif feature_num == 3:
        prompt = "Summarize policy: Sugarcane subsidy in Mandya. Brief."
    else:
        prompt = f"Echo: {feature_num * 111}"

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200,
        "temperature": 0.7
    }

    try:
        print(f"  Sending request...")
        start_time = time.time()

        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=30
        )

        elapsed = time.time() - start_time

        if response.status_code == 200:
            print(f"[PASS] Feature {feature_num}: OK (took {elapsed:.2f}s)")
            try:
                data = response.json()
                content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                print(f"    Response: {content[:80]}...")
                return True
            except:
                print(f"[FAIL] Feature {feature_num}: Invalid JSON response")
                return False

        elif response.status_code == 401:
            print(f"[FAIL] Feature {feature_num}: 401 Unauthorized - Invalid API key")
            return False

        elif response.status_code == 429:
            print(f"[FAIL] Feature {feature_num}: 429 Rate Limited - Too many requests")
            return False

        elif response.status_code == 500:
            print(f"[FAIL] Feature {feature_num}: 500 Server Error")
            print(f"    Response: {response.text[:200]}")
            return False

        else:
            print(f"[FAIL] Feature {feature_num}: HTTP {response.status_code}")
            print(f"    Response: {response.text[:200]}")
            return False

    except requests.exceptions.Timeout:
        print(f"[FAIL] Feature {feature_num}: Timeout - API not responding")
        return False

    except requests.exceptions.ConnectionError:
        print(f"[FAIL] Feature {feature_num}: Connection error - Cannot reach API")
        return False

    except Exception as e:
        print(f"[FAIL] Feature {feature_num}: {type(e).__name__} - {str(e)}")
        return False

def main():
    print("=" * 80)
    print("MISTRAL API KEY TEST SUITE")
    print("=" * 80)

    # Load environment variables
    feature1_key = os.getenv('MISTRAL_FEATURE1_KEY')
    feature1_model = os.getenv('MISTRAL_FEATURE1_MODEL', 'mistral-small-latest')

    feature2_key = os.getenv('MISTRAL_FEATURE2_KEY')
    feature2_model = os.getenv('MISTRAL_FEATURE2_MODEL', 'mistral-small-latest')

    feature3_key = os.getenv('MISTRAL_FEATURE3_KEY')
    feature3_model = os.getenv('MISTRAL_FEATURE3_MODEL', 'mistral-large-latest')

    feature4_key = os.getenv('MISTRAL_FEATURE4_KEY')
    feature4_model = os.getenv('MISTRAL_FEATURE4_MODEL', 'mistral-large-latest')

    brief_key = os.getenv('MISTRAL_BRIEF_KEY')
    brief_model = os.getenv('MISTRAL_BRIEF_MODEL', 'mistral-medium-latest')

    print(f"\nLoaded .env from: {env_path}\n")
    print(f"  Feature 1 Key: {'YES' if feature1_key else 'NO'}")
    print(f"  Feature 2 Key: {'YES' if feature2_key else 'NO'}")
    print(f"  Feature 3 Key: {'YES' if feature3_key else 'NO'}")
    print(f"  Feature 4 Key: {'YES' if feature4_key else 'NO'}")
    print(f"  Brief Key: {'YES' if brief_key else 'NO'}")

    # Test each feature
    print("\n" + "=" * 80)
    print("TESTING API KEYS")
    print("=" * 80)

    results = {}
    results['feature1'] = test_api_key(1, feature1_key, feature1_model)
    time.sleep(1)

    results['feature2'] = test_api_key(2, feature2_key, feature2_model)
    time.sleep(1)

    results['feature3'] = test_api_key(3, feature3_key, feature3_model)
    time.sleep(1)

    results['feature4'] = test_api_key(4, feature4_key, feature4_model)
    time.sleep(1)

    results['brief'] = test_api_key(5, brief_key, brief_model)

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80 + "\n")

    all_passed = all(results.values())

    for feature, passed in results.items():
        status = "PASS" if passed else "FAIL"
        print(f"  {feature:12}: {status}")

    print()
    if all_passed:
        print("SUCCESS: ALL TESTS PASSED - API keys are working correctly!")
        print("\nIf time travel and CSV are still using fallback mode:")
        print("  - Check server logs for other configuration issues")
        print("  - Verify the LLM calls are actually being made")
        return 0
    else:
        print("FAILURE: Some tests failed - Check the errors above\n")
        print("Possible causes:")
        print("  1. Invalid API keys")
        print("  2. Rate limits exceeded")
        print("  3. Mistral API service down")
        print("  4. Network/firewall issues")
        print("  5. Keys expired or deactivated")
        return 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nTest interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
