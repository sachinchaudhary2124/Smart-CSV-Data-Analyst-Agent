import os

files_to_modify = [
    r"frontend/src/services/api.ts",
    r"frontend/src/pages/upload/UploadPage.tsx",
    r"frontend/src/pages/system/SystemPage.tsx",
    r"frontend/src/pages/settings/SettingsPage.tsx",
    r"frontend/src/pages/reports/ReportsPage.tsx",
    r"frontend/src/pages/history/HistoryPage.tsx",
    r"frontend/src/pages/dashboard/DashboardHome.tsx",
    r"frontend/src/pages/chat/ChatPage.tsx",
    r"frontend/src/pages/charts/ChartsPage.tsx",
    r"frontend/src/pages/analytics/AnalyticsPage.tsx",
    r"frontend/src/components/layout/TopNavbar.tsx",
    r"frontend/src/components/errors/ConnectionLostAlert.tsx"
]

project_root = r"c:\Users\Sachin Chaudhari\OneDrive\Desktop\SmartBridge\Project\Project 2\Smart CSV Data Analyst Agent"

for rel_path in files_to_modify:
    abs_path = os.path.join(project_root, rel_path)
    if os.path.exists(abs_path):
        try:
            with open(abs_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # replace 127.0.0.1:8000 or localhost:8000 with 127.0.0.1:8005
            new_content = content.replace("127.0.0.1:8000", "127.0.0.1:8005")
            new_content = new_content.replace("localhost:8000", "127.0.0.1:8005")
            
            if new_content != content:
                with open(abs_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated: {rel_path}")
            else:
                print(f"No changes needed: {rel_path}")
        except Exception as e:
            print(f"Error updating {rel_path}: {e}")
    else:
        print(f"File not found: {rel_path}")
