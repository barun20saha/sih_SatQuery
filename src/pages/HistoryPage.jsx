import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  SearchIcon,
  DownloadIcon,
  EyeIcon,
  ZapIcon,
  RotateCcwIcon,
} from '../components/common/Icons';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { history, loadHistoryItem } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);

  // Multi-faceted filtering
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesQuery = item.query?.toLowerCase().includes(q);
        const matchesModality = item.modality?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesQuery && !matchesModality) return false;
      }

      // Task Type
      if (selectedType !== 'all') {
        if (item.taskType?.toLowerCase() !== selectedType.toLowerCase()) return false;
      }

      // Status
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'high' && item.confidence < 0.8) return false;
        if (selectedStatus === 'med' && (item.confidence >= 0.8 || item.confidence < 0.6)) return false;
      }

      // Date
      if (selectedDate !== 'all') {
        if (selectedDate === 'today' && !item.timestamp?.toLowerCase().includes('hour') && !item.timestamp?.toLowerCase().includes('just')) return false;
      }

      return true;
    });
  }, [history, searchQuery, selectedType, selectedStatus, selectedDate]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedDate('all');
  };

  const handleInspect = (item) => {
    loadHistoryItem(item);
    navigate('/results');
  };

  const handleReanalyze = () => {
    navigate('/workspace');
  };

  const handleExportItem = () => {
    window.print();
  };

  return (
    <div className="history-page fade-in">
      <div className="history-header">
        <div>
          <h1 className="history-title">Analysis History</h1>
          <p className="history-subtitle">
            Archive of executed multimodal queries, grounding visual evidence, and verified geospatial results.
          </p>
        </div>
      </div>

      {/* ── Filters Bar (Section 2 Wireframe: [Search] [Date] [Type] [Status] [Clear Filters]) ── */}
      <div className="history-filters-card card">
        <div className="filters-grid">
          {/* Search */}
          <div className="filter-input-wrap">
            <SearchIcon size={16} className="filter-search-icon" />
            <input
              type="text"
              className="input filter-search-input"
              placeholder="Search by query, keywords, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <div className="filter-select-wrap">
            <select
              className="select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter by task type"
            >
              <option value="all">Task Type: All</option>
              <option value="VQA">VQA (Visual QA)</option>
              <option value="Captioning">Captioning</option>
              <option value="Grounding">Grounding</option>
              <option value="Bi-temporal">Bi-temporal Change</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-select-wrap">
            <select
              className="select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by confidence status"
            >
              <option value="all">Status: All</option>
              <option value="high">High Confidence (&gt; 80%)</option>
              <option value="med">Medium Confidence (60-80%)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="filter-select-wrap">
            <select
              className="select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Filter by date"
            >
              <option value="all">Date: All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div>
            <Button
              variant="secondary"
              size="md"
              onClick={handleClearFilters}
              icon={<RotateCcwIcon size={14} />}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* ── History Cards Grid (Section 3 History Card) ── */}
      <div className="history-list-section">
        {filteredHistory.length === 0 ? (
          <div className="history-empty card">
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>🔍</span>
            <h3 style={{ marginBottom: '6px' }}>No matching analyses found</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              Try adjusting your query or clearing filters.
            </p>
            <Button variant="secondary" size="sm" onClick={handleClearFilters} style={{ marginTop: '16px' }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="history-cards-column">
            {filteredHistory.slice(0, visibleCount).map((item) => {
              const isHigh = item.confidence >= 0.8;
              return (
                <div key={item.id} className="history-card-item card card--lift">
                  {/* Thumbnail (100x100) */}
                  <div className="history-card-thumb-wrap">
                    <img src={item.thumbnail} alt={item.title} className="history-card-thumb-img" />
                  </div>

                  {/* Body */}
                  <div className="history-card-body">
                    <div className="history-card-header-row">
                      <h3 className="history-card-title">{item.title}</h3>
                      <span className="history-card-timestamp">{item.timestamp}</span>
                    </div>

                    <div className="history-card-badges-row">
                      <Badge variant="task">{item.taskType}</Badge>
                      <Badge variant={isHigh ? 'success' : 'warning'}>
                        {isHigh ? '✓ Complete' : '⚠ Low Confidence'} ({Math.round(item.confidence * 100)}%)
                      </Badge>
                      <span className="history-card-modality-text">
                        Modality: {item.modality}
                      </span>
                    </div>

                    <p className="history-card-query-text">
                      "{item.query}"
                    </p>

                    {/* Section 3 Action Buttons: [View] [Reanalyze] [Export] */}
                    <div className="history-card-actions-row">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleInspect(item)}
                        icon={<EyeIcon size={14} />}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReanalyze(item)}
                        icon={<ZapIcon size={14} />}
                      >
                        Reanalyze
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportItem(item)}
                        icon={<DownloadIcon size={14} />}
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {filteredHistory.length > visibleCount && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setVisibleCount((prev) => prev + 4)}
            >
              Load More ({filteredHistory.length - visibleCount} remaining)...
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
