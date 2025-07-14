#!/bin/bash

echo "🚀 Setting up Tailwind CSS for DPG Institute..."

# Navigate to client directory
cd client

echo "📦 Installing Tailwind CSS dependencies..."
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

echo "⚙️ Initializing Tailwind CSS..."
npx tailwindcss init -p

echo "✅ Tailwind CSS setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your tailwind.config.js is properly configured"
echo "2. Ensure your CSS file imports Tailwind directives"
echo "3. Start the development server: npm run client"
echo ""
echo "🎨 You can now use Tailwind CSS classes in your React components!" 