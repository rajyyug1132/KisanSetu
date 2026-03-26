import requests
import sys
import json
import base64
from datetime import datetime

class KisanSetuAPITester:
    def __init__(self, base_url="https://kisansetu-advisory.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            self.test_results.append({
                "test": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_preview": response.text[:100] if not success else "OK"
            })

            return success, response.json() if success and response.text else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout}s")
            self.test_results.append({
                "test": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "TIMEOUT",
                "success": False,
                "response_preview": f"Timeout after {timeout}s"
            })
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "test": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "response_preview": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_dashboard_data(self):
        """Test dashboard data endpoint"""
        success, response = self.run_test("Dashboard Data - Default", "GET", "dashboard-data", 200)
        
        if success:
            # Validate response structure
            required_keys = ["weather", "mandi_prices", "alerts"]
            missing_keys = [key for key in required_keys if key not in response]
            if missing_keys:
                print(f"⚠️  Warning: Missing keys in response: {missing_keys}")
            
            # Check weather data structure
            if "weather" in response:
                weather = response["weather"]
                weather_keys = ["temp", "humidity", "rain_chance", "ndvi", "soil_moisture", "soil_status"]
                missing_weather = [key for key in weather_keys if key not in weather]
                if missing_weather:
                    print(f"⚠️  Warning: Missing weather keys: {missing_weather}")
                else:
                    print(f"   Weather data complete: temp={weather.get('temp')}°C, humidity={weather.get('humidity')}%")
            
            # Check mandi prices (should have 8 crops)
            if "mandi_prices" in response:
                mandi_count = len(response["mandi_prices"])
                print(f"   Mandi prices for {mandi_count} crops")
                if mandi_count != 8:
                    print(f"⚠️  Warning: Expected 8 crops, got {mandi_count}")
        
        return success, response

    def test_location_specific_dashboard_data(self):
        """Test location-specific dashboard data endpoints"""
        location_tests = [
            {
                "location": "pune",
                "expected_temp": 21,
                "expected_humidity": 76,
                "description": "Pune weather"
            },
            {
                "location": "hubli", 
                "expected_temp": 29,
                "expected_humidity": 82,
                "description": "Hubli weather with alerts"
            },
            {
                "location": "solapur",
                "expected_temp": 34,
                "expected_soil_status": "critical",
                "description": "Solapur weather with critical soil"
            },
            {
                "location": "nashik",
                "expected_temp": 24,
                "description": "Nashik weather with adjusted prices"
            }
        ]
        
        all_passed = True
        results = []
        
        for test_case in location_tests:
            location = test_case["location"]
            endpoint = f"dashboard-data?location={location}"
            
            success, response = self.run_test(
                f"Dashboard Data - {test_case['description']}", 
                "GET", 
                endpoint, 
                200
            )
            
            if success:
                weather = response.get("weather", {})
                
                # Check expected temperature
                if "expected_temp" in test_case:
                    actual_temp = weather.get("temp")
                    expected_temp = test_case["expected_temp"]
                    if actual_temp == expected_temp:
                        print(f"   ✅ Temperature correct: {actual_temp}°C")
                    else:
                        print(f"   ❌ Temperature mismatch: expected {expected_temp}°C, got {actual_temp}°C")
                        all_passed = False
                
                # Check expected humidity
                if "expected_humidity" in test_case:
                    actual_humidity = weather.get("humidity")
                    expected_humidity = test_case["expected_humidity"]
                    if actual_humidity == expected_humidity:
                        print(f"   ✅ Humidity correct: {actual_humidity}%")
                    else:
                        print(f"   ❌ Humidity mismatch: expected {expected_humidity}%, got {actual_humidity}%")
                        all_passed = False
                
                # Check expected soil status
                if "expected_soil_status" in test_case:
                    actual_soil_status = weather.get("soil_status")
                    expected_soil_status = test_case["expected_soil_status"]
                    if actual_soil_status == expected_soil_status:
                        print(f"   ✅ Soil status correct: {actual_soil_status}")
                    else:
                        print(f"   ❌ Soil status mismatch: expected {expected_soil_status}, got {actual_soil_status}")
                        all_passed = False
                
                # Check for alerts (especially for hubli)
                alerts = response.get("alerts", [])
                if location == "hubli":
                    if len(alerts) >= 1:
                        print(f"   ✅ Hubli has {len(alerts)} alert(s) as expected")
                    else:
                        print(f"   ❌ Hubli should have alerts, but got {len(alerts)}")
                        all_passed = False
                
                # Check location field
                response_location = response.get("location")
                if response_location == location:
                    print(f"   ✅ Location field correct: {response_location}")
                else:
                    print(f"   ❌ Location field mismatch: expected {location}, got {response_location}")
                    all_passed = False
                    
            else:
                all_passed = False
            
            results.append((success, response))
        
        return all_passed, results

    def test_advisory_endpoint(self):
        """Test advisory endpoint with different parameters"""
        test_cases = [
            {
                "name": "Advisory - Default Paddy Hindi",
                "data": {"query": "Should I water my crops today?", "crop": "Paddy", "lang": "hi"},
                "timeout": 45
            },
            {
                "name": "Advisory - Wheat English",
                "data": {"query": "What fertilizer should I use?", "crop": "Wheat", "lang": "en"},
                "timeout": 45
            },
            {
                "name": "Advisory - Empty query (should get default)",
                "data": {"crop": "Cotton", "lang": "hi"},
                "timeout": 45
            }
        ]
        
        results = []
        for test_case in test_cases:
            success, response = self.run_test(
                test_case["name"], 
                "POST", 
                "advisory", 
                200, 
                test_case["data"],
                test_case.get("timeout", 30)
            )
            
            if success:
                # Validate advisory response structure
                required_keys = ["advisory", "audio_ready", "alerts"]
                missing_keys = [key for key in required_keys if key not in response]
                if missing_keys:
                    print(f"⚠️  Warning: Missing keys in advisory response: {missing_keys}")
                
                if "advisory" in response and response["advisory"]:
                    advisory_text = response["advisory"]
                    print(f"   Advisory length: {len(advisory_text)} chars")
                    print(f"   Advisory preview: {advisory_text[:80]}...")
                else:
                    print(f"⚠️  Warning: Empty or missing advisory text")
            
            results.append((success, response))
        
        return all(result[0] for result in results), results

    def create_test_image_base64(self):
        """Create a simple test image in base64 format"""
        # Create a simple 100x100 PNG image with some pattern
        import io
        try:
            from PIL import Image, ImageDraw
            
            # Create a simple leaf-like pattern
            img = Image.new('RGB', (100, 100), color='lightgreen')
            draw = ImageDraw.Draw(img)
            
            # Draw some leaf-like patterns
            draw.ellipse([20, 20, 80, 80], fill='green', outline='darkgreen')
            draw.ellipse([30, 30, 70, 70], fill='lightgreen')
            draw.line([50, 20, 50, 80], fill='darkgreen', width=3)
            draw.line([30, 40, 70, 60], fill='darkgreen', width=2)
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            print(f"   Created test image: {len(img_base64)} chars base64")
            return img_base64
            
        except ImportError:
            # Fallback: create a minimal valid PNG base64
            # This is a 1x1 transparent PNG
            minimal_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            print(f"   Using minimal PNG fallback: {len(minimal_png)} chars")
            return minimal_png

    def test_scan_endpoint(self):
        """Test scan endpoint with image"""
        # Create test image
        test_image_b64 = self.create_test_image_base64()
        
        test_data = {
            "image_b64": test_image_b64,
            "crop": "Paddy",
            "lang": "en"
        }
        
        success, response = self.run_test(
            "Pest Scan with Image", 
            "POST", 
            "scan", 
            200, 
            test_data,
            60  # Longer timeout for AI processing
        )
        
        if success:
            # Validate scan response structure
            required_keys = ["diagnosis", "crop"]
            missing_keys = [key for key in required_keys if key not in response]
            if missing_keys:
                print(f"⚠️  Warning: Missing keys in scan response: {missing_keys}")
            
            if "diagnosis" in response and response["diagnosis"]:
                diagnosis_text = response["diagnosis"]
                print(f"   Diagnosis length: {len(diagnosis_text)} chars")
                print(f"   Diagnosis preview: {diagnosis_text[:80]}...")
            else:
                print(f"⚠️  Warning: Empty or missing diagnosis text")
        
        return success, response

    def test_yield_endpoint(self):
        """Test yield estimation endpoint"""
        test_cases = [
            {
                "name": "Yield - Paddy 2 acres Hindi",
                "data": {"crop": "Paddy", "area_acres": 2.0, "lang": "hi"}
            },
            {
                "name": "Yield - Wheat 5 acres English", 
                "data": {"crop": "Wheat", "area_acres": 5.0, "lang": "en"}
            },
            {
                "name": "Yield - Small area (0.5 acres)",
                "data": {"crop": "Tomato", "area_acres": 0.5, "lang": "en"}
            }
        ]
        
        results = []
        for test_case in test_cases:
            success, response = self.run_test(
                test_case["name"], 
                "POST", 
                "yield", 
                200, 
                test_case["data"],
                45  # Longer timeout for AI processing
            )
            
            if success:
                # Validate yield response structure
                required_keys = ["estimated_yield", "crop", "area"]
                missing_keys = [key for key in required_keys if key not in response]
                if missing_keys:
                    print(f"⚠️  Warning: Missing keys in yield response: {missing_keys}")
                
                if "estimated_yield" in response and response["estimated_yield"]:
                    yield_text = response["estimated_yield"]
                    print(f"   Yield estimate length: {len(yield_text)} chars")
                    print(f"   Yield preview: {yield_text[:80]}...")
                else:
                    print(f"⚠️  Warning: Empty or missing yield estimate")
            
            results.append((success, response))
        
        return all(result[0] for result in results), results

    def test_error_handling(self):
        """Test error handling with invalid requests"""
        print(f"\n🔍 Testing Error Handling...")
        
        # Test invalid endpoint
        success, _ = self.run_test("Invalid Endpoint", "GET", "nonexistent", 404)
        
        # Test advisory with invalid data
        invalid_advisory = self.run_test(
            "Advisory - Invalid Language", 
            "POST", 
            "advisory", 
            200,  # Should still work, might default to Hindi
            {"query": "test", "crop": "InvalidCrop", "lang": "invalid"}
        )
        
        # Test scan without image
        no_image_scan = self.run_test(
            "Scan - Missing Image", 
            "POST", 
            "scan", 
            422,  # Should return validation error
            {"crop": "Paddy", "lang": "en"}
        )
        
        return True  # Error handling tests are informational

def main():
    print("🌾 KisanSetu API Testing Suite")
    print("=" * 50)
    
    tester = KisanSetuAPITester()
    
    # Run all tests
    print("\n📡 Testing Basic Connectivity...")
    tester.test_root_endpoint()
    
    print("\n📊 Testing Dashboard Data...")
    tester.test_dashboard_data()
    
    print("\n🌍 Testing Location-Specific Dashboard Data...")
    tester.test_location_specific_dashboard_data()
    
    print("\n🤖 Testing AI Advisory...")
    tester.test_advisory_endpoint()
    
    print("\n📸 Testing Pest Scan...")
    tester.test_scan_endpoint()
    
    print("\n📈 Testing Yield Estimation...")
    tester.test_yield_endpoint()
    
    print("\n⚠️  Testing Error Handling...")
    tester.test_error_handling()
    
    # Print final results
    print(f"\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Print failed tests
    failed_tests = [result for result in tester.test_results if not result["success"]]
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   • {test['test']}: {test['actual_status']} - {test['response_preview']}")
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "summary": {
                "total_tests": tester.tests_run,
                "passed_tests": tester.tests_passed,
                "success_rate": tester.tests_passed/tester.tests_run*100 if tester.tests_run > 0 else 0,
                "timestamp": datetime.now().isoformat()
            },
            "detailed_results": tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())