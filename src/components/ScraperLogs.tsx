'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  X, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Calendar,
  Newspaper,
  Building
} from 'lucide-react';

interface ScraperLog {
  _id: string;
  type: 'news' | 'events' | 'businesses';
  status: 'started' | 'completed' | 'error';
  message: string;
  createdAt: string;
  duration?: number;
  itemsProcessed?: number;
  errorMessages?: string[]; // Renamed from 'errors' to match Mongoose schema
}

interface ScraperLogsProps {
  type: 'news' | 'events' | 'businesses';
  isOpen: boolean;
  onClose: () => void;
}

const ScraperLogs = ({ type, isOpen, onClose }: ScraperLogsProps) => {
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/scraper-logs?type=${type}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/scraper-logs?type=${type}`);
        const data = await response.json();
        
        if (data.success) {
          setLogs(data.logs);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, type]);

  const getScraperIcon = (scraperType: string) => {
    switch (scraperType) {
      case 'news': return <Newspaper className="h-4 w-4" />;
      case 'events': return <Calendar className="h-4 w-4" />;
      case 'businesses': return <Building className="h-4 w-4" />;
      default: return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'started': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'started':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            {getScraperIcon(type)}
            <h2 className="text-xl font-semibold text-gray-900 ml-2 capitalize">
              {type} Scraper Logs
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={refreshLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
              <p className="text-gray-600">No scraper activity recorded for {type} scraper.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <Card key={log._id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getStatusIcon(log.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(log.status)}
                            <span className="text-sm text-gray-500">
                              {formatTimestamp(log.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {log.duration && (
                              <span>Duration: {formatDuration(log.duration)}</span>
                            )}
                            {log.itemsProcessed && (
                              <span>Items: {log.itemsProcessed}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-900 mb-2">{log.message}</p>
                        {log.errorMessages && log.errorMessages.length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                            <ul className="text-sm text-red-700 list-disc list-inside">
                              {log.errorMessages.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScraperLogs;
