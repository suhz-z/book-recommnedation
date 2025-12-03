import re
import json
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Optional
import argparse

class LogAnalyzer:
    """Analyze FastAPI application logs for insights and error tracking."""
    
    def __init__(self, log_file: str):
        self.log_file = Path(log_file)
        self.logs = []
        self.parsed_logs = []
        
    def parse_logs(self):
        """Parse log entries from file - supports both JSON and text formats."""
        with open(self.log_file, 'r') as f:
            for line in f:  
                line = line.strip()
                if not line:
                    continue
                    
                try:
                    # Try parsing as JSON first (structured logs)
                    log_entry = json.loads(line)
                    self.parsed_logs.append(log_entry)
                except json.JSONDecodeError:
                    # Fall back to regex for text-based logs
                    # Pattern for typical FastAPI/Uvicorn logs
                    pattern = r'(?P<timestamp>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3})\s+\|\s+(?P<level>\w+)\s+\|\s+(?P<logger>\S+)\s+\|\s+(?P<message>.+)'
                    match = re.match(pattern, line)
                    
                    if match:
                        self.parsed_logs.append(match.groupdict()) 
                    else:
                        # Simple fallback pattern
                        simple_pattern = r'(?P<level>INFO|DEBUG|WARNING|ERROR|CRITICAL):\s+(?P<message>.+)'
                        simple_match = re.match(simple_pattern, line)
                        if simple_match:
                            self.parsed_logs.append(simple_match.groupdict())
                        
        print(f"✓ Parsed {len(self.parsed_logs)} log entries")
        return self.parsed_logs
    
    def analyze_errors(self) -> Dict:
        """Extract and count error-related logs."""
        errors = [log for log in self.parsed_logs 
                 if log.get('level', '').upper() in ['ERROR', 'CRITICAL']]
        
        error_messages = Counter()
        for error in errors:
            msg = error.get('message', '')[:100]  # First 100 chars
            error_messages[msg] += 1
        
        return {
            'total_errors': len(errors),
            'unique_errors': len(error_messages),
            'top_errors': error_messages.most_common(10)
        }
    
    def extract_ip_addresses(self) -> Dict:
        """Extract and analyze IP addresses from logs."""
        ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        ip_counter = Counter()
        
        for log in self.parsed_logs:
            message = str(log.get('message', ''))
            ips = re.findall(ip_pattern, message)
            for ip in ips:
                ip_counter[ip] += 1
        
        return {
            'unique_ips': len(ip_counter),
            'total_requests': sum(ip_counter.values()),
            'most_frequent_ips': ip_counter.most_common(10)
        }
    
    def analyze_response_codes(self) -> Dict:
        """Analyze HTTP response status codes."""
        status_pattern = r'\s(2\d{2}|3\d{2}|4\d{2}|5\d{2})\s'
        status_counter = Counter()
        
        for log in self.parsed_logs:
            message = str(log.get('message', ''))
            codes = re.findall(status_pattern, message)
            for code in codes:
                status_counter[code] += 1
        
        # Group by category
        success = sum(count for code, count in status_counter.items() if code.startswith('2'))
        redirects = sum(count for code, count in status_counter.items() if code.startswith('3'))
        client_errors = sum(count for code, count in status_counter.items() if code.startswith('4'))
        server_errors = sum(count for code, count in status_counter.items() if code.startswith('5'))
        
        return {
            'status_distribution': dict(status_counter.most_common()),
            'success_count': success,
            'redirect_count': redirects,
            'client_error_count': client_errors,
            'server_error_count': server_errors
        }
    
    def analyze_endpoints(self) -> Dict:
        """Identify most accessed endpoints."""
        endpoint_pattern = r'(?:GET|POST|PUT|DELETE|PATCH)\s+(/[\w/\-]*)'
        endpoint_counter = Counter()
        
        for log in self.parsed_logs:
            message = str(log.get('message', ''))
            endpoints = re.findall(endpoint_pattern, message)
            for endpoint in endpoints:
                endpoint_counter[endpoint] += 1
        
        return {
            'total_endpoints': len(endpoint_counter),
            'most_accessed': endpoint_counter.most_common(10)
        }
    
    def calculate_error_rate(self) -> float:
        """Calculate overall error rate percentage."""
        total = len(self.parsed_logs)
        if total == 0:
            return 0.0
        
        errors = len([log for log in self.parsed_logs 
                     if log.get('level', '').upper() in ['ERROR', 'CRITICAL']])
        return (errors / total) * 100
    
    def find_slowest_requests(self) -> List:
        """Identify slow requests if response time is logged."""
        time_pattern = r'(?:completed|took|duration).*?(\d+(?:\.\d+)?)\s*(?:ms|seconds?)'
        slow_requests = []
        
        for log in self.parsed_logs:
            message = str(log.get('message', ''))
            times = re.findall(time_pattern, message, re.IGNORECASE)
            if times:
                duration = float(times[0])
                if duration > 1000:  # > 1 second
                    slow_requests.append({
                        'message': message[:150],
                        'duration_ms': duration
                    })
        
        return sorted(slow_requests, key=lambda x: x['duration_ms'], reverse=True)[:10]
    
    def generate_report(self):
        """Generate comprehensive analysis report."""
        print("\n" + "="*60)
        print("FastAPI Log Analysis Report".center(60))
        print("="*60 + "\n")
        
        # General Stats
        print(f"📊 Total Log Entries: {len(self.parsed_logs)}")
        print(f"📁 Log File: {self.log_file}")
        print(f"⚠️  Error Rate: {self.calculate_error_rate():.2f}%\n")
        
        # Error Analysis
        print("-" * 60)
        print("🔴 ERROR ANALYSIS")
        print("-" * 60)
        error_stats = self.analyze_errors()
        print(f"Total Errors: {error_stats['total_errors']}")
        print(f"Unique Error Types: {error_stats['unique_errors']}\n")
        
        if error_stats['top_errors']:
            print("Top 5 Errors:")
            for i, (error, count) in enumerate(error_stats['top_errors'][:5], 1):
                print(f"  {i}. [{count}x] {error}")
        
        # IP Analysis
        print("\n" + "-" * 60)
        print("🌐 IP ADDRESS ANALYSIS")
        print("-" * 60)
        ip_stats = self.extract_ip_addresses()
        print(f"Unique IP Addresses: {ip_stats['unique_ips']}")
        print(f"Total Requests from IPs: {ip_stats['total_requests']}\n")
        
        if ip_stats['most_frequent_ips']:
            print("Top 5 Most Frequent IPs:")
            for i, (ip, count) in enumerate(ip_stats['most_frequent_ips'][:5], 1):
                print(f"  {i}. {ip}: {count} requests")
        
        # Response Codes
        print("\n" + "-" * 60)
        print("📈 HTTP RESPONSE CODES")
        print("-" * 60)
        response_stats = self.analyze_response_codes()
        print(f"✓ Success (2xx): {response_stats['success_count']}")
        print(f"↪ Redirects (3xx): {response_stats['redirect_count']}")
        print(f"⚠ Client Errors (4xx): {response_stats['client_error_count']}")
        print(f"❌ Server Errors (5xx): {response_stats['server_error_count']}")
        
        # Endpoints
        print("\n" + "-" * 60)
        print("🎯 ENDPOINT USAGE")
        print("-" * 60)
        endpoint_stats = self.analyze_endpoints()
        print(f"Total Unique Endpoints: {endpoint_stats['total_endpoints']}\n")
        
        if endpoint_stats['most_accessed']:
            print("Top 5 Most Accessed Endpoints:")
            for i, (endpoint, count) in enumerate(endpoint_stats['most_accessed'][:5], 1):
                print(f"  {i}. {endpoint}: {count} hits")
        
        # Slow Requests
        print("\n" + "-" * 60)
        print("🐌 SLOW REQUESTS (>1s)")
        print("-" * 60)
        slow = self.find_slowest_requests()
        if slow:
            for i, req in enumerate(slow[:5], 1):
                print(f"  {i}. {req['duration_ms']}ms - {req['message']}")
        else:
            print("  No slow requests detected")
        
        print("\n" + "="*60 + "\n")


def main():
    parser = argparse.ArgumentParser(description='Analyze FastAPI application logs')
    parser.add_argument('log_file', help='Path to the log file')
    parser.add_argument('--json', action='store_true', help='Export results as JSON')
    
    args = parser.parse_args()
    
    analyzer = LogAnalyzer(args.log_file)
    analyzer.parse_logs()
    analyzer.generate_report()
    
    if args.json:
        output = {
            'errors': analyzer.analyze_errors(),
            'ips': analyzer.extract_ip_addresses(),
            'response_codes': analyzer.analyze_response_codes(),
            'endpoints': analyzer.analyze_endpoints(),
            'error_rate': analyzer.calculate_error_rate()
        }
        
        output_file = f"log_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(output, f, indent=2)
        print(f"📄 JSON report saved to: {output_file}")


if __name__ == "__main__":
    main()
