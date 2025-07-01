#!/bin/bash
# replace-components.sh - Helper to replace components with enhanced versions

echo "🔄 Component Replacement Helper"
echo "==============================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "frontend/src/components" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo "This script will help you replace the placeholder components."
echo "You need to manually copy the enhanced versions from the Claude artifacts."
echo ""

# Function to check if a file has been replaced
check_component() {
    local file_path="$1"
    local component_name="$2"
    
    if [ -f "$file_path" ]; then
        if grep -q "AlertTriangle.*placeholder\|Replace this file" "$file_path"; then
            print_warning "$component_name is still a placeholder"
            return 1
        else
            print_success "$component_name has been updated!"
            return 0
        fi
    else
        print_error "$component_name file not found at $file_path"
        return 1
    fi
}

# Function to show file info
show_file_info() {
    local file_path="$1"
    local component_name="$2"
    
    echo ""
    echo "📁 $component_name"
    echo "   File: $file_path"
    if [ -f "$file_path" ]; then
        local line_count=$(wc -l < "$file_path")
        echo "   Current size: $line_count lines"
        
        if grep -q "AlertTriangle.*placeholder\|Replace this file" "$file_path"; then
            echo "   Status: 🟡 Placeholder (needs replacement)"
        else
            echo "   Status: 🟢 Enhanced version detected"
        fi
    else
        echo "   Status: 🔴 File not found"
    fi
}

print_status "Checking current component status..."

# Check all components
show_file_info "frontend/src/components/pdf/EnhancedPDFViewer.jsx" "Enhanced PDF Viewer"
show_file_info "frontend/src/components/topics/EnhancedTopicManager.jsx" "Enhanced Topic Manager"
show_file_info "frontend/src/App.jsx" "Main App Component"

echo ""
echo "🎯 REPLACEMENT INSTRUCTIONS:"
echo "=========================="
echo ""

echo "1️⃣  Enhanced PDF Viewer:"
echo "   📝 Open: frontend/src/components/pdf/EnhancedPDFViewer.jsx"
echo "   🔄 Replace with: 'Enhanced PDF Viewer with Progress Restoration' artifact"
echo "   ✨ Features: Resume reading, enhanced timer, progress tracking"
echo ""

echo "2️⃣  Enhanced Topic Manager:"
echo "   📝 Open: frontend/src/components/topics/EnhancedTopicManager.jsx" 
echo "   🔄 Replace with: 'Enhanced Topic Manager with Color Circles' artifact"
echo "   ✨ Features: Color circles, direct upload, expandable cards"
echo ""

echo "3️⃣  Enhanced App (Optional but Recommended):"
echo "   📝 Open: frontend/src/App.jsx"
echo "   🔄 Replace with: 'Enhanced PDF Study Planner' artifact"
echo "   ✨ Features: PDF storage system, resume functionality"
echo ""

# Interactive replacement checker
echo "📋 REPLACEMENT CHECKER:"
echo "====================="
echo ""

while true; do
    echo "Choose an option:"
    echo "1) Check component status"
    echo "2) Open component files in default editor"
    echo "3) Show detailed replacement instructions"
    echo "4) Exit"
    echo ""
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            echo ""
            print_status "Checking component status..."
            show_file_info "frontend/src/components/pdf/EnhancedPDFViewer.jsx" "Enhanced PDF Viewer"
            show_file_info "frontend/src/components/topics/EnhancedTopicManager.jsx" "Enhanced Topic Manager"
            show_file_info "frontend/src/App.jsx" "Main App Component"
            
            # Check if all are updated
            if check_component "frontend/src/components/pdf/EnhancedPDFViewer.jsx" "PDF Viewer" && \
               check_component "frontend/src/components/topics/EnhancedTopicManager.jsx" "Topic Manager"; then
                echo ""
                print_success "🎉 All components have been updated!"
                print_success "Your app now has full enhanced functionality!"
                echo ""
                echo "🚀 Features now available:"
                echo "   ✅ Color circle topic selection"
                echo "   ✅ Direct PDF upload from topics"
                echo "   ✅ Resume reading functionality"
                echo "   ✅ Enhanced time tracking"
                echo "   ✅ Beautiful progress indicators"
                echo "   ✅ Expandable topic cards"
            fi
            ;;
        2)
            print_status "Opening component files..."
            if command -v code > /dev/null; then
                code frontend/src/components/pdf/EnhancedPDFViewer.jsx
                code frontend/src/components/topics/EnhancedTopicManager.jsx
                code frontend/src/App.jsx
                print_success "Files opened in VS Code"
            elif command -v open > /dev/null; then
                open frontend/src/components/pdf/EnhancedPDFViewer.jsx
                open frontend/src/components/topics/EnhancedTopicManager.jsx
                open frontend/src/App.jsx
                print_success "Files opened with default editor"
            else
                print_warning "No editor found. Please manually open the files:"
                echo "   - frontend/src/components/pdf/EnhancedPDFViewer.jsx"
                echo "   - frontend/src/components/topics/EnhancedTopicManager.jsx"
                echo "   - frontend/src/App.jsx"
            fi
            ;;
        3)
            echo ""
            echo "📖 DETAILED REPLACEMENT INSTRUCTIONS:"
            echo "====================================="
            echo ""
            echo "🔄 How to replace each component:"
            echo ""
            echo "1. Go to the Claude conversation"
            echo "2. Find the artifact you need:"
            echo "   • 'Enhanced PDF Viewer with Progress Restoration'"
            echo "   • 'Enhanced Topic Manager with Color Circles'"
            echo "   • 'Enhanced PDF Study Planner with Better Storage & Progress'"
            echo ""
            echo "3. Click on the artifact to view the code"
            echo "4. Copy the entire code content"
            echo "5. Open the corresponding file in your editor"
            echo "6. Replace ALL existing content with the copied code"
            echo "7. Save the file"
            echo "8. The app will automatically reload with new features"
            echo ""
            echo "💡 TIP: Replace components one at a time and test each one!"
            ;;
        4)
            echo ""
            print_success "Happy coding! 🎉"
            echo ""
            echo "📖 Remember: Your app is currently working with basic functionality."
            echo "Replace the components for the full enhanced experience!"
            break
            ;;
        *)
            print_error "Invalid choice. Please enter 1, 2, 3, or 4."
            ;;
    esac
    echo ""
done