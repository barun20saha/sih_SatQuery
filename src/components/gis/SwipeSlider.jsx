import React, { useState, useEffect, useRef } from 'react';

export default function SwipeSlider({
  leftImage,
  rightImage,
  leftLabel = "Pre-Event / Raw",
  rightLabel = "Post-Event / Grounded",
  height = "400px"
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container width dynamically to keep clipped image locked in place without squishing
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Helper to safely resolve URLs, Base64 strings, or Blob/File objects cleanly
  const useResolvedSrc = (img, fallback) => {
    const [src, setSrc] = useState(fallback);

    useEffect(() => {
      if (!img) {
        setSrc(fallback);
        return;
      }

      if (typeof img === 'string') {
        // Fallback if the string points directly to an unrenderable .tif file
        const lowerImg = img.toLowerCase();
        if (lowerImg.endsWith('.tif') || lowerImg.endsWith('.tiff') || lowerImg.includes('geotiff')) {
          setSrc(fallback);
          return;
        }
        setSrc(img);
        return;
      }

      if (img instanceof File || img instanceof Blob) {
        // Fallback for GeoTIFF file objects
        if (img.name && (img.name.toLowerCase().endsWith('.tif') || img.name.toLowerCase().endsWith('.tiff'))) {
          setSrc(fallback);
          return;
        }
        const objectUrl = URL.createObjectURL(img);
        setSrc(objectUrl);
        return () => URL.revokeObjectURL(objectUrl); // Clean up memory leak
      }

      setSrc(fallback);
    }, [img, fallback]);

    return src;
  };

  const img1 = useResolvedSrc(
    leftImage,
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800"
  );
  const img2 = useResolvedSrc(
    rightImage,
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #334155',
        backgroundColor: '#0f172a',
        userSelect: 'none',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Background Image Layer (Right / Post-Event / Processing) */}
      <img
        src={img2}
        alt={rightLabel}
        onError={(e) => {
          // Automatic browser render error fallback
          e.target.src = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800";
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      
      {/* Right Label Badge */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          background: 'rgba(15, 23, 42, 0.85)',
          color: '#38bdf8',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 700,
          border: '1px solid rgba(56, 189, 248, 0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 2
        }}
      >
        {rightLabel}
      </div>

      {/* Foreground Clipped Image Layer (Left / Pre-Event / Raw) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${sliderPos}%`,
          overflow: 'hidden',
          zIndex: 3
        }}
      >
        <img
          src={img1}
          alt={leftLabel}
          onError={(e) => {
            // Automatic browser render error fallback
            e.target.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800";
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            // Lock inner image width to parent container width so dragging clips instead of squishing
            width: containerWidth ? `${containerWidth}px` : '100%',
            maxWidth: 'none',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        
        {/* Left Label Badge */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#f43f5e',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            border: '1px solid rgba(244, 63, 94, 0.3)',
            backdropFilter: 'blur(4px)',
            whiteSpace: 'nowrap'
          }}
        >
          {leftLabel}
        </div>
      </div>

      {/* Interactive Transparent Drag Handle Input Overlay */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'ew-resize',
          zIndex: 10
        }}
      />

      {/* Center Divider Visual Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `calc(${sliderPos}% - 1px)`,
          width: '2px',
          backgroundColor: '#ffffff',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          zIndex: 4,
          pointerEvents: 'none'
        }}
      >
        {/* Drag Knob Circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '2px solid #0f172a',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          ↔
        </div>
      </div>
    </div>
  );
}