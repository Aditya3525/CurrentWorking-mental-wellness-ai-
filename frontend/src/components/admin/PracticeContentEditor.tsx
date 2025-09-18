import {
  Save,
  ArrowLeft,
  Upload,
  Image,
  FileAudio,
  FileText,
  Video,
  Trash2,
  Plus,
  Volume2,
  Play,
  Pause,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

// Types
interface AudioFile {
  id: string;
  name: string;
  url: string;
  duration: number; // in seconds
  size: number; // in bytes
  type: 'intro' | 'guide' | 'outro' | 'background' | 'step';
  uploadedAt: Date;
  isProcessing?: boolean;
}

interface VisualAid {
  id: string;
  type: 'image' | 'video' | 'diagram' | 'infographic';
  name: string;
  url: string;
  thumbnailUrl?: string;
  description: string;
  altText: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedAt: Date;
}

interface Equipment {
  id: string;
  name: string;
  category: 'essential' | 'recommended' | 'optional' | 'alternative';
  description: string;
  imageUrl?: string;
  purchaseLinks?: {
    vendor: string;
    url: string;
    price?: string;
  }[];
  alternatives?: string[];
}

interface Benefit {
  id: string;
  title: string;
  description: string;
  category: 'physical' | 'mental' | 'emotional' | 'spiritual' | 'social';
  evidenceLevel: 'research-backed' | 'traditional' | 'anecdotal';
  sources?: string[];
}

interface Prerequisite {
  id: string;
  type: 'practice' | 'skill' | 'knowledge' | 'physical';
  title: string;
  description: string;
  isRequired: boolean;
  practiceId?: string; // Reference to another practice
}

interface PracticeContent {
  id?: string;
  practiceId: string;
  
  // Rich text content
  instructions: string;
  preparation: string;
  guidance: string;
  modifications: string;
  contraindications: string;
  
  // Audio content
  audioFiles: AudioFile[];
  hasNarration: boolean;
  narratorVoice: 'male' | 'female' | 'neutral';
  audioSettings: {
    backgroundMusicVolume: number;
    narrationVolume: number;
    ambientSoundsVolume: number;
    enableSilenceDetection: boolean;
  };
  
  // Visual content
  visualAids: VisualAid[];
  thumbnailUrl?: string;
  backgroundImageUrl?: string;
  
  // Equipment and requirements
  equipment: Equipment[];
  space: {
    minimum: string;
    recommended: string;
    indoor: boolean;
    outdoor: boolean;
    quiet: boolean;
  };
  
  // Benefits and outcomes
  benefits: Benefit[];
  expectedOutcomes: string[];
  
  // Prerequisites and preparation
  prerequisites: Prerequisite[];
  preparationSteps: string[];
  
  // Safety and accessibility
  safetyNotes: string[];
  accessibilityFeatures: string[];
  ageRecommendations: {
    minAge?: number;
    maxAge?: number;
    notes: string;
  };
  
  // Content metadata
  lastUpdated: Date;
  version: string;
  approvedBy?: string;
  reviewNotes?: string;
}

interface PracticeContentEditorProps {
  onNavigate: (page: string, practiceId?: string) => void;
  practiceId: string;
}

// Mock data
const mockContent: PracticeContent = {
  practiceId: '1',
  instructions: '',
  preparation: '',
  guidance: '',
  modifications: '',
  contraindications: '',
  audioFiles: [],
  hasNarration: false,
  narratorVoice: 'neutral',
  audioSettings: {
    backgroundMusicVolume: 0.3,
    narrationVolume: 0.8,
    ambientSoundsVolume: 0.2,
    enableSilenceDetection: true
  },
  visualAids: [],
  equipment: [],
  space: {
    minimum: 'Small comfortable area',
    recommended: 'Quiet room with yoga mat',
    indoor: true,
    outdoor: false,
    quiet: true
  },
  benefits: [],
  expectedOutcomes: [],
  prerequisites: [],
  preparationSteps: [],
  safetyNotes: [],
  accessibilityFeatures: [],
  ageRecommendations: {
    notes: 'Suitable for adults of all ages'
  },
  lastUpdated: new Date(),
  version: '1.0'
};

export const PracticeContentEditor: React.FC<PracticeContentEditorProps> = ({ 
  onNavigate, 
  practiceId 
}) => {
  const [content, setContent] = useState<PracticeContent>(mockContent);
  const [activeTab, setActiveTab] = useState<'instructions' | 'audio' | 'visual' | 'equipment' | 'benefits' | 'safety'>('instructions');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load content
  useEffect(() => {
    // Load practice content from API
    console.log('Loading content for practice:', practiceId);
  }, [practiceId]);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000);
    return () => clearTimeout(timer);
  }, [content]);

  const handleAutoSave = async () => {
    setSaveStatus('saving');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  };

  const updateContent = (updates: Partial<PracticeContent>) => {
    setContent(prev => ({ ...prev, ...updates }));
  };

  const handleFileUpload = async (file: File, type: 'audio' | 'visual') => {
    const fileId = `${type}-${Date.now()}`;
    
    // Start upload progress
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
    
    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      }
      
      if (type === 'audio') {
        const audioFile: AudioFile = {
          id: fileId,
          name: file.name,
          url: URL.createObjectURL(file),
          duration: 120, // Mock duration
          size: file.size,
          type: 'guide',
          uploadedAt: new Date()
        };
        
        updateContent({
          audioFiles: [...content.audioFiles, audioFile]
        });
      } else {
        const visualAid: VisualAid = {
          id: fileId,
          type: file.type.startsWith('video') ? 'video' : 'image',
          name: file.name,
          url: URL.createObjectURL(file),
          description: '',
          altText: '',
          size: file.size,
          uploadedAt: new Date()
        };
        
        updateContent({
          visualAids: [...content.visualAids, visualAid]
        });
      }
      
      // Clear upload progress
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }
  };

  const removeAudioFile = (audioId: string) => {
    updateContent({
      audioFiles: content.audioFiles.filter(audio => audio.id !== audioId)
    });
  };

  const removeVisualAid = (visualId: string) => {
    updateContent({
      visualAids: content.visualAids.filter(visual => visual.id !== visualId)
    });
  };

  const playAudio = (audioFile: AudioFile) => {
    if (audioRef.current) {
      audioRef.current.src = audioFile.url;
      audioRef.current.play();
      setIsPlaying(audioFile.id);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(null);
    }
  };

  const addEquipment = () => {
    const newEquipment: Equipment = {
      id: `equipment-${Date.now()}`,
      name: '',
      category: 'recommended',
      description: '',
      alternatives: []
    };
    
    updateContent({
      equipment: [...content.equipment, newEquipment]
    });
  };

  const updateEquipment = (equipmentId: string, updates: Partial<Equipment>) => {
    updateContent({
      equipment: content.equipment.map(eq => 
        eq.id === equipmentId ? { ...eq, ...updates } : eq
      )
    });
  };

  const removeEquipment = (equipmentId: string) => {
    updateContent({
      equipment: content.equipment.filter(eq => eq.id !== equipmentId)
    });
  };

  const addBenefit = () => {
    const newBenefit: Benefit = {
      id: `benefit-${Date.now()}`,
      title: '',
      description: '',
      category: 'mental',
      evidenceLevel: 'traditional'
    };
    
    updateContent({
      benefits: [...content.benefits, newBenefit]
    });
  };

  const updateBenefit = (benefitId: string, updates: Partial<Benefit>) => {
    updateContent({
      benefits: content.benefits.map(benefit => 
        benefit.id === benefitId ? { ...benefit, ...updates } : benefit
      )
    });
  };

  const removeBenefit = (benefitId: string) => {
    updateContent({
      benefits: content.benefits.filter(benefit => benefit.id !== benefitId)
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderInstructionsTab = () => (
    <div className="space-y-6">
      {/* Practice Instructions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Practice Instructions</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-2">
              Step-by-Step Instructions *
            </label>
            <textarea
              id="instructions"
              value={content.instructions}
              onChange={(e) => updateContent({ instructions: e.target.value })}
              rows={8}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide detailed, step-by-step instructions for the practice..."
              required
            />
          </div>
          
          <div>
            <label htmlFor="preparation" className="block text-sm font-medium text-gray-300 mb-2">
              Preparation Instructions
            </label>
            <textarea
              id="preparation"
              value={content.preparation}
              onChange={(e) => updateContent({ preparation: e.target.value })}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="How to prepare for this practice (space setup, mental preparation, etc.)..."
            />
          </div>
          
          <div>
            <label htmlFor="guidance" className="block text-sm font-medium text-gray-300 mb-2">
              Guidance & Tips
            </label>
            <textarea
              id="guidance"
              value={content.guidance}
              onChange={(e) => updateContent({ guidance: e.target.value })}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional guidance, tips, and helpful reminders..."
            />
          </div>
          
          <div>
            <label htmlFor="modifications" className="block text-sm font-medium text-gray-300 mb-2">
              Modifications & Adaptations
            </label>
            <textarea
              id="modifications"
              value={content.modifications}
              onChange={(e) => updateContent({ modifications: e.target.value })}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="How to modify this practice for different needs, abilities, or preferences..."
            />
          </div>
        </div>
      </div>

      {/* Space Requirements */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Space Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="minSpace" className="block text-sm font-medium text-gray-300 mb-2">
              Minimum Space Required
            </label>
            <input
              type="text"
              id="minSpace"
              value={content.space.minimum}
              onChange={(e) => updateContent({ 
                space: { ...content.space, minimum: e.target.value }
              })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Small comfortable area"
            />
          </div>
          
          <div>
            <label htmlFor="recSpace" className="block text-sm font-medium text-gray-300 mb-2">
              Recommended Space
            </label>
            <input
              type="text"
              id="recSpace"
              value={content.space.recommended}
              onChange={(e) => updateContent({ 
                space: { ...content.space, recommended: e.target.value }
              })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Quiet room with yoga mat"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={content.space.indoor}
              onChange={(e) => updateContent({ 
                space: { ...content.space, indoor: e.target.checked }
              })}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">Indoor suitable</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={content.space.outdoor}
              onChange={(e) => updateContent({ 
                space: { ...content.space, outdoor: e.target.checked }
              })}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">Outdoor suitable</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={content.space.quiet}
              onChange={(e) => updateContent({ 
                space: { ...content.space, quiet: e.target.checked }
              })}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">Quiet environment needed</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderAudioTab = () => (
    <div className="space-y-6">
      {/* Audio Upload */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Audio Content</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Audio</span>
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            files.forEach(file => handleFileUpload(file, 'audio'));
          }}
          className="hidden"
        />

        {content.audioFiles.length === 0 ? (
          <div className="text-center py-8">
            <FileAudio className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No audio files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {content.audioFiles.map((audio) => (
              <div key={audio.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600 rounded">
                      <FileAudio className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{audio.name}</div>
                      <div className="text-sm text-gray-400">
                        {formatDuration(audio.duration)} • {formatFileSize(audio.size)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => isPlaying === audio.id ? pauseAudio() : playAudio(audio)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                    >
                      {isPlaying === audio.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeAudioFile(audio.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs text-gray-400 mb-1">Audio Type</span>
                    <select
                      value={audio.type}
                      onChange={(e) => {
                        const updatedAudioFiles = content.audioFiles.map(a => 
                          a.id === audio.id ? { ...a, type: e.target.value as AudioFile['type'] } : a
                        );
                        updateContent({ audioFiles: updatedAudioFiles });
                      }}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="intro">Introduction</option>
                      <option value="guide">Main Guide</option>
                      <option value="outro">Outro/Closing</option>
                      <option value="background">Background Music</option>
                      <option value="step">Step-specific</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <audio ref={audioRef} onEnded={() => setIsPlaying(null)}>
          <track kind="captions" srcLang="en" label="English captions" />
        </audio>
      </div>

      {/* Audio Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Audio Settings</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Background Music Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={content.audioSettings.backgroundMusicVolume}
                onChange={(e) => updateContent({
                  audioSettings: {
                    ...content.audioSettings,
                    backgroundMusicVolume: parseFloat(e.target.value)
                  }
                })}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                {Math.round(content.audioSettings.backgroundMusicVolume * 100)}%
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Narration Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={content.audioSettings.narrationVolume}
                onChange={(e) => updateContent({
                  audioSettings: {
                    ...content.audioSettings,
                    narrationVolume: parseFloat(e.target.value)
                  }
                })}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                {Math.round(content.audioSettings.narrationVolume * 100)}%
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ambient Sounds Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={content.audioSettings.ambientSoundsVolume}
                onChange={(e) => updateContent({
                  audioSettings: {
                    ...content.audioSettings,
                    ambientSoundsVolume: parseFloat(e.target.value)
                  }
                })}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                {Math.round(content.audioSettings.ambientSoundsVolume * 100)}%
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="narratorVoice" className="block text-sm font-medium text-gray-300 mb-2">
                Narrator Voice
              </label>
              <select
                id="narratorVoice"
                value={content.narratorVoice}
                onChange={(e) => updateContent({ narratorVoice: e.target.value as PracticeContent['narratorVoice'] })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="neutral">Neutral Voice</option>
                <option value="male">Male Voice</option>
                <option value="female">Female Voice</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4 pt-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={content.hasNarration}
                  onChange={(e) => updateContent({ hasNarration: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Include narration</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={content.audioSettings.enableSilenceDetection}
                  onChange={(e) => updateContent({
                    audioSettings: {
                      ...content.audioSettings,
                      enableSilenceDetection: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Silence detection</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVisualTab = () => (
    <div className="space-y-6">
      {/* Visual Aids Upload */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Visual Aids</h3>
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,video/*';
              input.multiple = true;
              input.onchange = (e) => {
                const files = Array.from((e.target as HTMLInputElement).files || []);
                files.forEach(file => handleFileUpload(file, 'visual'));
              };
              input.click();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Media</span>
          </button>
        </div>

        {content.visualAids.length === 0 ? (
          <div className="text-center py-8">
            <Image className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No visual aids uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.visualAids.map((visual) => (
              <div key={visual.id} className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-600 flex items-center justify-center relative">
                  {visual.type === 'image' ? (
                    <img
                      src={visual.url}
                      alt={visual.altText}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => removeVisualAid(visual.id)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="p-3">
                  <input
                    type="text"
                    value={visual.description}
                    onChange={(e) => {
                      const updatedVisualAids = content.visualAids.map(v => 
                        v.id === visual.id ? { ...v, description: e.target.value } : v
                      );
                      updateContent({ visualAids: updatedVisualAids });
                    }}
                    placeholder="Description..."
                    className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                  />
                  
                  <input
                    type="text"
                    value={visual.altText}
                    onChange={(e) => {
                      const updatedVisualAids = content.visualAids.map(v => 
                        v.id === visual.id ? { ...v, altText: e.target.value } : v
                      );
                      updateContent({ visualAids: updatedVisualAids });
                    }}
                    placeholder="Alt text for accessibility..."
                    className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  
                  <div className="text-xs text-gray-400 mt-2">
                    {formatFileSize(visual.size)} • {visual.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderEquipmentTab = () => (
    <div className="space-y-6">
      {/* Equipment List */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Equipment & Props</h3>
          <button
            onClick={addEquipment}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Equipment</span>
          </button>
        </div>

        {content.equipment.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No equipment specified yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {content.equipment.map((equipment) => (
              <div key={equipment.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Equipment Name *
                    </label>
                    <input
                      type="text"
                      value={equipment.name}
                      onChange={(e) => updateEquipment(equipment.id, { name: e.target.value })}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Yoga mat"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={equipment.category}
                      onChange={(e) => updateEquipment(equipment.id, { category: e.target.value as Equipment['category'] })}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="essential">Essential</option>
                      <option value="recommended">Recommended</option>
                      <option value="optional">Optional</option>
                      <option value="alternative">Alternative</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => removeEquipment(equipment.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={equipment.description}
                    onChange={(e) => updateEquipment(equipment.id, { description: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe how this equipment is used in the practice..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBenefitsTab = () => (
    <div className="space-y-6">
      {/* Benefits */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Practice Benefits</h3>
          <button
            onClick={addBenefit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Benefit</span>
          </button>
        </div>

        {content.benefits.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No benefits specified yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {content.benefits.map((benefit) => (
              <div key={benefit.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Benefit Title *
                    </label>
                    <input
                      type="text"
                      value={benefit.title}
                      onChange={(e) => updateBenefit(benefit.id, { title: e.target.value })}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Reduces stress"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={benefit.category}
                      onChange={(e) => updateBenefit(benefit.id, { category: e.target.value as Benefit['category'] })}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="physical">Physical</option>
                      <option value="mental">Mental</option>
                      <option value="emotional">Emotional</option>
                      <option value="spiritual">Spiritual</option>
                      <option value="social">Social</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Evidence Level
                    </label>
                    <select
                      value={benefit.evidenceLevel}
                      onChange={(e) => updateBenefit(benefit.id, { evidenceLevel: e.target.value as Benefit['evidenceLevel'] })}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="research-backed">Research-backed</option>
                      <option value="traditional">Traditional knowledge</option>
                      <option value="anecdotal">Anecdotal evidence</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={benefit.description}
                    onChange={(e) => updateBenefit(benefit.id, { description: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe how this practice provides this benefit..."
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => removeBenefit(benefit.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSafetyTab = () => (
    <div className="space-y-6">
      {/* Safety Notes */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Safety & Accessibility</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="contraindications" className="block text-sm font-medium text-gray-300 mb-2">
              Contraindications & Warnings
            </label>
            <textarea
              id="contraindications"
              value={content.contraindications}
              onChange={(e) => updateContent({ contraindications: e.target.value })}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List any conditions, situations, or circumstances where this practice should be avoided..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="minAge" className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Age
              </label>
              <input
                type="number"
                id="minAge"
                min="0"
                max="100"
                value={content.ageRecommendations.minAge || ''}
                onChange={(e) => updateContent({
                  ageRecommendations: {
                    ...content.ageRecommendations,
                    minAge: e.target.value ? Number(e.target.value) : undefined
                  }
                })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="18"
              />
            </div>
            
            <div>
              <label htmlFor="maxAge" className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Age
              </label>
              <input
                type="number"
                id="maxAge"
                min="0"
                max="120"
                value={content.ageRecommendations.maxAge || ''}
                onChange={(e) => updateContent({
                  ageRecommendations: {
                    ...content.ageRecommendations,
                    maxAge: e.target.value ? Number(e.target.value) : undefined
                  }
                })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="No limit"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="ageNotes" className="block text-sm font-medium text-gray-300 mb-2">
              Age-related Notes
            </label>
            <textarea
              id="ageNotes"
              value={content.ageRecommendations.notes}
              onChange={(e) => updateContent({
                ageRecommendations: {
                  ...content.ageRecommendations,
                  notes: e.target.value
                }
              })}
              rows={2}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about age appropriateness..."
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabs = () => {
    const tabs = [
      { id: 'instructions', label: 'Instructions', icon: <FileText className="w-4 h-4" /> },
      { id: 'audio', label: 'Audio', icon: <Volume2 className="w-4 h-4" /> },
      { id: 'visual', label: 'Visual', icon: <Image className="w-4 h-4" /> },
      { id: 'equipment', label: 'Equipment', icon: <Settings className="w-4 h-4" /> },
      { id: 'benefits', label: 'Benefits', icon: <CheckCircle className="w-4 h-4" /> },
      { id: 'safety', label: 'Safety', icon: <AlertCircle className="w-4 h-4" /> }
    ];

    return (
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('practice-list')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Practice Content Editor</h1>
            <p className="text-gray-400">Manage rich content, media, and resources</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {saveStatus && (
            <div className={`flex items-center space-x-2 text-sm ${
              saveStatus === 'saving' ? 'text-yellow-400' :
              saveStatus === 'saved' ? 'text-green-400' :
              'text-red-400'
            }`}>
              {saveStatus === 'saving' && <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />}
              {saveStatus === 'saved' && <CheckCircle className="w-4 h-4" />}
              {saveStatus === 'error' && <AlertCircle className="w-4 h-4" />}
              <span>
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'saved' && 'Saved'}
                {saveStatus === 'error' && 'Save failed'}
              </span>
            </div>
          )}
          
          <button
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Content'}</span>
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
          <h4 className="text-blue-200 font-medium mb-2">Uploading Files...</h4>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="bg-blue-800 rounded-full h-2 mb-2">
              <div
                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      {renderTabs()}

      {/* Content */}
      <div>
        {activeTab === 'instructions' && renderInstructionsTab()}
        {activeTab === 'audio' && renderAudioTab()}
        {activeTab === 'visual' && renderVisualTab()}
        {activeTab === 'equipment' && renderEquipmentTab()}
        {activeTab === 'benefits' && renderBenefitsTab()}
        {activeTab === 'safety' && renderSafetyTab()}
      </div>
    </div>
  );
};