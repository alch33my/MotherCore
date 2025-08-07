#!/bin/bash

# MotherCore Installation Script for Linux
# This script helps you install MotherCore on Linux systems

set -e

echo "🚀 MotherCore Installation Script"
echo "================================="
echo ""

# Detect system
if [[ -f /etc/debian_version ]]; then
    DISTRO="debian"
    echo "📦 Detected Debian/Ubuntu system"
elif [[ -f /etc/arch-release ]]; then
    DISTRO="arch"
    echo "📦 Detected Arch Linux system"
elif [[ -f /etc/fedora-release ]]; then
    DISTRO="fedora"
    echo "📦 Detected Fedora system"
else
    DISTRO="generic"
    echo "📦 Detected generic Linux system"
fi

echo ""
echo "Please choose your installation method:"
echo "1) AppImage (Universal - Recommended)"
echo "2) Debian Package (.deb) - Debian/Ubuntu only"
echo "3) Manual download"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔽 Downloading AppImage..."
        wget -O "MotherCore-0.0.1.AppImage" "https://github.com/alch33my/mothercore/releases/download/v0.0.1/MotherCore-0.0.1.AppImage"
        
        echo "🔧 Making executable..."
        chmod +x MotherCore-0.0.1.AppImage
        
        echo "✅ Installation complete!"
        echo ""
        echo "To run MotherCore:"
        echo "  ./MotherCore-0.0.1.AppImage"
        echo ""
        echo "To install system-wide (optional):"
        echo "  sudo mv MotherCore-0.0.1.AppImage /usr/local/bin/mothercore"
        echo "  # Then run with: mothercore"
        ;;
        
    2)
        if [[ "$DISTRO" != "debian" ]]; then
            echo "❌ .deb packages are only supported on Debian/Ubuntu systems"
            echo "   Please use the AppImage instead (option 1)"
            exit 1
        fi
        
        echo ""
        echo "🔽 Downloading .deb package..."
        wget -O "mothercore_0.0.1_amd64.deb" "https://github.com/alch33my/mothercore/releases/download/v0.0.1/mothercore_0.0.1_amd64.deb"
        
        echo "📦 Installing package..."
        sudo dpkg -i mothercore_0.0.1_amd64.deb
        
        echo "🔧 Fixing dependencies if needed..."
        sudo apt-get install -f
        
        echo "✅ Installation complete!"
        echo ""
        echo "To run MotherCore:"
        echo "  mothercore"
        echo "  # Or find it in your applications menu"
        ;;
        
    3)
        echo ""
        echo "📋 Manual Download Links:"
        echo ""
        echo "AppImage (Universal Linux):"
        echo "  https://github.com/alch33my/mothercore/releases/download/v0.0.1/MotherCore-0.0.1.AppImage"
        echo ""
        echo "Debian Package (.deb):"
        echo "  https://github.com/alch33my/mothercore/releases/download/v0.0.1/mothercore_0.0.1_amd64.deb"
        echo ""
        echo "After downloading AppImage:"
        echo "  chmod +x MotherCore-0.0.1.AppImage"
        echo "  ./MotherCore-0.0.1.AppImage"
        echo ""
        echo "After downloading .deb:"
        echo "  sudo dpkg -i mothercore_0.0.1_amd64.deb"
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Welcome to MotherCore!"
echo "   Your secure, portable knowledge management system"
echo ""
echo "📚 Next steps:"
echo "   1. Launch MotherCore"
echo "   2. Create your master password"
echo "   3. Set up your first organization"
echo "   4. Start building your knowledge base!"
echo ""
echo "🐛 Issues? Visit: https://github.com/alch33my/mothercore/issues"
echo ""