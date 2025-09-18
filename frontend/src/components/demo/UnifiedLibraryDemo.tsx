import { Book, Heart, Zap, Search, Filter, Star, TrendingUp } from 'lucide-react';
import React from 'react';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const UnifiedLibraryDemo: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-900 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Unified Library Navigation - Implementation Complete</h1>
        <p className="text-gray-300 mb-6">
          The unified library system provides seamless navigation between content and practice libraries 
          with cross-recommendations, unified search, and personalized experiences.
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-purple-400" />
            <h3 className="text-xl font-semibold">Unified Search</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Search across both content and practice libraries simultaneously with intelligent filtering and suggestions.
          </p>
          <div className="space-y-2">
            <Badge variant="outline" className="mr-2">Cross-library search</Badge>
            <Badge variant="outline" className="mr-2">Live suggestions</Badge>
            <Badge variant="outline">Smart filtering</Badge>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <h3 className="text-xl font-semibold">Cross Recommendations</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Intelligent recommendations that suggest complementary content and practices based on user preferences.
          </p>
          <div className="space-y-2">
            <Badge variant="outline" className="mr-2">Personalized</Badge>
            <Badge variant="outline" className="mr-2">Context-aware</Badge>
            <Badge variant="outline">Dynamic</Badge>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-8 h-8 text-yellow-400" />
            <h3 className="text-xl font-semibold">Tabbed Navigation</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Seamless switching between unified view, content library, and practice library with preserved state.
          </p>
          <div className="space-y-2">
            <Badge variant="outline" className="mr-2">State preservation</Badge>
            <Badge variant="outline" className="mr-2">Quick access</Badge>
            <Badge variant="outline">Smooth transitions</Badge>
          </div>
        </Card>
      </div>

      {/* Implementation Features */}
      <Card className="p-6 mb-8 bg-gray-800">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Search className="w-6 h-6 text-purple-400" />
          Key Implementation Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Search & Discovery</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Unified search across content and practices
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Real-time search suggestions and autocomplete
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Advanced filtering by type, category, difficulty, duration
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Debounced search with loading states
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Navigation & UX</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Three-tab navigation system (Unified, Content, Practices)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Quick access buttons for common actions
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Cross-recommendations between content types
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Personalized &ldquo;For You&rdquo; sections
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Technical Implementation */}
      <Card className="p-6 mb-8 bg-gray-800">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Filter className="w-6 h-6 text-blue-400" />
          Technical Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3 text-blue-300">State Management</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• React hooks for local state</li>
              <li>• Unified search state</li>
              <li>• Filter state management</li>
              <li>• Loading and error states</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3 text-blue-300">API Integration</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• Content service integration</li>
              <li>• Practice service integration</li>
              <li>• Parallel API calls</li>
              <li>• Error handling</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3 text-blue-300">User Experience</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• Responsive design</li>
              <li>• Dark theme consistency</li>
              <li>• Smooth transitions</li>
              <li>• Accessibility features</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Sample Navigation Tabs Demo */}
      <Card className="p-6 bg-gray-800">
        <h2 className="text-2xl font-semibold mb-4">Navigation Preview</h2>
        <div className="flex space-x-1 bg-gray-700 rounded-lg p-1 mb-4">
          <Button variant="default" className="bg-purple-600">
            <Zap className="w-4 h-4 mr-2" />
            Unified Library
          </Button>
          <Button variant="ghost">
            <Book className="w-4 h-4 mr-2" />
            Content
          </Button>
          <Button variant="ghost">
            <Heart className="w-4 h-4 mr-2" />
            Practices
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
            <Book className="w-6 h-6" />
            <span>Content Library</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
            <Heart className="w-6 h-6" />
            <span>Practice Library</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
            <Zap className="w-6 h-6" />
            <span>Quick Sessions</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
            <Star className="w-6 h-6" />
            <span>Mindfulness</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UnifiedLibraryDemo;