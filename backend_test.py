import requests
import sys
import json
from datetime import datetime, date
from typing import Dict, Any

class BudgetPlannerAPITester:
    def __init__(self, base_url="https://fiscal-buddy-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_category_id = None
        self.created_transaction_id = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {name}: {details}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Dict[Any, Any] = None, params: Dict[str, Any] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    details = f"Status: {response.status_code}"
                except:
                    response_data = {}
                    details = f"Status: {response.status_code} (No JSON response)"
            else:
                try:
                    error_data = response.json()
                    details = f"Expected {expected_status}, got {response.status_code}. Error: {error_data}"
                except:
                    details = f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}"
                response_data = {}

            self.log_test(name, success, details)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "api/",
            200
        )
        return success

    def test_get_categories(self):
        """Test getting categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET", 
            "api/categories",
            200
        )
        
        if success and isinstance(response, list):
            self.log_test("Categories Response Format", True, f"Found {len(response)} categories")
            # Store a category ID for later tests
            if response:
                self.default_category_id = response[0].get('id')
        else:
            self.log_test("Categories Response Format", False, "Response is not a list")
            
        return success

    def test_create_category(self):
        """Test creating a new category"""
        test_category = {
            "name": f"Test Category {datetime.now().strftime('%H%M%S')}",
            "type": "expense",
            "budget_limit": 500.0,
            "color": "#FF5733"
        }
        
        success, response = self.run_test(
            "Create Category",
            "POST",
            "api/categories",
            200,
            data=test_category
        )
        
        if success and response.get('id'):
            self.created_category_id = response['id']
            self.log_test("Category Creation Response", True, f"Created category with ID: {self.created_category_id}")
        else:
            self.log_test("Category Creation Response", False, "No ID returned")
            
        return success

    def test_update_category(self):
        """Test updating a category"""
        if not self.created_category_id:
            self.log_test("Update Category", False, "No category ID available for update")
            return False
            
        update_data = {
            "name": "Updated Test Category",
            "budget_limit": 750.0
        }
        
        success, response = self.run_test(
            "Update Category",
            "PUT",
            f"api/categories/{self.created_category_id}",
            200,
            data=update_data
        )
        return success

    def test_create_transaction(self):
        """Test creating a transaction"""
        if not hasattr(self, 'default_category_id') or not self.default_category_id:
            self.log_test("Create Transaction", False, "No category ID available")
            return False
            
        test_transaction = {
            "type": "expense",
            "amount": 25.50,
            "category_id": self.default_category_id,
            "description": "Test transaction",
            "date": date.today().isoformat()
        }
        
        success, response = self.run_test(
            "Create Transaction",
            "POST",
            "api/transactions",
            200,
            data=test_transaction
        )
        
        if success and response.get('id'):
            self.created_transaction_id = response['id']
            self.log_test("Transaction Creation Response", True, f"Created transaction with ID: {self.created_transaction_id}")
        else:
            self.log_test("Transaction Creation Response", False, "No ID returned")
            
        return success

    def test_get_transactions(self):
        """Test getting transactions"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        success, response = self.run_test(
            "Get Transactions",
            "GET",
            "api/transactions",
            200,
            params={"month": current_month, "year": current_year}
        )
        
        if success and isinstance(response, list):
            self.log_test("Transactions Response Format", True, f"Found {len(response)} transactions")
        else:
            self.log_test("Transactions Response Format", False, "Response is not a list")
            
        return success

    def test_monthly_summary(self):
        """Test monthly summary endpoint"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        success, response = self.run_test(
            "Monthly Summary",
            "GET",
            "api/summary/monthly",
            200,
            params={"month": current_month, "year": current_year}
        )
        
        if success:
            required_fields = ['total_income', 'total_expenses', 'balance', 'category_breakdown']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Monthly Summary Fields", True, "All required fields present")
            else:
                self.log_test("Monthly Summary Fields", False, f"Missing fields: {missing_fields}")
                
        return success

    def test_budget_status(self):
        """Test budget status endpoint"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        success, response = self.run_test(
            "Budget Status",
            "GET",
            "api/summary/budget-status",
            200,
            params={"month": current_month, "year": current_year}
        )
        
        if success and isinstance(response, list):
            self.log_test("Budget Status Response Format", True, f"Found {len(response)} budget items")
        else:
            self.log_test("Budget Status Response Format", False, "Response is not a list")
            
        return success

    def test_yearly_summary(self):
        """Test yearly summary endpoint"""
        current_year = datetime.now().year
        
        success, response = self.run_test(
            "Yearly Summary",
            "GET",
            "api/summary/yearly",
            200,
            params={"year": current_year}
        )
        
        if success:
            required_fields = ['year', 'monthly_data', 'total_income', 'total_expenses']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Yearly Summary Fields", True, "All required fields present")
            else:
                self.log_test("Yearly Summary Fields", False, f"Missing fields: {missing_fields}")
                
        return success

    def test_update_transaction(self):
        """Test updating a transaction"""
        if not self.created_transaction_id:
            self.log_test("Update Transaction", False, "No transaction ID available for update")
            return False
            
        update_data = {
            "amount": 35.75,
            "description": "Updated test transaction"
        }
        
        success, response = self.run_test(
            "Update Transaction",
            "PUT",
            f"api/transactions/{self.created_transaction_id}",
            200,
            data=update_data
        )
        return success

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test transaction
        if self.created_transaction_id:
            success, _ = self.run_test(
                "Delete Test Transaction",
                "DELETE",
                f"api/transactions/{self.created_transaction_id}",
                200
            )
        
        # Delete test category
        if self.created_category_id:
            success, _ = self.run_test(
                "Delete Test Category",
                "DELETE",
                f"api/categories/{self.created_category_id}",
                200
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Budget Planner API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        # Core API tests
        self.test_health_check()
        self.test_get_categories()
        
        # CRUD operations
        self.test_create_category()
        self.test_update_category()
        self.test_create_transaction()
        self.test_get_transactions()
        self.test_update_transaction()
        
        # Summary endpoints
        self.test_monthly_summary()
        self.test_budget_status()
        self.test_yearly_summary()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            failed_tests = [r for r in self.test_results if r['status'] == 'FAIL']
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
            return 1

def main():
    tester = BudgetPlannerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())