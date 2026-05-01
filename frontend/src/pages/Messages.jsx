import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import { connectSocket, getSocket } from "../socket";

// ── Image Utilities ──────────────────────────────────────────
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality,
        );
      };
    };
  });
}

function FullImageModal({ gallery, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(gallery?.index || 0);

  // Sync state if gallery prop changes while open
  useEffect(() => {
    if (gallery) setCurrentIndex(gallery.index || 0);
  }, [gallery]);

  // Keyboard navigation
  useEffect(() => {
    if (!gallery) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev(e);
      if (e.key === "ArrowRight") handleNext(e);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gallery, currentIndex]);

  if (!gallery || !gallery.images || gallery.images.length === 0) return null;

  const images = gallery.images;
  const currentSrc = images[currentIndex];
  const hasMultiple = images.length > 1;

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem",
        cursor: "zoom-out",
        animation: "cdFadeIn 0.2s ease-out",
      }}
    >
      <style>{`
        @keyframes imgPop {
          from { opacity: 0; transform: scale(0.85) translateY(15px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
          z-index: 20;
        }
        .nav-button:hover {
          background: rgba(255,255,255,0.25);
          transform: translateY(-50%) scale(1.1);
        }
      `}</style>
      
      {hasMultiple && (
        <button onClick={handlePrev} className="nav-button" style={{ left: "2rem" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      <div
        style={{
          position: "relative",
          animation: "imgPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
          maxWidth: "85vw",
          maxHeight: "85vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
          borderRadius: "16px",
        }}
      >
        <img
          key={currentSrc} // forces re-animation on change
          src={currentSrc}
          alt="Full size gallery"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          style={{
            maxWidth: "100%",
            maxHeight: "85vh",
            borderRadius: "16px",
            objectFit: "contain",
            display: "block",
            border: "2px solid rgba(255,255,255,0.15)",
            cursor: "default",
          }}
        />
        
        {hasMultiple && (
          <div style={{
            position: "absolute",
            bottom: "-2.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.8)",
            fontSize: "0.9rem",
            fontWeight: "600",
            background: "rgba(0,0,0,0.5)",
            padding: "0.4rem 1rem",
            borderRadius: "20px",
            backdropFilter: "blur(4px)",
          }}>
            {currentIndex + 1} / {images.length}
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            position: "absolute",
            top: "-1rem",
            right: "-1rem",
            background: "var(--bg-surface, #1e1e1e)",
            border: "1px solid var(--border-hover, #444)",
            color: "var(--text-primary, #fff)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
            zIndex: 10,
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {hasMultiple && (
        <button onClick={handleNext} className="nav-button" style={{ right: "2rem" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>,
    document.body,
  );
}

function ImagePreviewEditor({ files, onSend, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [tool, setTool] = useState(null);
  const [isHD, setIsHD] = useState(false);

  // Draw
  const [drawings, setDrawings] = useState({});
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(4);

  // Text
  const [textItems, setTextItems] = useState({});
  const [textInput, setTextInput] = useState("");
  const [isTypingText, setIsTypingText] = useState(false);

  // Crop (% of image wrapper)
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const cropDrag = useRef(null);

  const canvasRef     = useRef(null);
  const imgRef        = useRef(null);
  const imgWrapRef    = useRef(null);
  const isDrawing     = useRef(false);
  const lastPos       = useRef(null);
  const currentStroke = useRef([]);
  const textDrag      = useRef(null);

  const current = files[currentIndex];
  const isImage = current?.type === "image";

  const colors = ["#ffffff","#000000","#ff3b30","#ff9500","#ffcc00","#34c759","#007aff","#af52de","#ff2d55"];

  // ── Canvas helpers ───────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    (drawings[currentIndex] || []).forEach(stroke => {
      if (!stroke.length) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke[0].color;
      ctx.lineWidth   = stroke[0].size;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    });
  }, [drawings, currentIndex]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  useEffect(() => {
    const img    = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !isImage) return;
    const sync = () => {
      canvas.width  = img.offsetWidth;
      canvas.height = img.offsetHeight;
      redrawCanvas();
    };
    img.addEventListener("load", sync);
    if (img.complete) sync();
    return () => img.removeEventListener("load", sync);
  }, [currentIndex, isImage, redrawCanvas]);

  const getPos = (e, el) => {
    const rect = el.getBoundingClientRect();
    const cx   = e.touches ? e.touches[0].clientX : e.clientX;
    const cy   = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const startDraw = (e) => {
    if (tool !== "draw") return;
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e, canvasRef.current);
    lastPos.current = pos;
    currentStroke.current = [{ ...pos, color: currentColor, size: brushSize }];
  };
  const draw = (e) => {
    if (!isDrawing.current || tool !== "draw") return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);
    ctx.beginPath(); ctx.strokeStyle = currentColor; ctx.lineWidth = brushSize;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPos.current = pos;
    currentStroke.current.push({ ...pos, color: currentColor, size: brushSize });
  };
  const endDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentStroke.current.length > 0)
      setDrawings(prev => ({ ...prev, [currentIndex]: [...(prev[currentIndex] || []), currentStroke.current] }));
    currentStroke.current = [];
  };
  const undoStroke = () => setDrawings(prev => ({ ...prev, [currentIndex]: (prev[currentIndex] || []).slice(0, -1) }));

  // ── Text helpers ─────────────────────────────────────────────
  const confirmText = () => {
    if (!textInput.trim()) { setIsTypingText(false); setTextInput(""); return; }
    const id = Math.random().toString(36).slice(2);
    setTextItems(prev => ({
      ...prev,
      [currentIndex]: [...(prev[currentIndex] || []), { id, text: textInput, color: currentColor, x: 50, y: 40 }],
    }));
    setTextInput("");
    setIsTypingText(false);
  };

  // ── Text drag ────────────────────────────────────────────────
  const onTextPointerDown = (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    const wrap = imgWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const cx   = e.touches ? e.touches[0].clientX : e.clientX;
    const cy   = e.touches ? e.touches[0].clientY : e.clientY;
    textDrag.current = { id: item.id, startX: cx, startY: cy, startItemX: item.x, startItemY: item.y, rectW: rect.width, rectH: rect.height };
    const onMove = (ev) => {
      if (!textDrag.current) return;
      const mcx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const mcy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dx  = ((mcx - textDrag.current.startX) / textDrag.current.rectW) * 100;
      const dy  = ((mcy - textDrag.current.startY) / textDrag.current.rectH) * 100;
      const nx  = Math.max(0, Math.min(95, textDrag.current.startItemX + dx));
      const ny  = Math.max(0, Math.min(95, textDrag.current.startItemY + dy));
      setTextItems(prev => ({
        ...prev,
        [currentIndex]: (prev[currentIndex] || []).map(t =>
          t.id === textDrag.current.id ? { ...t, x: nx, y: ny } : t
        ),
      }));
    };
    const onUp = () => {
      textDrag.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  };

  // ── Crop helpers ──────────────────────────────────────────────
  const startCropDrag = (e, edge) => {
    e.stopPropagation();
    e.preventDefault();
    const wrap = imgWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const cx   = e.touches ? e.touches[0].clientX : e.clientX;
    const cy   = e.touches ? e.touches[0].clientY : e.clientY;
    cropDrag.current = { edge, startX: cx, startY: cy, startBox: { ...cropBox }, rectW: rect.width, rectH: rect.height };

    const onMove = (ev) => {
      if (!cropDrag.current) return;
      const mcx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const mcy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dpx = ((mcx - cropDrag.current.startX) / cropDrag.current.rectW) * 100;
      const dpy = ((mcy - cropDrag.current.startY) / cropDrag.current.rectH) * 100;
      const b   = cropDrag.current.startBox;
      const MIN = 8;
      setCropBox(() => {
        let { x, y, w, h } = b;
        switch (cropDrag.current.edge) {
          case "move": x = Math.max(0,Math.min(100-b.w,b.x+dpx)); y = Math.max(0,Math.min(100-b.h,b.y+dpy)); break;
          case "e":    w = Math.max(MIN,Math.min(100-b.x,b.w+dpx)); break;
          case "w": { const nx=Math.max(0,Math.min(b.x+b.w-MIN,b.x+dpx)); w=b.w-(nx-b.x); x=nx; break; }
          case "s":    h = Math.max(MIN,Math.min(100-b.y,b.h+dpy)); break;
          case "n": { const ny=Math.max(0,Math.min(b.y+b.h-MIN,b.y+dpy)); h=b.h-(ny-b.y); y=ny; break; }
          case "se":   w=Math.max(MIN,Math.min(100-b.x,b.w+dpx)); h=Math.max(MIN,Math.min(100-b.y,b.h+dpy)); break;
          case "sw": { const nx2=Math.max(0,Math.min(b.x+b.w-MIN,b.x+dpx)); w=b.w-(nx2-b.x); x=nx2; h=Math.max(MIN,Math.min(100-b.y,b.h+dpy)); break; }
          case "ne": { const ny2=Math.max(0,Math.min(b.y+b.h-MIN,b.y+dpy)); h=b.h-(ny2-b.y); y=ny2; w=Math.max(MIN,Math.min(100-b.x,b.w+dpx)); break; }
          case "nw": { const nx3=Math.max(0,Math.min(b.x+b.w-MIN,b.x+dpx)); const ny3=Math.max(0,Math.min(b.y+b.h-MIN,b.y+dpy)); w=b.w-(nx3-b.x); x=nx3; h=b.h-(ny3-b.y); y=ny3; break; }
          default: break;
        }
        return { x, y, w, h };
      });
    };
    const onUp = () => {
      cropDrag.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend",  onUp);
  };

  // ── compositeImage: flatten edits → new File ─────────────────
  // Draws base image, then strokes from the draw canvas, then text overlays.
  // If crop tool was used (or cropBox moved from default) the output is cropped.
  const compositeImage = useCallback(async (fileObj, idx) => {
    if (fileObj.type !== "image") return fileObj;

    const img = new Image();
    img.src = fileObj.preview;
    await new Promise((res) => {
      if (img.complete) { res(); return; }
      img.onload = res;
    });

    const iW = img.naturalWidth;
    const iH = img.naturalHeight;

    // Only apply crop when the tool was explicitly used for this file
    const cb = cropBox;
    const hasCrop = idx === currentIndex && tool === "crop";
    const cropX = hasCrop ? Math.round((cb.x / 100) * iW) : 0;
    const cropY = hasCrop ? Math.round((cb.y / 100) * iH) : 0;
    const cropW = hasCrop ? Math.round((cb.w / 100) * iW) : iW;
    const cropH = hasCrop ? Math.round((cb.h / 100) * iH) : iH;

    const outW = cropW;
    const outH = cropH;

    const canvas = document.createElement("canvas");
    canvas.width  = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");

    // Draw (cropped) base image
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

    // Overlay drawings — map from display-canvas coords to natural-px coords
    const drawCanvas = canvasRef.current;
    const strokes = drawings[idx] || [];
    if (drawCanvas && strokes.length > 0) {
      const dispW = drawCanvas.width  || 1;
      const dispH = drawCanvas.height || 1;
      const scaleX = iW / dispW;
      const scaleY = iH / dispH;

      strokes.forEach(stroke => {
        if (!stroke.length) return;
        ctx.beginPath();
        ctx.strokeStyle = stroke[0].color;
        ctx.lineWidth   = stroke[0].size * Math.max(scaleX, scaleY);
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        // Offset for crop
        const ox = cropX;
        const oy = cropY;
        ctx.moveTo(stroke[0].x * scaleX - ox, stroke[0].y * scaleY - oy);
        stroke.forEach(pt => ctx.lineTo(pt.x * scaleX - ox, pt.y * scaleY - oy));
        ctx.stroke();
      });
    }

    // Overlay text items
    (textItems[idx] || []).forEach(t => {
      const fontSize = Math.max(24, Math.round(iW * 0.045));
      ctx.font      = `900 ${fontSize}px sans-serif`;
      ctx.fillStyle = t.color;
      ctx.textAlign = "left";
      // t.x / t.y are % of the wrapper → map to natural px, offset by crop
      const tx = (t.x / 100) * iW - cropX;
      const ty = (t.y / 100) * iH - cropY;
      ctx.shadowColor   = "rgba(0,0,0,0.85)";
      ctx.shadowBlur    = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(t.text, tx, ty + fontSize);
      ctx.shadowColor = "transparent";
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const newFile = new File([blob], fileObj.name || "image.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        resolve({ ...fileObj, file: newFile, preview: URL.createObjectURL(newFile) });
      }, "image/jpeg", isHD ? 0.95 : 0.82);
    });
  }, [cropBox, currentIndex, tool, drawings, textItems, isHD]);

  // ── Send — composite first, then pass to parent ───────────────
  const handleSend = async () => {
    const composited = await Promise.all(files.map((f, i) => compositeImage(f, i)));
    onSend({ files: composited, caption });
  };

  if (!current) return null;

  const handleStyle = (cursor, style = {}) => ({
    position: "absolute", width: "18px", height: "18px",
    background: "white", border: "2px solid rgba(0,0,0,0.3)", borderRadius: "3px",
    cursor, zIndex: 10, transform: "translate(-50%,-50%)", ...style,
  });
  const edgeStyle = (cursor, style = {}) => ({
    position: "absolute", background: "white", cursor, zIndex: 9, borderRadius: "4px", ...style,
  });

  return createPortal(
    <div style={{ position:"fixed",inset:0,zIndex:999999,background:"#000",display:"flex",flexDirection:"column",fontFamily:"inherit" }}>
      <style>{`
        .ipb{width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,0.13);color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.18s;backdrop-filter:blur(8px);flex-shrink:0}
        .ipb:hover{background:rgba(255,255,255,0.23)}
        .ipb.on{background:rgba(255,255,255,0.9);color:#000}
        .ipdot{width:24px;height:24px;border-radius:50%;cursor:pointer;border:2.5px solid transparent;transition:transform 0.15s,border-color 0.15s;flex-shrink:0}
        .ipdot.on{border-color:white;transform:scale(1.2)}
        .ipthumb{width:52px;height:52px;border-radius:8px;object-fit:cover;cursor:pointer;border:2px solid transparent;transition:border-color 0.15s,opacity 0.15s;opacity:0.6}
        .ipthumb.on{border-color:white;opacity:1}
        @keyframes ipFade{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1rem",background:"linear-gradient(to bottom,rgba(0,0,0,0.75),transparent)",position:"absolute",top:0,left:0,right:0,zIndex:20 }}>
        <button onClick={onClose} className="ipb">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
          <button onClick={() => setIsHD(h => !h)} className={`ipb${isHD?" on":""}`}
            style={{ width:"auto", borderRadius:"20px", padding:"0 12px", fontSize:"0.72rem", fontWeight:"800", letterSpacing:"0.5px" }}>HD</button>

          <button onClick={() => setTool(t => t==="crop" ? null : "crop")} className={`ipb${tool==="crop"?" on":""}`} title="Crop">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="6 2 6 6 2 6"/><polyline points="18 22 18 18 22 18"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
          </button>

          <button onClick={() => { setTool(t => t==="text" ? null : "text"); setIsTypingText(true); }} className={`ipb${tool==="text"?" on":""}`} title="Text">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
          </button>

          <button onClick={() => setTool(t => t==="draw" ? null : "draw")} className={`ipb${tool==="draw"?" on":""}`} title="Draw">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>
          </button>
        </div>
      </div>

      {/* ── Image area ── */}
      <div ref={imgWrapRef} style={{ flex:1, position:"relative", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        {isImage ? (
          <>
            <img ref={imgRef} src={current.preview} alt="Preview"
              style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", display:"block", userSelect:"none", pointerEvents:"none", animation:"ipFade 0.25s ease" }}/>

            <canvas ref={canvasRef}
              style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", cursor:tool==="draw"?"crosshair":"default", touchAction:"none", pointerEvents:tool==="draw"?"auto":"none" }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>

            {(textItems[currentIndex] || []).map(t => (
              <div key={t.id}
                onMouseDown={e => onTextPointerDown(e, t)}
                onTouchStart={e => onTextPointerDown(e, t)}
                style={{ position:"absolute", left:`${t.x}%`, top:`${t.y}%`, color:t.color, fontWeight:"800", fontSize:"1.6rem", textShadow:"0 2px 8px rgba(0,0,0,0.9)", cursor:"grab", userSelect:"none", whiteSpace:"pre", textAlign:"center", padding:"4px 8px", letterSpacing:"0.5px", zIndex:12, touchAction:"none" }}
                title="Drag to move · Double-click to remove"
                onDoubleClick={() => setTextItems(prev => ({ ...prev, [currentIndex]: (prev[currentIndex]||[]).filter(x => x.id !== t.id) }))}
              >{t.text}</div>
            ))}

            {tool === "text" && isTypingText && (
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:15 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.75rem", width:"90%", maxWidth:"420px" }}>
                  <input autoFocus value={textInput} onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => { if (e.key==="Enter") confirmText(); if (e.key==="Escape") { setIsTypingText(false); setTextInput(""); } }}
                    placeholder="Type text…"
                    style={{ width:"100%", boxSizing:"border-box", background:"rgba(0,0,0,0.55)", border:"none", borderBottom:`2px solid ${currentColor}`, outline:"none", color:currentColor, fontWeight:"700", fontSize:"1.5rem", textAlign:"center", padding:"0.6rem 1rem", fontFamily:"inherit", backdropFilter:"blur(8px)", caretColor:currentColor }}/>
                  <div style={{ display:"flex", gap:"0.75rem" }}>
                    <button onClick={() => { setIsTypingText(false); setTextInput(""); }} className="ipb" style={{ background:"rgba(255,255,255,0.15)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    <button onClick={confirmText} style={{ padding:"0 1.5rem", height:"44px", borderRadius:"22px", border:"none", background:currentColor, color:currentColor==="#ffffff"?"#000":"#fff", fontWeight:"700", fontSize:"0.9rem", cursor:"pointer" }}>Done</button>
                  </div>
                </div>
              </div>
            )}

            {tool === "crop" && (
              <div style={{ position:"absolute", inset:0, zIndex:10, pointerEvents:"all" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:`${cropBox.y}%`, background:"rgba(0,0,0,0.55)", pointerEvents:"none" }}/>
                <div style={{ position:"absolute", bottom:0, left:0, right:0, height:`${100-cropBox.y-cropBox.h}%`, background:"rgba(0,0,0,0.55)", pointerEvents:"none" }}/>
                <div style={{ position:"absolute", top:`${cropBox.y}%`, left:0, width:`${cropBox.x}%`, height:`${cropBox.h}%`, background:"rgba(0,0,0,0.55)", pointerEvents:"none" }}/>
                <div style={{ position:"absolute", top:`${cropBox.y}%`, right:0, width:`${100-cropBox.x-cropBox.w}%`, height:`${cropBox.h}%`, background:"rgba(0,0,0,0.55)", pointerEvents:"none" }}/>

                <div onMouseDown={e => startCropDrag(e,"move")} onTouchStart={e => startCropDrag(e,"move")}
                  style={{ position:"absolute", left:`${cropBox.x}%`, top:`${cropBox.y}%`, width:`${cropBox.w}%`, height:`${cropBox.h}%`, border:"1.5px solid white", boxSizing:"border-box", cursor:"move" }}>
                  <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
                    {[33.3,66.6].map(p => <div key={p} style={{ position:"absolute", left:0, right:0, top:`${p}%`, height:"0.5px", background:"rgba(255,255,255,0.35)" }}/>)}
                    {[33.3,66.6].map(p => <div key={p} style={{ position:"absolute", top:0, bottom:0, left:`${p}%`, width:"0.5px", background:"rgba(255,255,255,0.35)" }}/>)}
                  </div>
                  <div onMouseDown={e=>startCropDrag(e,"nw")} onTouchStart={e=>startCropDrag(e,"nw")} style={handleStyle("nw-resize",{top:0,left:0})}/>
                  <div onMouseDown={e=>startCropDrag(e,"ne")} onTouchStart={e=>startCropDrag(e,"ne")} style={handleStyle("ne-resize",{top:0,left:"100%"})}/>
                  <div onMouseDown={e=>startCropDrag(e,"sw")} onTouchStart={e=>startCropDrag(e,"sw")} style={handleStyle("sw-resize",{top:"100%",left:0})}/>
                  <div onMouseDown={e=>startCropDrag(e,"se")} onTouchStart={e=>startCropDrag(e,"se")} style={handleStyle("se-resize",{top:"100%",left:"100%"})}/>
                  <div onMouseDown={e=>startCropDrag(e,"n")} onTouchStart={e=>startCropDrag(e,"n")} style={edgeStyle("n-resize",{top:"-4px",left:"calc(50% - 18px)",width:"36px",height:"8px"})}/>
                  <div onMouseDown={e=>startCropDrag(e,"s")} onTouchStart={e=>startCropDrag(e,"s")} style={edgeStyle("s-resize",{bottom:"-4px",left:"calc(50% - 18px)",width:"36px",height:"8px"})}/>
                  <div onMouseDown={e=>startCropDrag(e,"w")} onTouchStart={e=>startCropDrag(e,"w")} style={edgeStyle("w-resize",{left:"-4px",top:"calc(50% - 18px)",width:"8px",height:"36px"})}/>
                  <div onMouseDown={e=>startCropDrag(e,"e")} onTouchStart={e=>startCropDrag(e,"e")} style={edgeStyle("e-resize",{right:"-4px",top:"calc(50% - 18px)",width:"8px",height:"36px"})}/>
                </div>
                <button onClick={() => setTool(null)}
                  style={{ position:"absolute", bottom:"1rem", left:"50%", transform:"translateX(-50%)", padding:"0.5rem 2rem", borderRadius:"20px", border:"none", background:"white", color:"#000", fontWeight:"700", cursor:"pointer", zIndex:20, fontSize:"0.9rem" }}>Done</button>
              </div>
            )}
          </>
        ) : (
          <div style={{ color:"white", textAlign:"center", padding:"2rem" }}>
            <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>📄</div>
            <div style={{ fontWeight:"600", fontSize:"0.95rem", wordBreak:"break-all" }}>{current.name}</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.82rem", marginTop:"0.4rem" }}>{(current.size/1024).toFixed(1)} KB</div>
          </div>
        )}
      </div>

      {/* ── Color + undo bar ── */}
      {(tool === "draw" || tool === "text") && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.45rem", padding:"0.55rem 1rem", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(12px)" }}>
          {tool === "draw" && (
            <>
              <button onClick={undoStroke} className="ipb" style={{ marginRight:"0.25rem" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
              </button>
              <input type="range" min="2" max="20" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))}
                style={{ width:"70px", accentColor:currentColor, marginRight:"0.25rem" }}/>
            </>
          )}
          {colors.map(c => (
            <div key={c} className={`ipdot${currentColor===c?" on":""}`}
              style={{ background:c, boxShadow:c==="#ffffff"?"inset 0 0 0 1px rgba(0,0,0,0.3)":"none" }}
              onClick={() => setCurrentColor(c)}/>
          ))}
        </div>
      )}

      {/* ── Bottom: thumbnails + caption (no emoji) + send ── */}
      <div style={{ background:"linear-gradient(to top,rgba(0,0,0,0.9),transparent)", padding:"0.5rem 1rem 1rem" }}>
        {files.length > 1 && (
          <div style={{ display:"flex", gap:"0.4rem", overflowX:"auto", padding:"0 0 0.6rem", scrollbarWidth:"none" }}>
            {files.map((f, i) => (
              f.type === "image"
                ? <img key={f.id} src={f.preview} className={`ipthumb${i===currentIndex?" on":""}`} onClick={() => setCurrentIndex(i)} alt=""/>
                : <div key={f.id} onClick={() => setCurrentIndex(i)} className={`ipthumb${i===currentIndex?" on":""}`}
                    style={{ background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem" }}>📄</div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ display:"flex", alignItems:"center", width:"min(480px, 90%)", background:"rgba(255,255,255,0.08)", borderRadius:"24px", padding:"0.4rem 0.6rem 0.4rem 1rem", border:"1px solid rgba(255,255,255,0.18)" }}>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              placeholder="Add a caption…"
              style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"white", fontSize:"0.88rem", fontFamily:"inherit" }}
            />
            <button
              onClick={handleSend}
              style={{ width:"38px", height:"38px", borderRadius:"50%", border:"none", background:"linear-gradient(135deg,var(--accent,#e87722),var(--accent-alt,#d06010))", color:"white", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(232,119,34,0.4)", transition:"transform 0.15s", marginLeft:"4px" }}
              onMouseEnter={e => e.currentTarget.style.transform="scale(1.08)"}
              onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform:"translateX(1px)" }}>
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── ImageGrid — WhatsApp-style grouped images ─────────────
function ImageGrid({ group, isMe, onZoom }) {
  const messages = group.messages;
  const count = messages.length;
  const images = messages.map(m => m.imageUrl || m.preview);

  const outerRadius = isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px";

  // The grid background IS the separator line.
  // gap: 2px means 2px of the container bg bleeds between cells.
  // overflow: hidden clips everything to the rounded container — no padding needed.
  let gridTemplate = "1fr 1fr / 1fr 1fr";
  if (count === 2) gridTemplate = "1fr / 1fr 1fr";
  if (count === 3) gridTemplate = '"a b" "a c" / 1.2fr 1fr';

  return (
    <div style={{
      display: "grid",
      gridTemplate,
      gap: "3px",
      borderRadius: outerRadius,
      overflow: "hidden",
      width: "280px",
      height: "280px",
      cursor: "pointer",
      // --bg-base is the page background: #0a0a0a dark / #fff light — always visible against images
      background: "var(--bg-base)",
    }}>
      {messages.slice(0, 4).map((msg, i) => {
        const src = msg.imageUrl || msg.preview;
        const isExtra = count > 4 && i === 3;

        return (
          <div
            key={msg.id}
            onClick={() => onZoom(images, i)}
            style={{
              position: "relative",
              gridArea: count === 3 && i === 0 ? "a" : "auto",
              overflow: "hidden",
            }}
          >
            <img
              src={src}
              alt="Grouped"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.35s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            />
            {isExtra && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.5rem",
                fontWeight: "700",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}>
                +{count - 3}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── FileBubble — WhatsApp-style attachment rendering ─────────
function FileBubble({ msg, isMe, onZoom }) {
  const fileType = msg.fileType || (msg.imageUrl && !msg.fileUrl ? "image" : null);
  const isImage = fileType === "image" || (!fileType && msg.imageUrl && !msg.fileUrl);
  const isVideo = fileType === "video";
  const isDoc   = fileType === "pdf" || fileType === "file" || fileType === "document" ||
                  (!isImage && !isVideo && (msg.fileUrl || msg.fileName));

  const imgSrc = msg.imageUrl || msg.preview || null;
  const fileSrc = msg.fileUrl || msg.preview || null;

  if (isImage) {
    if (!imgSrc) return null;
    return (
      <img
        src={imgSrc}
        alt="Sent photo"
        onClick={() => onZoom(imgSrc)}
        style={{
          width: "100%",
          maxWidth: msg.content ? "100%" : "240px",
          height: msg.content ? "auto" : "180px",
          maxHeight: "320px",
          borderRadius: msg.content ? "12px" : "14px",
          marginBottom: msg.content ? "0.6rem" : "0",
          display: "block",
          objectFit: "cover",
          cursor: "zoom-in",
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
      />
    );
  }

  if (isVideo) {
    if (!fileSrc) return null;
    return (
      <video
        src={fileSrc}
        controls
        style={{
          width: "100%",
          maxWidth: "280px",
          borderRadius: "14px",
          display: "block",
          marginBottom: msg.content ? "0.6rem" : "0",
          background: "#000",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      />
    );
  }

  if (isDoc) {
    const name     = msg.fileName || "Document";
    const ext      = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
    const isPdf    = ext === "pdf"  || fileType === "pdf";
    const isWord   = ["doc","docx"].includes(ext);
    const isExcel  = ["xls","xlsx","csv"].includes(ext);
    const isPpt    = ["ppt","pptx"].includes(ext);
    const isZip    = ["zip","rar","7z"].includes(ext);

    // Color theme per file type
    const theme = isPdf   ? { accent:"#ef4444", bg:"#ef444418", badge:"PDF" }
                : isWord  ? { accent:"#3b82f6", bg:"#3b82f618", badge:"DOC" }
                : isExcel ? { accent:"#22c55e", bg:"#22c55e18", badge:"XLS" }
                : isPpt   ? { accent:"#f97316", bg:"#f9731618", badge:"PPT" }
                : isZip   ? { accent:"#a855f7", bg:"#a855f718", badge:"ZIP" }
                :           { accent:"#64748b", bg:"#64748b18", badge: (ext.toUpperCase().slice(0,4) || "FILE") };

    const sizeStr = msg.fileSize
      ? msg.fileSize > 1_000_000
        ? (msg.fileSize / 1_000_000).toFixed(1) + " MB"
        : Math.round(msg.fileSize / 1_000) + " KB"
      : "";

    const isUploading = !fileSrc;
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async (e) => {
      if (!fileSrc || isDownloading) return;
      e.preventDefault();
      e.stopPropagation();
      
      setIsDownloading(true);
      try {
        const response = await fetch(fileSrc);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = name; // Use the actual original filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Download failed:", err);
        window.open(fileSrc, "_blank");
      } finally {
        setIsDownloading(false);
      }
    };

    return (
      <div
        onClick={handleDownload}
        style={{ textDecoration: "none", display: "block", marginBottom: msg.content ? "0.5rem" : "0" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            padding: "0.65rem 0.8rem",
            // Use same radius as parent bubble for a perfect fit
            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            border: "1px solid var(--glass-border, rgba(0,0,0,0.1))",
            minWidth: "220px",
            maxWidth: "280px",
            cursor: fileSrc ? "pointer" : "default",
            transition: "all 0.2s ease",
            opacity: isUploading ? 0.7 : 1,
            // Removed shadow that looked like a partial line
          }}
          onMouseEnter={(e) => { 
            if (fileSrc) {
              e.currentTarget.style.background = "var(--bg-card-hover, rgba(0,0,0,0.05))";
              e.currentTarget.style.borderColor = "var(--accent-border, var(--accent))";
            }
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.background = isMe ? "var(--bg-card, rgba(0,0,0,0.03))" : "var(--bg-card, #1e1e2e)"; 
            e.currentTarget.style.borderColor = "var(--glass-border, rgba(0,0,0,0.1))";
          }}
        >
          {/* File type icon */}
          <div style={{
            width: "42px", height: "42px", flexShrink: 0, borderRadius: "10px",
            background: theme.bg, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "2px",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              {isPdf && <line x1="8" y1="13" x2="16" y2="13"/>}
              {isPdf && <line x1="8" y1="17" x2="12" y2="17"/>}
            </svg>
            <span style={{
              fontSize: "0.38rem", fontWeight: "900", color: theme.accent,
              letterSpacing: "0.6px", lineHeight: 1, textTransform: "uppercase",
            }}>{theme.badge}</span>
          </div>

          {/* File info */}
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <div style={{
              fontSize: "0.85rem", fontWeight: "600", lineHeight: 1.3,
              color: "var(--text-primary)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {name}
            </div>
            <div style={{
              fontSize: "0.68rem", marginTop: "0.2rem",
              color: "var(--text-secondary)",
              display: "flex", alignItems: "center", gap: "0.25rem",
            }}>
              {isUploading ? (
                <span style={{ fontStyle: "italic" }}>Uploading…</span>
              ) : (
                <>
                  {sizeStr && <span>{sizeStr}</span>}
                  {sizeStr && <span>·</span>}
                  <span>{theme.badge} Document</span>
                </>
              )}
            </div>
          </div>

          {/* Download button */}
          {fileSrc && (
            <div style={{
              width: "32px", height: "32px", flexShrink: 0, borderRadius: "50%",
              background: theme.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${theme.accent}20`,
              position: "relative"
            }}>
              {isDownloading ? (
                <div style={{
                  width: "14px", height: "14px", 
                  border: `2px solid ${theme.accent}`,
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "mspin 0.8s linear infinite"
                }} />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke={theme.accent}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ── Confirm Dialog ────────────────────────────────────────────
function ConfirmDialog({ open, onConfirm, onCancel, name }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        animation: "cdFadeIn 0.18s ease",
      }}
    >
      <style>{`
        @keyframes cdFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes cdSlideUp { from { opacity:0; transform:translateY(12px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
      <div
        style={{
          width: "380px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-hover)",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          animation: "cdSlideUp 0.22s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}
      >
        <div
          style={{
            height: "3px",
            background: "linear-gradient(90deg, #ff6b6b, #ff8787)",
          }}
        />

        <div style={{ padding: "1.75rem 1.75rem 1.5rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(255,107,107,0.10)",
              border: "1px solid rgba(255,107,107,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.1rem",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff6b6b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </div>

          <div
            style={{
              fontSize: "1rem",
              fontWeight: "800",
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
              marginBottom: "0.5rem",
            }}
          >
            Delete conversation?
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              lineHeight: "1.55",
            }}
          >
            Your conversation with{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
              {name}
            </span>{" "}
            will be permanently removed from your inbox. This cannot be undone.
          </div>
        </div>

        <div
          style={{
            height: "1px",
            background: "var(--border)",
            margin: "0 1.75rem",
          }}
        />

        <div
          style={{
            padding: "1.25rem 1.75rem",
            display: "flex",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "0.65rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-hover)",
              borderRadius: "10px",
              color: "var(--text-secondary)",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.18s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-card-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-card)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "0.65rem",
              background: "rgba(255,107,107,0.12)",
              border: "1px solid rgba(255,107,107,0.25)",
              borderRadius: "10px",
              color: "#ff6b6b",
              fontSize: "0.82rem",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.18s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,107,107,0.22)";
              e.currentTarget.style.borderColor = "rgba(255,107,107,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,107,107,0.12)";
              e.currentTarget.style.borderColor = "rgba(255,107,107,0.25)";
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ name, size = 36, orange = false, src = null }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (src && !imgFailed)
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flexShrink: 0,
          overflow: "hidden",
          border: orange ? "none" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: orange
            ? "0 4px 12px rgba(var(--accent-rgb),0.35)"
            : "none",
        }}
      >
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: orange
          ? "linear-gradient(135deg, var(--accent), var(--accent-alt))"
          : "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))",
        border: orange ? "none" : "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: "800",
        color: "white",
        letterSpacing: "-0.5px",
        boxShadow: orange ? "0 4px 12px rgba(var(--accent-rgb),0.35)" : "none",
      }}
    >
      {initials}
    </div>
  );
}

// ── Conversation Item ─────────────────────────────────────────
function ConversationItem({
  convo,
  isActive,
  isSelected,
  selectMode,
  onClick,
  onSelect,
  isTyping,
}) {
  const [hovered, setHovered] = useState(false);
  const hasUnread = convo.unread_count > 0;
  const isProfileChat = convo.item_id === null || convo.item_id === undefined;

  return (
    <div
      onClick={() => (selectMode ? onSelect(convo.conversation_id) : onClick())}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "0.75rem 1rem",
        borderRadius: "14px",
        cursor: "pointer",
        transition: "background 0.18s ease, border 0.18s ease",
        background: isSelected
          ? "rgba(var(--accent-rgb),0.14)"
          : isActive
            ? "var(--accent-soft)"
            : hovered
              ? "rgba(255,255,255,0.06)"
              : "transparent",
        border: isSelected
          ? "1px solid rgba(var(--accent-rgb),0.35)"
          : isActive
            ? "1px solid var(--accent-border)"
            : "1px solid transparent",
        marginBottom: "0.25rem",
        position: "relative",
        display: "flex",
        gap: "0.75rem",
        alignItems: "center",
        height: "64px",
        boxSizing: "border-box",
      }}
    >
      {hasUnread && !isActive && !selectMode && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "3px",
            height: "55%",
            borderRadius: "0 3px 3px 0",
            background:
              "linear-gradient(180deg, var(--accent), var(--accent-alt))",
          }}
        />
      )}
      {selectMode && (
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "6px",
            border: isSelected ? "none" : "1.5px solid var(--border-hover)",
            background: isSelected ? "var(--accent)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          {isSelected && (
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}
      <Avatar
        name={convo.other_user_name}
        size={38}
        orange={isActive && !selectMode}
        src={convo.other_user_avatar || null}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.88rem",
              fontWeight: hasUnread ? "800" : "600",
              color: isActive
                ? "var(--accent)"
                : hasUnread
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              letterSpacing: "-0.2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "130px",
            }}
          >
            {convo.other_user_name || "Unknown"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {/* Context Icon (Profile vs Item) */}
            <div
              style={{
                color: isActive ? "var(--accent)" : "var(--text-ghost)",
                display: "flex",
                alignItems: "center",
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {isProfileChat ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              )}
            </div>
            {hasUnread && !isActive && !selectMode && (
              <div
                style={{
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "9px",
                  padding: "0 5px",
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.58rem",
                  fontWeight: "800",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {convo.unread_count > 9 ? "9+" : convo.unread_count}
              </div>
            )}
          </div>
        </div>
        {isTyping ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              marginTop: "0.3rem",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#a8c4a2",
                  animation: "typingDot 1.1s ease-in-out infinite",
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            ))}
          </div>
        ) : convo.chat_request_status === "pending" &&
          convo.is_request_sender ? (
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--accent)",
              fontWeight: "600",
              marginTop: "0.2rem",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              opacity: 0.85,
            }}
          >
            <svg
              width="8"
              height="8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Waiting for acceptance
          </div>
        ) : (
          convo.last_message && (
            <div
              style={{
                fontSize: "0.72rem",
                color:
                  hasUnread && !isActive
                    ? "var(--text-secondary)"
                    : "var(--text-ghost)",
                fontWeight: hasUnread && !isActive ? "600" : "400",
                marginTop: "0.2rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {convo.last_message}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Item Card ─────────────────────────────────────────────────
function ItemCard({ convo, myId, onStatusChange }) {
  const navigate = useNavigate();
  const isSeller = convo.item_seller_id === myId;
  const status = convo.item_status?.toLowerCase() || "available";
  const [loading, setLoading] = useState(false);
  const [statusHovered, setStatusHovered] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [addHovered, setAddHovered] = useState(false);
  const [removeHovered, setRemoveHovered] = useState(false);
  const [cartCheckDone, setCartCheckDone] = useState(false);
  const [itemImage, setItemImage] = useState(convo.item_image || null);
  const [itemPrice, setItemPrice] = useState(convo.item_price ?? null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceVal, setPriceVal] = useState("");
  const [priceSaving, setPriceSaving] = useState(false);
  const priceInputRef = useRef(null);

  useEffect(() => {
    setItemImage(convo.item_image || null);
  }, [convo.item_id]);

  const isSold = status === "sold";
  const isPending = status === "pending";
  const isAvailable = status === "available";
  const showPendingHint = isSeller && isAvailable && statusHovered && !loading;
  const showAvailHint = isSeller && isPending && statusHovered && !loading;
  const statusColor = isSold ? "#ff6b6b" : isPending ? "#ffd43b" : "#51cf66";
  const statusBg = isSold
    ? "rgba(255,107,107,0.1)"
    : isPending
      ? "rgba(255,212,59,0.1)"
      : "rgba(81,207,102,0.1)";
  const statusLabel = isSold ? "Sold" : isPending ? "Pending" : "Available";
  const hoverColor = showPendingHint
    ? "#ffd43b"
    : showAvailHint
      ? "#51cf66"
      : statusColor;
  const hoverBg = showPendingHint
    ? "rgba(255,212,59,0.14)"
    : showAvailHint
      ? "rgba(81,207,102,0.14)"
      : statusBg;
  const hoverLabel = showPendingHint
    ? "Mark Pending"
    : showAvailHint
      ? "Mark Available"
      : statusLabel;

  useEffect(() => {
    if (!convo.item_id) return;
    API.get(`/items/${convo.item_id}`)
      .then((res) => {
        const imgs = res.data?.images;
        if (imgs?.length) setItemImage(imgs[0]);
        if (res.data?.price != null) setItemPrice(res.data.price);
      })
      .catch(() => {});
  }, [convo.item_id]); // eslint-disable-line

  useEffect(() => {
    if (isSeller || !convo.item_id || !isAvailable) return;
    setCartCheckDone(false);
    setInCart(false);
    setCartError("");
    API.get("/cart")
      .then((res) => {
        setInCart(
          (res.data || []).some(
            (ci) =>
              ci.itemId === convo.item_id || ci.item?.id === convo.item_id,
          ),
        );
      })
      .catch(() => {})
      .finally(() => setCartCheckDone(true));
  }, [convo.item_id, isSeller, status]); // eslint-disable-line

  async function handleAddToCart() {
    if (cartLoading || inCart) return;
    setCartError("");
    try {
      setCartLoading(true);
      await API.post("/cart", { itemId: convo.item_id, quantity: 1 });
      setInCart(true);
      const cartRes = await API.get("/cart");
      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: { count: cartRes.data.length },
        }),
      );
    } catch (err) {
      setCartError(err?.response?.data?.error || "Could not add to cart");
      setTimeout(() => setCartError(""), 4000);
    } finally {
      setCartLoading(false);
    }
  }

  async function handleRemoveFromCart() {
    if (cartLoading || !inCart) return;
    setCartError("");
    try {
      setCartLoading(true);
      await API.delete(`/cart/${convo.item_id}`);
      setInCart(false);
      const cartRes = await API.get("/cart");
      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: { count: cartRes.data.length },
        }),
      );
    } catch (err) {
      setCartError(err?.response?.data?.error || "Could not remove from cart");
      setTimeout(() => setCartError(""), 4000);
    } finally {
      setCartLoading(false);
    }
  }

  async function toggleStatus() {
    if (!isSeller || isSold || loading) return;
    try {
      setLoading(true);
      const newStatus = isPending ? "available" : "pending";
      await API.patch(`/items/${convo.item_id}/status`, { status: newStatus });
      onStatusChange(newStatus);
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setLoading(false);
    }
  }

  function startEditPrice() {
    setPriceVal(itemPrice != null ? String(itemPrice) : "");
    setEditingPrice(true);
    setTimeout(() => priceInputRef.current?.focus(), 60);
  }

  async function savePrice() {
    const num = parseFloat(priceVal);
    if (isNaN(num) || num < 0) {
      setEditingPrice(false);
      return;
    }
    try {
      setPriceSaving(true);
      await API.put(`/items/${convo.item_id}`, { price: num });
      setItemPrice(num);
    } catch (err) {
      console.error("Failed to update price", err);
    } finally {
      setPriceSaving(false);
      setEditingPrice(false);
    }
  }

  const pillBase = {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.28rem 0.75rem",
    borderRadius: "20px",
    fontSize: "0.7rem",
    fontWeight: "700",
    letterSpacing: "0.2px",
    cursor: "pointer",
    transition: "all 0.18s ease",
    border: "none",
    outline: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        margin: "0 1.5rem",
        padding: "0.65rem 1rem",
        background: "var(--glass-bg-row)",
        border: "1px solid var(--glass-border-row)",
        borderRadius: "14px",
      }}
    >
      <style>{`@keyframes mspin { to { transform: rotate(360deg) } }`}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            onClick={() =>
              isSeller
                ? navigate(
                    `/dashboard?tab=${status === "available" ? "active" : status}`,
                  )
                : navigate(`/items/${convo.item_id}`)
            }
            title={isSeller ? "Go to Dashboard" : "View Item"}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "9px",
              overflow: "hidden",
              flexShrink: 0,
              background: "var(--bg-card)",
              border: "1px solid var(--border-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.75";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {itemImage ? (
              <img
                src={itemImage}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "0.58rem",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--text-ghost)",
                fontWeight: "700",
                marginBottom: "0.1rem",
              }}
            >
              Item
            </div>
            <div
              onClick={() =>
                isSeller
                  ? navigate(
                      `/dashboard?tab=${status === "available" ? "active" : status}`,
                    )
                  : navigate(`/items/${convo.item_id}`)
              }
              style={{
                fontSize: "0.88rem",
                fontWeight: "700",
                color: "var(--accent)",
                letterSpacing: "-0.2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {convo.item_title || "Item"}
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
            <div
              style={{
                marginTop: "0.15rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {editingPrice ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-muted)",
                      fontWeight: "700",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    ref={priceInputRef}
                    type="number"
                    min="0"
                    value={priceVal}
                    onChange={(e) => setPriceVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") savePrice();
                      if (e.key === "Escape") setEditingPrice(false);
                    }}
                    onBlur={savePrice}
                    style={{
                      width: "72px",
                      padding: "0.15rem 0.4rem",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      background: "var(--bg-card-hover)",
                      border: "1px solid var(--accent-border)",
                      borderRadius: "6px",
                      color: "var(--text-primary)",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                  {priceSaving && (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        border: "1.5px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        animation: "mspin 0.6s linear infinite",
                      }}
                    />
                  )}
                </div>
              ) : (
                <div
                  onClick={isSeller && !isSold ? startEditPrice : undefined}
                  title={
                    isSeller && !isSold ? "Click to edit price" : undefined
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    cursor: isSeller && !isSold ? "pointer" : "default",
                  }}
                  onMouseEnter={(e) => {
                    if (isSeller && !isSold)
                      e.currentTarget.querySelector(".edit-icon")?.style &&
                        (e.currentTarget.querySelector(
                          ".edit-icon",
                        ).style.opacity = "1");
                  }}
                  onMouseLeave={(e) => {
                    if (isSeller && !isSold)
                      e.currentTarget.querySelector(".edit-icon")?.style &&
                        (e.currentTarget.querySelector(
                          ".edit-icon",
                        ).style.opacity = "0");
                  }}
                >
                  {itemPrice != null ? (
                    <>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          fontWeight: "700",
                        }}
                      >
                        ₹
                      </span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: "800",
                          color: "var(--text-primary)",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {Number(itemPrice).toLocaleString("en-IN")}
                      </span>
                      {isSeller && !isSold && (
                        <svg
                          className="edit-icon"
                          width="9"
                          height="9"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="rgba(255,255,255,0.4)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          style={{ opacity: 0, transition: "opacity 0.15s" }}
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      )}
                    </>
                  ) : isSeller && !isSold ? (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--text-ghost)",
                        fontWeight: "500",
                        fontStyle: "italic",
                      }}
                    >
                      set price
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          {isSeller && !isSold ? (
            <button
              onClick={toggleStatus}
              disabled={loading}
              onMouseEnter={() => setStatusHovered(true)}
              onMouseLeave={() => setStatusHovered(false)}
              style={{
                ...pillBase,
                background: hoverBg,
                border: `1px solid ${hoverColor}40`,
                color: hoverColor,
                opacity: loading ? 0.6 : 1,
                minWidth: "90px",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      border: "1.5px solid currentColor",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "mspin 0.6s linear infinite",
                    }}
                  />
                  Updating
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: hoverColor,
                      boxShadow: `0 0 5px ${hoverColor}`,
                      flexShrink: 0,
                    }}
                  />
                  {hoverLabel}
                </>
              )}
            </button>
          ) : (
            <div
              style={{
                ...pillBase,
                cursor: "default",
                background: statusBg,
                border: `1px solid ${statusColor}40`,
                color: statusColor,
              }}
            >
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: statusColor,
                  boxShadow: `0 0 5px ${statusColor}`,
                  flexShrink: 0,
                }}
              />
              {statusLabel}
            </div>
          )}
          {!isSeller && cartCheckDone && isAvailable && !inCart && (
            <button
              onClick={handleAddToCart}
              disabled={cartLoading}
              onMouseEnter={() => setAddHovered(true)}
              onMouseLeave={() => setAddHovered(false)}
              style={{
                ...pillBase,
                background: addHovered
                  ? "rgba(139,92,246,0.22)"
                  : "rgba(139,92,246,0.10)",
                border: `1px solid rgba(139,92,246,${addHovered ? "0.6" : "0.3"})`,
                color: "#c4b5fd",
                opacity: cartLoading ? 0.6 : 1,
              }}
            >
              {cartLoading ? (
                <>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      border: "1.5px solid currentColor",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "mspin 0.6s linear infinite",
                    }}
                  />
                  Adding...
                </>
              ) : (
                <>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
          )}
          {!isSeller && cartCheckDone && isAvailable && inCart && (
            <button
              onClick={handleRemoveFromCart}
              disabled={cartLoading}
              onMouseEnter={() => setRemoveHovered(true)}
              onMouseLeave={() => setRemoveHovered(false)}
              style={{
                ...pillBase,
                background: removeHovered
                  ? "rgba(255,107,107,0.14)"
                  : "rgba(255,107,107,0.06)",
                border: `1px solid rgba(255,107,107,${removeHovered ? "0.45" : "0.2"})`,
                color: removeHovered ? "#ffa8a8" : "#ff8787",
                opacity: cartLoading ? 0.6 : 1,
              }}
            >
              {cartLoading ? (
                <>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      border: "1.5px solid currentColor",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "mspin 0.6s linear infinite",
                    }}
                  />
                  Removing...
                </>
              ) : (
                <>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                  Remove
                </>
              )}
            </button>
          )}
        </div>
      </div>
      {cartError && (
        <div
          style={{
            marginTop: "0.5rem",
            padding: "0.35rem 0.8rem",
            background: "rgba(255,107,107,0.07)",
            border: "1px solid rgba(255,107,107,0.18)",
            borderRadius: "8px",
            fontSize: "0.72rem",
            color: "#ff8787",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {cartError}
        </div>
      )}
    </div>
  );
}

// ── Main Messages ─────────────────────────────────────────────
function Messages() {
  const navigate = useNavigate();

  // ── Draggable back button ──────────────────────────────────
  const [draggable, setDraggable] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("floatingDraggable") ?? "false");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const sync = () => {
      try {
        setDraggable(
          JSON.parse(localStorage.getItem("floatingDraggable") ?? "false"),
        );
      } catch {}
    };
    window.addEventListener("floatingDraggableChanged", sync);
    return () => window.removeEventListener("floatingDraggableChanged", sync);
  }, []);
  const backRef = useRef(null);
  useEffect(() => {
    if (!backRef.current) return;
    if (!draggable) {
      backRef.current.style.transform = "";
      backRef.current.style.transition = "";
      backRef.current.style.zIndex = "";
      backRef.current.style.cursor = "";
      localStorage.removeItem("drag_backbtn_msgs");
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem("drag_backbtn_msgs"));
        if (saved)
          backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`;
      } catch {}
    }
  }, [draggable]);
  useEffect(() => {
    if (!draggable || !backRef.current) return;
    try {
      const saved = JSON.parse(localStorage.getItem("drag_backbtn_msgs"));
      if (saved)
        backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`;
    } catch {}
  }, []);
  const startBackDrag = useCallback(
    (clientX, clientY) => {
      if (!draggable || !backRef.current) return;
      const el = backRef.current;
      const match = el.style.transform.match(
        /translate\(([-.0-9]+)px,\s*([-.0-9]+)px\)/,
      );
      const baseDx = match ? parseFloat(match[1]) : 0;
      const baseDy = match ? parseFloat(match[2]) : 0;
      let dx = baseDx,
        dy = baseDy;
      let hasDragged = false;
      let rafId = null;
      el.style.transition = "none";
      el.style.zIndex = "9999";
      el.style.cursor = "grabbing";
      const onMove = (cx, cy) => {
        dx = baseDx + (cx - clientX);
        dy = baseDy + (cy - clientY);
        if (Math.abs(cx - clientX) > 4 || Math.abs(cy - clientY) > 4)
          hasDragged = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          el.style.transform = `translate(${dx}px, ${dy}px)`;
        });
      };
      const onUp = () => {
        if (rafId) cancelAnimationFrame(rafId);
        el.style.cursor = "grab";
        el.style.transition = "";
        el.style.zIndex = "";
        if (hasDragged) {
          localStorage.setItem("drag_backbtn_msgs", JSON.stringify({ dx, dy }));
          const kill = (ce) => {
            ce.stopPropagation();
            ce.preventDefault();
            window.removeEventListener("click", kill, true);
          };
          window.addEventListener("click", kill, true);
        }
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onUp);
      };
      const onMouseMove = (e) => onMove(e.clientX, e.clientY);
      const onTouchMove = (e) => {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onUp);
    },
    [draggable],
  );
  const onBackMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      startBackDrag(e.clientX, e.clientY);
    },
    [startBackDrag],
  );
  const onBackTouchStart = useCallback(
    (e) => {
      startBackDrag(e.touches[0].clientX, e.touches[0].clientY);
    },
    [startBackDrag],
  );

  const location = useLocation();
  const incomingItem = location.state?.item;

  // ── State ──────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [sidebarTab, setSidebarTab] = useState("chats");
  const [chatRequests, setChatRequests] = useState([]);
  const chatRequestsRef = useRef([]); // mirror for socket handlers
  const [respondingId, setRespondingId] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const fetchTick = useRef(0); // increments on every convo click → forces useEffect to re-run
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [newConvoMode, setNewConvoMode] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // array of { file, type, preview, name, size, id }
  const [previewEditor, setPreviewEditor] = useState(null); // files staged for WhatsApp-style editor
  const [localUrls, setLocalUrls] = useState({}); // { messageId: blobUrl }
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [fullImageGallery, setFullImageGallery] = useState(null);
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "ember",
  );
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [mobShowChat, setMobShowChat] = useState(false);

  // Keep ref in sync so socket handlers can read latest chatRequests without stale closure
  useEffect(() => {
    chatRequestsRef.current = chatRequests;
  }, [chatRequests]);

  // ── Socket / presence state ────────────────────────────────
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState(new Set());
  const typingEmitRef = useRef(false);
  const typingEmitTimeoutRef = useRef(null);
  const typingClearTimeoutRef = useRef(null);
  const typingTimersRef = useRef({});

  useEffect(() => {
    const obs = new MutationObserver(() =>
      setTheme(document.documentElement.dataset.theme || "ember"),
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Group messages for WhatsApp-style image grids
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const myId = user?.id;
  const groupedMessages = useMemo(() => {
    const result = [];
    let i = 0;
    while (i < messages.length) {
      const msg = messages[i];
      // Only group if it's an image and has no text content
      const isGroupable = msg.imageUrl && !msg.content && !msg.fileUrl;
      
      if (isGroupable) {
        const group = [msg];
        let j = i + 1;
        while (j < messages.length) {
          const next = messages[j];
          const isNextGroupable = next.imageUrl && !next.content && !next.fileUrl;
          const sameSender = String(next.senderId) === String(msg.senderId);
          
          // Group if same sender, both images, no text, and within 1 minute
          const timeA = new Date(msg.createdAt || msg.timestamp).getTime();
          const timeB = new Date(next.createdAt || next.timestamp).getTime();
          const isWithinTime = Math.abs(timeB - timeA) < 60000;

          if (isNextGroupable && sameSender && isWithinTime) {
            group.push(next);
            j++;
          } else {
            break;
          }
        }
        
        if (group.length > 1) {
          result.push({
            id: `group_${msg.id}`,
            type: "image-group",
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            createdAt: group[group.length - 1].createdAt,
            timestamp: group[group.length - 1].timestamp,
            messages: group,
            isMe: String(msg.senderId) === String(myId),
          });
          i = j;
          continue;
        }
      }
      
      result.push(msg);
      i++;
    }
    return result;
  }, [messages, myId]);

  const messagesEndRef = useRef(null);
  const msgInputRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // helper to dedupe conversation list by key (latest wins)
  const setConvosDedupe = useCallback((list) => {
    const map = new Map();
    list.forEach((c) => map.set(c.conversation_id, c));
    setConversations(Array.from(map.values()));
  }, []);

  // ── Socket listeners ───────────────────────────────────────
  useEffect(() => {
    if (!myId) return;
    const socket = connectSocket(myId);

    socket.on("online-list", ({ userIds }) => {
      if (activeConvo?.other_user_id)
        setOtherUserOnline(userIds.includes(String(activeConvo.other_user_id)));
    });
    if (activeConvo?.other_user_id) {
      if (socket.connected) socket.emit("get-online-list");
      else socket.once("connect", () => socket.emit("get-online-list"));
    }
    socket.on("user-online", ({ userId }) => {
      if (activeConvo && String(userId) === String(activeConvo.other_user_id))
        setOtherUserOnline(true);
    });
    socket.on("user-offline", ({ userId }) => {
      if (activeConvo && String(userId) === String(activeConvo.other_user_id))
        setOtherUserOnline(false);
    });
    socket.on("typing-start", ({ fromUserId }) => {
      if (
        activeConvo &&
        String(fromUserId) === String(activeConvo.other_user_id)
      ) {
        setOtherUserTyping(true);
        clearTimeout(typingClearTimeoutRef.current);
        typingClearTimeoutRef.current = setTimeout(
          () => setOtherUserTyping(false),
          2000,
        );
      }
      setTypingUserIds((prev) => {
        const s = new Set(prev);
        s.add(String(fromUserId));
        return s;
      });
      clearTimeout(typingTimersRef.current[fromUserId]);
      typingTimersRef.current[fromUserId] = setTimeout(() => {
        setTypingUserIds((prev) => {
          const s = new Set(prev);
          s.delete(String(fromUserId));
          return s;
        });
      }, 2000);
    });
    socket.on("typing-stop", ({ fromUserId }) => {
      if (
        activeConvo &&
        String(fromUserId) === String(activeConvo.other_user_id)
      ) {
        clearTimeout(typingClearTimeoutRef.current);
        setOtherUserTyping(false);
      }
      clearTimeout(typingTimersRef.current[fromUserId]);
      setTypingUserIds((prev) => {
        const s = new Set(prev);
        s.delete(String(fromUserId));
        return s;
      });
    });
    socket.on("request-accepted", ({ requestId, itemId, seller }) => {
      setChatRequests((prev) => prev.filter((r) => r.id !== requestId));
      API.get("/messages/conversations")
        .then((res) => {
          setConvosDedupe(res.data);
          setSidebarTab("chats");
          const itemKey = `${itemId ?? "null"}-${seller?.id}`;
          const accepted = res.data.find(
            (c) =>
              c.conversation_id === itemKey &&
              c.chat_request_status === "accepted",
          );
          if (accepted) {
            setActiveConvo(accepted);
          }
        })
        .catch(() => {});
    });
    socket.on("request-declined", ({ requestId }) => {
      setChatRequests((prev) => prev.filter((r) => r.id !== requestId));
      setConversations((prev) =>
        prev.filter((c) => c.chat_request_id !== requestId),
      );
      if (activeConvo?.chat_request_id === requestId) {
        setActiveConvo(null);
        setMessages([]);
      }
    });
    socket.on("new-chat-request", (req) => {
      setChatRequests((prev) => [req, ...prev.filter((r) => r.id !== req.id)]);
      setSidebarTab("requests");
    });
    socket.on("new-message", (msg) => {
      const isActiveConvo =
        activeConvo &&
        msg.itemId === activeConvo.item_id &&
        (String(msg.senderId) === String(activeConvo.other_user_id) ||
          String(msg.senderId) === String(myId));

      if (isActiveConvo) {
        setMessages((prev) => {
          // Already have this real message by ID — skip
          if (prev.some((m) => m.id === msg.id)) return prev;

          // Remove the matching optimistic placeholder (identified by _optimistic flag)
          // Match on ID prefix OR on content+attachment for text messages.
          // IMPORTANT: only remove _optimistic messages, never real ones.
          const filtered = prev.filter((m) => {
            if (!m._optimistic) return true;  // never remove a real message
            const isMyMsg = String(msg.senderId) === String(myId);
            if (!isMyMsg) return true;
            // For text-only messages match on content
            if (!msg.fileUrl && !msg.imageUrl) {
              return m.content !== msg.content;
            }
            // For file messages match on name and size (since URLs change from Blob to Remote)
            if (msg.fileName && msg.fileSize) {
              return m.fileName !== msg.fileName || m.fileSize !== msg.fileSize;
            }
            
            // Fallback: match on URL if available
            if (msg.fileUrl)  return m.fileUrl  !== msg.fileUrl;
            if (msg.imageUrl) return m.imageUrl !== msg.imageUrl;
            return true;
          });

          const next = [...filtered, msg];
          return next.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
          );
        });
        setConversations((prev) =>
          prev.map((c) =>
            String(c.other_user_id) === String(activeConvo.other_user_id) &&
            c.item_id === activeConvo.item_id
              ? {
                  ...c,
                  unread_count: 0,
                  last_message: msg.content || (msg.imageUrl ? "Photo" : ""),
                  last_message_at: msg.createdAt,
                }
              : c,
          ),
        );
        if (activeConvo.isNew) {
          API.get("/messages/conversations")
            .then((res) => {
              setConvosDedupe(res.data);
              const real =
                res.data.find(
                  (c) =>
                    c.conversation_id === activeConvo.conversation_id &&
                    !c.isNew,
                ) ||
                res.data.find(
                  (c) =>
                    String(c.other_user_id) ===
                      String(activeConvo.other_user_id) &&
                    String(c.item_id ?? "null") ===
                      String(activeConvo.item_id ?? "null") &&
                    !c.isNew,
                );
              if (real) setActiveConvo(real);
            })
            .catch(() => {});
        } else {
          setConversations((prev) => {
            const updated = prev.map((c) =>
              c.conversation_id === activeConvo.conversation_id
                ? {
                    ...c,
                    last_message: msg.content || (msg.imageUrl ? "Photo" : ""),
                    last_message_at: msg.createdAt,
                  }
                : c,
            );
            const idx = updated.findIndex(
              (c) => c.conversation_id === activeConvo.conversation_id,
            );
            if (idx > 0) {
              const [m] = updated.splice(idx, 1);
              return [m, ...updated];
            }
            return updated;
          });
        }
        if (String(msg.senderId) === String(activeConvo.other_user_id)) {
          API.post("/messages/mark-convo-read", {
            itemId: msg.itemId,
            otherUserId: msg.senderId,
          }).catch(() => {});
        }
      } else if (String(msg.receiverId) === String(myId)) {
        setConversations((prev) => {
          const updated = prev.map((c) =>
            String(c.other_user_id) === String(msg.senderId) &&
            c.item_id === (msg.itemId ?? null)
              ? {
                  ...c,
                  unread_count: (c.unread_count || 0) + 1,
                  last_message: msg.content || (msg.imageUrl ? "Photo" : ""),
                  last_message_at: msg.createdAt,
                }
              : c,
          );
          const idx = updated.findIndex(
            (c) =>
              String(c.other_user_id) === String(msg.senderId) &&
              c.item_id === (msg.itemId ?? null),
          );
          if (idx > 0) {
            const [m] = updated.splice(idx, 1);
            return [m, ...updated];
          }
          return updated;
        });
      }
    });
    return () => {
      socket.off("online-list");
      socket.off("user-online");
      socket.off("user-offline");
      socket.off("typing-start");
      socket.off("typing-stop");
      socket.off("request-accepted");
      socket.off("request-declined");
      socket.off("new-chat-request");
      socket.off("new-message");
      clearTimeout(typingClearTimeoutRef.current);
      clearTimeout(typingEmitTimeoutRef.current);
    };
  }, [myId, activeConvo?.other_user_id, activeConvo?.item_id, setConvosDedupe]); // eslint-disable-line

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token]);

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0,
  );

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConvos(true);
        const res = await API.get("/messages/conversations");
        setConvosDedupe(res.data);
        if (incomingItem) {
          const existing = res.data.find(
            (c) =>
              c.item_id === incomingItem.id || c.itemId === incomingItem.id,
          );
          if (existing) {
            setActiveConvo(existing);
            setNewConvoMode(false);
          } else {
            setNewConvoMode(true);
            setActiveConvo({
              item_id: incomingItem.id,
              item_title: incomingItem.title,
              item_status: incomingItem.status || "available",
              item_seller_id: incomingItem.seller?.id,
              item_image: incomingItem.images?.[0] || null,
              other_user_name:
                `${incomingItem.seller?.firstName} ${incomingItem.seller?.lastName}`.trim() ||
                "Seller",
              other_user_id: incomingItem.seller?.id,
              other_user_avatar: incomingItem.seller?.avatar || null,
              isNew: true,
              chat_request_status: null,
              chat_request_id: null,
              is_request_sender: false,
            });
          }
        } else if (res.data.length === 1) {
          setActiveConvo(res.data[0]);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoadingConvos(false);
      }
    };
    fetchConversations();

    API.get("/chat-requests")
      .then((res) => {
        setChatRequests(
          res.data?.received?.filter((r) => r.status === "pending") || [],
        );
      })
      .catch(() => {});
  }, [incomingItem, setConvosDedupe]);

  useEffect(() => {
    if (activeConvo?.item_id && activeConvo?.other_user_id) {
      window.__activeConvoKey = `${activeConvo.item_id}-${activeConvo.other_user_id}`;
    } else {
      window.__activeConvoKey = null;
    }
    return () => {
      window.__activeConvoKey = null;
    };
  }, [activeConvo?.item_id, activeConvo?.other_user_id]);

  useEffect(() => {
    if (!activeConvo) return;
    if (activeConvo.isNew && !activeConvo.chat_request_id) return;
    const fetchMessages = async () => {
      try {
        // Only show loading spinner if we have no messages yet — otherwise keep showing old ones
        if (messages.length === 0) setLoadingMessages(true);
        const itemIdParam = activeConvo.item_id ?? "null";
        const res = await API.get(`/messages/${itemIdParam}`, {
          params: { otherUserId: activeConvo.other_user_id },
        });
        const sorted = [...res.data].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
        // Merge: keep any still-pending optimistic messages so they survive
        // a re-fetch triggered mid-upload (e.g. chat_request_status change).
        setMessages((prev) => {
          const optimisticPending = prev.filter(
            (m) => m._optimistic && !sorted.some((s) => s.id === m.id),
          );
          const merged = [...sorted, ...optimisticPending];
          return merged.sort(
            (a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp),
          );
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === activeConvo.conversation_id
              ? { ...c, unread_count: 0 }
              : c,
          ),
        );
        if (sorted.length > 0 && activeConvo.isNew) {
          setActiveConvo((prev) => (prev ? { ...prev, isNew: false } : prev));
        }
        await API.post("/messages/mark-convo-read", {
          itemId: activeConvo.item_id,
          otherUserId: activeConvo.other_user_id,
        }).catch(() => {});
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
    // fetchTick added so clicking the same convo again always re-fetches
  }, [
    activeConvo?.conversation_id,
    activeConvo?.chat_request_status,
    fetchTick.current,
  ]); // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (activeConvo) setTimeout(() => msgInputRef.current?.focus(), 100);
  }, [activeConvo?.conversation_id, activeConvo?.item_id]);

  useEffect(() => {
    if (!attachmentMenuOpen) return;
    const handleGlobalClick = (e) => {
      // If the click is not on the plus button or the menu itself, close it
      if (!e.target.closest(".attachment-btn") && !e.target.closest(".attachment-menu")) {
        setAttachmentMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, [attachmentMenuOpen, setAttachmentMenuOpen]);

  async function handleMarkAllRead() {
    try {
      setMarkingRead(true);
      await API.post("/messages/mark-all-read");
      setConversations((prev) => prev.map((c) => ({ ...c, unread_count: 0 })));
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingRead(false);
    }
  }

  function handleStatusChange(newStatus) {
    setActiveConvo((prev) => ({ ...prev, item_status: newStatus }));
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === activeConvo?.conversation_id
          ? { ...c, item_status: newStatus }
          : c,
      ),
    );
  }

  async function handleRespondRequest(id, status) {
    setRespondingId(id);
    const req = activeRequest;
    try {
      await API.patch(`/chat-requests/${id}`, { status });
      setChatRequests((prev) => {
        const remaining = prev.filter((r) => r.id !== id);
        if (remaining.length === 0) setSidebarTab("chats");
        return remaining;
      });
      setActiveRequest(null);

      if (status === "accepted") {
        setSidebarTab("chats");
        setMobShowChat(false);
        const convosRes = await API.get("/messages/conversations");
        setConvosDedupe(convosRes.data);
        const itemKey = `${req?.itemId ?? "null"}-${req?.sender?.id}`;
        const accepted = convosRes.data.find(
          (c) =>
            c.conversation_id === itemKey &&
            c.chat_request_status === "accepted",
        );
        if (accepted) {
          setActiveConvo(accepted);
        }
      }
    } catch (err) {
      console.error(
        "Failed to respond to request:",
        err?.response?.data || err,
      );
    } finally {
      setRespondingId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!confirmTarget) return;
    if (confirmTarget === "bulk") {
      await handleDeleteSelected();
      setConfirmTarget(null);
      return;
    }
    try {
      setDeleting(true);
      const itemIdParam = confirmTarget.item_id ?? "null";
      await API.delete(
        `/messages/conversation/${itemIdParam}/${confirmTarget.other_user_id}`,
      );
      setConversations((prev) =>
        prev.filter((c) => c.conversation_id !== confirmTarget.conversation_id),
      );
      if (activeConvo?.conversation_id === confirmTarget.conversation_id) {
        setActiveConvo(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  }

  async function handleDeleteSelected() {
    if (!selectedIds.length) return;
    try {
      setDeletingSelected(true);
      const toDelete = conversations.filter((c) =>
        selectedIds.includes(c.conversation_id),
      );
      await Promise.allSettled(
        toDelete.map((c) =>
          API.delete(
            `/messages/conversation/${c.item_id ?? "null"}/${c.other_user_id}`,
          ),
        ),
      );
      setConversations((prev) =>
        prev.filter((c) => !selectedIds.includes(c.conversation_id)),
      );
      if (activeConvo && selectedIds.includes(activeConvo.conversation_id)) {
        setActiveConvo(null);
        setMessages([]);
      }
      setSelectedIds([]);
      setSelectMode(false);
    } catch (err) {
      console.error("Failed to delete selected", err);
    } finally {
      setDeletingSelected(false);
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const handleFileSelect = useCallback(
    (e, mediaType) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      e.target.value = ""; // reset so same file can be re-selected

      const newFiles = files.map((file) => ({
        file,
        type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : "file",
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        id: Math.random().toString(36).substring(7),
      }));

      setAttachmentMenuOpen(false);

      // Images only → open WhatsApp-style preview editor (videos and docs go straight to pending)
      const hasImages = newFiles.some(f => f.type === "image");
      if (hasImages) {
        setPreviewEditor(newFiles);
      } else {
        // Docs go straight to pending (no preview needed)
        setPendingFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [setPendingFiles, setAttachmentMenuOpen, setPreviewEditor],
  );

  function removeFile(id) {
    setPendingFiles((prev) => (id ? prev.filter((f) => f.id !== id) : []));
  }

  const handleSend = useCallback(
  async (e, overrides = null) => {
    if (e) e.preventDefault();

    // overrides = { text, files } injected directly from handlePreviewSend
    const text        = overrides ? overrides.text        : newMessage.trim();
    const filesToSend = overrides ? overrides.files       : [...pendingFiles];

    if ((!text && filesToSend.length === 0) || !activeConvo) return;

    const otherUserId = activeConvo.other_user_id;
    const itemId      = activeConvo.item_id;

    try {
      setSending(true);
      // Only clear UI state when not using direct overrides
      if (!overrides) {
        setNewMessage("");
        setPendingFiles([]);
      }

        // 1. Send text message if present
        if (text) {
          const optimisticId = `opt_${Date.now()}_text`;
          const optimisticMsg = {
            id: optimisticId,
            content: text,
            senderId: myId,
            receiverId: otherUserId,
            itemId,
            timestamp: new Date().toISOString(),
            _optimistic: true,
          };
          setMessages((prev) => [...prev, optimisticMsg]);

          try {
            const res = await API.post("/messages", {
              receiverId: otherUserId,
              itemId,
              content: text,
            });
            // Remove the optimistic placeholder; the socket may have already
            // added the real message — dedup so we never show it twice.
            setMessages((prev) => {
              const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
              if (withoutOptimistic.some((m) => m.id === res.data.id)) {
                return withoutOptimistic; // socket already added it, don't duplicate
              }
              const next = [...withoutOptimistic, res.data];
              return next.sort(
                (a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp),
              );
            });
            handleAfterSend(res.data);
          } catch (err) {
            console.error("Failed to send text", err);
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          }
        }

        // 2. Send each file message
        for (const pf of filesToSend) {
          const optimisticId = `opt_${Date.now()}_${pf.id}`;
          const optimisticMsg = {
            id: optimisticId,
            content: "",
            senderId: myId,
            receiverId: otherUserId,
            itemId,
            timestamp: new Date().toISOString(),
            fileType: pf.type,
            fileName: pf.name,
            fileSize: pf.size,
            imageUrl: pf.type === "image" ? pf.preview : null,
            fileUrl: pf.type !== "image" ? pf.preview : null,
            _optimistic: true,
          };
          setMessages((prev) => [...prev, optimisticMsg]);

          try {
            const formData = new FormData();
            const fieldName = pf.type === "image" ? "image" : pf.type === "video" ? "video" : "file";
            formData.append(fieldName, pf.file);

            // A. Upload the file first
            const uploadEndpoint =
              pf.type === "image"
                ? "/upload/message-image"
                : pf.type === "video"
                  ? "/upload/message-video"
                  : "/upload/message-file";
            
            const uploadRes = await API.post(uploadEndpoint, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            const uploadedUrl = uploadRes.data.url;

            // B. Create the message record with the uploaded URL
            const msgRes = await API.post("/messages", {
              receiverId: otherUserId,
              itemId,
              content: "",
              imageUrl: pf.type === "image" ? uploadedUrl : null,
              fileUrl: pf.type !== "image" ? uploadedUrl : null,
              fileType: pf.type,
              fileName: pf.name,
              fileSize: pf.size,
              publicId: uploadRes.data.publicId,
            });

            // Remove the optimistic placeholder; the socket may have already
            // added the real message — dedup so we never show it twice.
            setMessages((prev) => {
              const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
              if (withoutOptimistic.some((m) => m.id === msgRes.data.id)) {
                return withoutOptimistic; // socket already added it, don't duplicate
              }
              const next = [...withoutOptimistic, msgRes.data];
              return next.sort(
                (a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp),
              );
            });
            handleAfterSend(msgRes.data);
          } catch (err) {
            console.error(`Failed to send ${pf.type}`, err);
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          }
        }

        // Stop typing indicator
        const socket = getSocket();
        if (socket && otherUserId) {
          clearTimeout(typingEmitTimeoutRef.current);
          typingEmitRef.current = false;
          socket.emit("typing-stop", { toUserId: otherUserId, itemId });
        }
      } catch (err) {
        console.error("Send process failed", err);
      } finally {
        setSending(false);
      }
    },
    [
      activeConvo,
      newMessage,
      pendingFiles,
      setMessages,
      myId,
      handleAfterSend,
      setPendingFiles,
    ],
  );

  // Called when user hits Send inside ImagePreviewEditor.
  // Defined AFTER handleSend to avoid TDZ reference error.
  const handlePreviewSend = useCallback(({ files, caption }) => {
    setPreviewEditor(null);
    handleSend(null, { text: caption.trim(), files });
  }, [handleSend]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAfterSend(res) {
    if (res.data?.routedAsRequest) {
      const convosRes = await API.get("/messages/conversations").catch(() => null);
      if (convosRes?.data) {
        setConvosDedupe(convosRes.data);
        const pending = convosRes.data.find(
          (c) =>
            String(c.other_user_id) === String(activeConvo.other_user_id) &&
            String(c.item_id ?? "null") === String(activeConvo.item_id ?? "null") &&
            c.chat_request_status === "pending"
        );
        if (pending) {
          setActiveConvo(pending);
          setNewConvoMode(false);
        }
      }
      API.get("/chat-requests")
        .then((r) => {
          setChatRequests(r.data?.received?.filter((x) => x.status === "pending") || []);
        })
        .catch(() => {});
      return;
    }

    if (activeConvo.isNew) {
      const convosRes = await API.get("/messages/conversations");
      setConvosDedupe(convosRes.data);
      const real = convosRes.data.find(
        (c) =>
          (c.conversation_id === activeConvo.conversation_id && !c.isNew) ||
          (String(c.other_user_id) === String(activeConvo.other_user_id) &&
            String(c.item_id ?? "null") === String(activeConvo.item_id ?? "null") &&
            !c.isNew)
      );
      if (real) setActiveConvo(real);
      setNewConvoMode(false);
    }
  }

  return (
    <div
      className="msgs-page"
      style={{
        height: "calc(100vh - 65px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "2rem 4rem 1.5rem",
      }}
    >
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse     { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.5; transform:scale(0.85) } }
        @keyframes typingDot { 0%,60%,100% { transform:translateY(0); opacity:0.4 } 30% { transform:translateY(-3px); opacity:1 } }
        @keyframes reqSlideIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes lockPulse { 0%,100% { opacity:0.5 } 50% { opacity:1 } }
        @keyframes drawerIn  { from { transform:translateX(-100%) } to { transform:translateX(0) } }
        .msg-input::placeholder { color: var(--text-muted) }
        .msg-input:focus { outline: none }
        ::-webkit-scrollbar { width: 0px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: transparent }
        .hide-scrollbar::-webkit-scrollbar { display: none }
        .msgs-page    { padding: 2rem 4rem 1.5rem }
        .msgs-heading { display:flex; align-items:flex-end; justify-content:space-between; flex-shrink:0 }
        .msgs-title   { font-size:2.8rem }
        .msgs-panels  { display:grid; grid-template-columns:300px 1fr; gap:1rem; flex:1; min-height:0; position:relative }
        .msgs-back-desktop { display:flex }
        .msgs-hamburger    { display:none !important }
        .msgs-drawer       { display:none }
        @media (max-width:768px) {
          .msgs-page        { padding: 1.25rem 1.25rem 0.75rem !important }
          .msgs-heading     { flex-direction:column; align-items:flex-start; gap:0.5rem }
          .msgs-title       { font-size:2.2rem !important }
          .msgs-panels      { grid-template-columns:1fr !important }
          .msgs-panel-sidebar { display:none !important }
          .msgs-panel-chat  { display:flex !important }
          .msgs-back-desktop { display:none !important }
          .msgs-hamburger   { display:flex !important }
          .msgs-drawer      { display:block !important; position:absolute; inset:0; z-index:50; border-radius:20px; overflow:hidden; pointer-events:all }
        }
        @media (max-width:480px) {
          .msgs-page  { padding: 0.75rem 0.75rem 0.5rem !important }
          .msgs-title { font-size:1.8rem !important }
        }
      `}</style>

      <ConfirmDialog
        open={!!confirmTarget}
        name={
          confirmTarget === "bulk"
            ? `${selectedIds.length} conversation${selectedIds.length > 1 ? "s" : ""}`
            : confirmTarget?.other_user_name
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      <div
        style={{
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Heading */}
        <div className="msgs-heading" style={{ flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, lineHeight: 1.05 }}>
              <span
                className="msgs-title"
                style={{
                  display: "block",
                  fontWeight: "900",
                  color: "var(--text-primary)",
                  letterSpacing: "-1.5px",
                }}
              >
                My
              </span>
              <span
                className="msgs-title"
                style={{
                  display: "block",
                  fontWeight: "900",
                  letterSpacing: "-1.5px",
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Messages.
              </span>
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginTop: "0.4rem",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  fontWeight: "500",
                }}
              >
                {conversations.length} conversation
                {conversations.length !== 1 ? "s" : ""}
                {totalUnread > 0 && (
                  <span
                    style={{
                      color: "var(--accent)",
                      fontWeight: "700",
                      marginLeft: "0.5rem",
                    }}
                  >
                    · {totalUnread} unread
                  </span>
                )}
              </p>
            </div>
          </div>
          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingRead}
              style={{
                padding: "0.5rem 1.2rem",
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent)",
                borderRadius: "10px",
                cursor: markingRead ? "not-allowed" : "pointer",
                fontSize: "0.78rem",
                fontWeight: "600",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
                opacity: markingRead ? 0.6 : 1,
              }}
            >
              {markingRead ? "Marking..." : "✓ Mark all read"}
            </button>
          )}
        </div>

        {/* Mobile drawer — slides in over chat with dimmed overlay */}
        {mobShowChat && (
          <div className="msgs-drawer" onClick={() => setMobShowChat(false)}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                borderRadius: "20px",
              }}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                bottom: "0",
                width: "88%",
                maxWidth: "310px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "20px 0 0 20px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "8px 0 40px rgba(0,0,0,0.5)",
                zIndex: 51,
                animation: "drawerIn 0.22s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {/* Tab headers */}
              <div
                style={{
                  borderBottom: "1px solid var(--border)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex" }}>
                  {[
                    { key: "chats", label: "Chats" },
                    ...(chatRequests.length > 0
                      ? [
                          {
                            key: "requests",
                            label: "Requests",
                            count: chatRequests.length,
                          },
                        ]
                      : []),
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setSidebarTab(tab.key);
                        if (tab.key === "chats") setActiveRequest(null);
                      }}
                      style={{
                        flex: 1,
                        padding: "0.75rem 0.5rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.72rem",
                        fontWeight: sidebarTab === tab.key ? "700" : "500",
                        color:
                          sidebarTab === tab.key
                            ? "var(--accent)"
                            : "var(--text-muted)",
                        borderBottom:
                          sidebarTab === tab.key
                            ? "2px solid var(--accent)"
                            : "2px solid transparent",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.35rem",
                        fontFamily: "inherit",
                      }}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span
                          style={{
                            fontSize: "0.55rem",
                            fontWeight: "800",
                            padding: "1px 5px",
                            borderRadius: "10px",
                            background:
                              sidebarTab === tab.key
                                ? "var(--accent-soft)"
                                : "var(--bg-card-hover)",
                            color:
                              sidebarTab === tab.key
                                ? "var(--accent)"
                                : "var(--text-secondary)",
                            border: `1px solid ${sidebarTab === tab.key ? "var(--accent-border)" : "var(--border)"}`,
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => setMobShowChat(false)}
                    style={{
                      padding: "0 0.85rem",
                      background: "none",
                      border: "none",
                      borderLeft: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                {sidebarTab === "chats" && (
                  <div
                    style={{
                      padding: "0.4rem 0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: "0.4rem",
                    }}
                  >
                    {selectMode && selectedIds.length > 0 && (
                      <button
                        onClick={() => setConfirmTarget("bulk")}
                        style={{
                          padding: "0.28rem 0.6rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,107,107,0.35)",
                          background: "rgba(255,107,107,0.1)",
                          color: "#ff8787",
                          fontSize: "0.65rem",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        Delete {selectedIds.length}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectMode((s) => !s);
                        setSelectedIds([]);
                      }}
                      style={{
                        padding: "0.28rem 0.6rem",
                        borderRadius: "8px",
                        border: `1px solid ${selectMode ? "rgba(var(--accent-rgb),0.4)" : "var(--border)"}`,
                        background: selectMode
                          ? "rgba(var(--accent-rgb),0.12)"
                          : "transparent",
                        color: selectMode
                          ? "var(--accent)"
                          : "var(--text-muted)",
                        fontSize: "0.65rem",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      {selectMode ? "Cancel" : "Select"}
                    </button>
                  </div>
                )}
              </div>

              {/* List */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "0.5rem",
                  scrollbarWidth: "none",
                }}
                className="hide-scrollbar"
              >
                {sidebarTab === "requests" ? (
                  chatRequests.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "3rem 1rem",
                        color: "var(--text-ghost)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "2rem",
                          marginBottom: "0.5rem",
                          opacity: 0.3,
                        }}
                      >
                        💬
                      </div>
                      <p style={{ fontSize: "0.78rem", fontWeight: "500" }}>
                        No pending requests
                      </p>
                    </div>
                  ) : (
                    chatRequests.map((req) => {
                      const isAct = activeRequest?.id === req.id;
                      return (
                        <div
                          key={req.id}
                          onClick={() => {
                            setActiveRequest(req);
                            setActiveConvo(null);
                            setMobShowChat(false);
                          }}
                          style={{
                            padding: "0.75rem 1rem",
                            borderRadius: "14px",
                            cursor: "pointer",
                            marginBottom: "0.25rem",
                            position: "relative",
                            background: isAct
                              ? "var(--accent-soft)"
                              : "transparent",
                            border: isAct
                              ? "1px solid var(--accent-border)"
                              : "1px solid transparent",
                            display: "flex",
                            gap: "0.75rem",
                            alignItems: "center",
                            height: "64px",
                            boxSizing: "border-box",
                          }}
                          onMouseEnter={(e) => {
                            if (!isAct)
                              e.currentTarget.style.background =
                                "var(--bg-card-hover)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isAct)
                              e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: "3px",
                              height: "55%",
                              borderRadius: "0 3px 3px 0",
                              background:
                                "linear-gradient(180deg, var(--accent), var(--accent-alt))",
                            }}
                          />
                          <Avatar
                            name={`${req.sender?.firstName} ${req.sender?.lastName}`}
                            size={38}
                            orange={isAct}
                            src={req.sender?.avatar || null}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "0.88rem",
                                fontWeight: "700",
                                color: isAct
                                  ? "var(--accent)"
                                  : "var(--text-primary)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {req.sender?.firstName} {req.sender?.lastName}
                            </div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--text-muted)",
                                marginTop: "0.15rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                minWidth: 0,
                              }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.2rem",
                                  color: isAct
                                    ? "var(--accent)"
                                    : "var(--text-muted)",
                                  fontWeight: "600",
                                  flexShrink: 0,
                                }}
                              >
                                {!req.itemId ? (
                                  <>
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                      <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Profile
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                      <line x1="7" y1="7" x2="7.01" y2="7" />
                                    </svg>
                                    Item
                                  </>
                                )}
                              </span>
                              <span
                                style={{
                                  color: "var(--text-ghost)",
                                  fontSize: "0.65rem",
                                  flexShrink: 0,
                                }}
                              >
                                •
                              </span>
                              <span
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  flex: 1,
                                }}
                              >
                                {req.message || "Wants to chat with you"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  <>
                    {newConvoMode && activeConvo?.isNew && (
                      <div
                        style={{
                          padding: "0.75rem 1rem",
                          borderRadius: "14px",
                          background: "var(--accent-soft)",
                          border: "1px solid var(--accent-border)",
                          marginBottom: "0.25rem",
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "center",
                          height: "64px",
                          boxSizing: "border-box",
                        }}
                      >
                        <Avatar
                          name={activeConvo.other_user_name}
                          size={38}
                          orange
                          src={activeConvo.other_user_avatar || null}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: "0.88rem",
                              fontWeight: "700",
                              color: "var(--accent)",
                            }}
                          >
                            {activeConvo.other_user_name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--accent-alt)",
                              fontWeight: "600",
                              marginTop: "0.1rem",
                              opacity: 0.8,
                            }}
                          >
                            New conversation
                          </div>
                        </div>
                      </div>
                    )}
                    {loadingConvos ? (
                      <div
                        style={{ textAlign: "center", padding: "3rem 1rem" }}
                      >
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            border: "2.5px solid var(--border)",
                            borderTop: "2.5px solid var(--accent)",
                            borderRadius: "50%",
                            margin: "0 auto",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                      </div>
                    ) : conversations.length === 0 && !newConvoMode ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "3rem 1rem",
                          color: "var(--text-ghost)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "2rem",
                            marginBottom: "0.5rem",
                            opacity: 0.3,
                          }}
                        >
                          ✉
                        </div>
                        <p style={{ fontSize: "0.78rem", fontWeight: "500" }}>
                          No conversations yet
                        </p>
                      </div>
                    ) : (
                      conversations.map((convo) => (
                        <ConversationItem
                          key={convo.conversation_id}
                          convo={convo}
                          isActive={
                            activeConvo?.conversation_id ===
                            convo.conversation_id
                          }
                          isSelected={selectedIds.includes(
                            convo.conversation_id,
                          )}
                          selectMode={selectMode}
                          isTyping={
                            !(
                              activeConvo &&
                              activeConvo.conversation_id ===
                                convo.conversation_id
                            ) && typingUserIds.has(String(convo.other_user_id))
                          }
                          onClick={() => {
                            fetchTick.current++;
                            setActiveConvo(convo);
                            setActiveRequest(null);
                            setNewConvoMode(false);
                            setMobShowChat(false);
                          }}
                          onSelect={toggleSelect}
                        />
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panels */}
        <div className="msgs-panels">
          <button
            ref={backRef}
            className="msgs-back-desktop"
            onClick={() => navigate(-1)}
            onMouseDown={onBackMouseDown}
            onTouchStart={onBackTouchStart}
            style={{
              position: "absolute",
              left: "-50px",
              top: "12px",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "var(--bg-card)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: draggable ? "grab" : "pointer",
              flexShrink: 0,
              color: "var(--text-muted)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
              e.currentTarget.style.boxShadow =
                "0 0 8px 2px rgba(var(--accent-rgb),0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* ── LEFT SIDEBAR ── */}
          <div
            className="msgs-panel-sidebar"
            style={{
              background: "var(--bg-card)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Tab headers */}
            <div
              style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}
            >
              <div style={{ display: "flex" }}>
                {[
                  { key: "chats", label: "Chats" },
                  ...(chatRequests.length > 0
                    ? [
                        {
                          key: "requests",
                          label: "Requests",
                          count: chatRequests.length,
                        },
                      ]
                    : []),
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setSidebarTab(tab.key);
                      if (tab.key === "chats") setActiveRequest(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "0.75rem 0.5rem",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      fontWeight: sidebarTab === tab.key ? "700" : "500",
                      color:
                        sidebarTab === tab.key
                          ? "var(--accent)"
                          : "var(--text-muted)",
                      borderBottom:
                        sidebarTab === tab.key
                          ? "2px solid var(--accent)"
                          : "2px solid transparent",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      fontFamily: "inherit",
                    }}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        style={{
                          fontSize: "0.55rem",
                          fontWeight: "800",
                          padding: "1px 5px",
                          borderRadius: "10px",
                          background:
                            sidebarTab === tab.key
                              ? "var(--accent-soft)"
                              : "var(--bg-card-hover)",
                          color:
                            sidebarTab === tab.key
                              ? "var(--accent)"
                              : "var(--text-secondary)",
                          border: `1px solid ${sidebarTab === tab.key ? "var(--accent-border)" : "var(--border)"}`,
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {sidebarTab === "chats" && (
                <div
                  style={{
                    padding: "0.5rem 1rem 0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "0.5rem",
                  }}
                >
                  {selectMode && selectedIds.length > 0 && (
                    <button
                      onClick={() => setConfirmTarget("bulk")}
                      style={{
                        padding: "0.3rem 0.7rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,107,107,0.35)",
                        background: "rgba(255,107,107,0.1)",
                        color: "#ff8787",
                        fontSize: "0.68rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      Delete {selectedIds.length}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectMode((s) => !s);
                      setSelectedIds([]);
                    }}
                    style={{
                      padding: "0.3rem 0.7rem",
                      borderRadius: "8px",
                      border: `1px solid ${selectMode ? "rgba(var(--accent-rgb),0.4)" : "var(--border)"}`,
                      background: selectMode
                        ? "rgba(var(--accent-rgb),0.12)"
                        : "transparent",
                      color: selectMode ? "var(--accent)" : "var(--text-muted)",
                      fontSize: "0.68rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {selectMode ? "Cancel" : "Select"}
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar list */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0.5rem",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              className="hide-scrollbar"
            >
              {/* ── REQUESTS TAB ── */}
              {sidebarTab === "requests" ? (
                chatRequests.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "3rem 1rem",
                      color: "var(--text-ghost)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "2rem",
                        marginBottom: "0.5rem",
                        opacity: 0.3,
                      }}
                    >
                      💬
                    </div>
                    <p style={{ fontSize: "0.78rem", fontWeight: "500" }}>
                      No pending requests
                    </p>
                  </div>
                ) : (
                  chatRequests.map((req) => {
                    const isActive = activeRequest?.id === req.id;
                    return (
                      <div
                        key={req.id}
                        onClick={() => {
                          setActiveRequest(req);
                          setActiveConvo(null);
                        }}
                        style={{
                          padding: "0.75rem 1rem",
                          borderRadius: "14px",
                          cursor: "pointer",
                          marginBottom: "0.25rem",
                          position: "relative",
                          background: isActive
                            ? "var(--accent-soft)"
                            : "transparent",
                          border: isActive
                            ? "1px solid var(--accent-border)"
                            : "1px solid transparent",
                          transition:
                            "background 0.18s ease, border 0.18s ease",
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "center",
                          height: "64px",
                          boxSizing: "border-box",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background =
                              "var(--bg-card-hover)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {/* accent left bar */}
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "3px",
                            height: "55%",
                            borderRadius: "0 3px 3px 0",
                            background:
                              "linear-gradient(180deg, var(--accent), var(--accent-alt))",
                          }}
                        />
                        <Avatar
                          name={`${req.sender?.firstName} ${req.sender?.lastName}`}
                          size={38}
                          orange={isActive}
                          src={req.sender?.avatar || null}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "0.88rem",
                              fontWeight: "700",
                              color: isActive
                                ? "var(--accent)"
                                : "var(--text-primary)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              letterSpacing: "-0.2px",
                            }}
                          >
                            {req.sender?.firstName} {req.sender?.lastName}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              marginTop: "0.15rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.2rem",
                                color: isActive
                                  ? "var(--accent)"
                                  : "var(--text-muted)",
                                fontWeight: "600",
                                flexShrink: 0,
                              }}
                            >
                              {!req.itemId ? (
                                <>
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                  </svg>
                                  Profile
                                </>
                              ) : (
                                <>
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                    <line x1="7" y1="7" x2="7.01" y2="7" />
                                  </svg>
                                  Item
                                </>
                              )}
                            </span>
                            <span
                              style={{
                                color: "var(--text-ghost)",
                                fontSize: "0.65rem",
                                flexShrink: 0,
                              }}
                            >
                              •
                            </span>
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                flex: 1,
                              }}
                            >
                              {req.message || "Wants to chat with you"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                /* ── CHATS TAB ── */
                <>
                  {newConvoMode && activeConvo?.isNew && (
                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "14px",
                        background: "var(--accent-soft)",
                        border: "1px solid var(--accent-border)",
                        marginBottom: "0.25rem",
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "center",
                        height: "64px",
                        boxSizing: "border-box",
                      }}
                    >
                      <Avatar
                        name={activeConvo.other_user_name}
                        size={38}
                        orange
                        src={activeConvo.other_user_avatar || null}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: "0.88rem",
                            fontWeight: "700",
                            color: "var(--accent)",
                          }}
                        >
                          {activeConvo.other_user_name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--accent-alt)",
                            fontWeight: "600",
                            marginTop: "0.1rem",
                            opacity: 0.8,
                          }}
                        >
                          New conversation
                        </div>
                      </div>
                    </div>
                  )}
                  {loadingConvos ? (
                    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          border: "2.5px solid var(--border)",
                          borderTop: "2.5px solid var(--accent)",
                          borderRadius: "50%",
                          margin: "0 auto",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                    </div>
                  ) : conversations.length === 0 && !newConvoMode ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "3rem 1rem",
                        color: "var(--text-ghost)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "2rem",
                          marginBottom: "0.5rem",
                          opacity: 0.3,
                        }}
                      >
                        ✉
                      </div>
                      <p style={{ fontSize: "0.78rem", fontWeight: "500" }}>
                        No conversations yet
                      </p>
                    </div>
                  ) : (
                    conversations.map((convo) => (
                      <ConversationItem
                        key={convo.conversation_id}
                        convo={convo}
                        isActive={
                          activeConvo?.conversation_id === convo.conversation_id
                        }
                        isSelected={selectedIds.includes(convo.conversation_id)}
                        selectMode={selectMode}
                        isTyping={
                          !(
                            activeConvo &&
                            activeConvo.conversation_id ===
                              convo.conversation_id
                          ) && typingUserIds.has(String(convo.other_user_id))
                        }
                        onClick={() => {
                          fetchTick.current++;
                          setActiveConvo(convo);
                          setActiveRequest(null);
                          setNewConvoMode(false);
                          setMobShowChat(true);
                        }}
                        onSelect={toggleSelect}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div
            className="msgs-panel-chat"
            style={{
              background: "var(--bg-card)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* ════════════════════════════════════════════════
                REQUEST VIEW — chat-bubble preview
                ═══════════════════════════════════════════════ */}
            {activeRequest && !activeConvo ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  animation: "reqSlideIn 0.22s ease",
                }}
              >
                {/* ── Header: looks like a real chat header ── */}
                <div
                  style={{
                    padding: "1rem 1.5rem 0.85rem",
                    borderBottom: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                    }}
                  >
                    <button
                      className="msgs-hamburger"
                      onClick={() => setMobShowChat((prev) => !prev)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "9px",
                        border: "1px solid var(--border-hover)",
                        background: "var(--bg-card)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <line x1="2" y1="5" x2="18" y2="5" />
                        <line x1="2" y1="10" x2="14" y2="10" />
                        <line x1="2" y1="15" x2="18" y2="15" />
                      </svg>
                    </button>
                    <Avatar
                      name={`${activeRequest.sender?.firstName} ${activeRequest.sender?.lastName}`}
                      size={40}
                      src={activeRequest.sender?.avatar || null}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: "700",
                          color: "var(--text-primary)",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {activeRequest.sender?.firstName}{" "}
                        {activeRequest.sender?.lastName}
                      </div>
                      {activeRequest.sender?.institution && (
                        <div
                          style={{
                            fontSize: "0.68rem",
                            marginTop: "0.1rem",
                            color: "var(--text-muted)",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          {activeRequest.sender.institution}
                        </div>
                      )}
                    </div>
                    {/* date badge */}
                    <div
                      style={{
                        fontSize: "0.62rem",
                        color: "var(--text-ghost)",
                        flexShrink: 0,
                        padding: "0.2rem 0.6rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "20px",
                      }}
                    >
                      {activeRequest.createdAt
                        ? new Date(activeRequest.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" },
                          )
                        : "Just now"}
                    </div>
                  </div>
                </div>

                {/* ── Message area: their message as a real chat bubble ── */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    position: "relative",
                  }}
                >
                  {/* "pending request" label at top — tiny and unobtrusive */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.3rem 0.85rem",
                        background: "var(--accent-soft)",
                        border: "1px solid var(--accent-border)",
                        borderRadius: "20px",
                        fontSize: "0.65rem",
                        fontWeight: "700",
                        color: "var(--accent)",
                        letterSpacing: "0.3px",
                      }}
                    >
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Pending request
                    </div>
                  </div>

                  {/* Their message — real bubble, left-aligned */}
                  {activeRequest.message ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        animation: "fadeUp 0.25s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "0.6rem",
                          maxWidth: "72%",
                        }}
                      >
                        <Avatar
                          name={`${activeRequest.sender?.firstName} ${activeRequest.sender?.lastName}`}
                          size={28}
                          src={activeRequest.sender?.avatar || null}
                        />
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              padding: "0.65rem 1rem",
                              borderRadius: "18px 18px 18px 4px",
                              background: "var(--bg-card-hover)",
                              border: "1px solid var(--border-hover)",
                              color: "var(--text-primary)",
                              fontSize: "0.9rem",
                              lineHeight: "1.55",
                              fontWeight: "500",
                            }}
                          >
                            {activeRequest.message}
                          </div>
                          <span
                            style={{
                              fontSize: "0.6rem",
                              color: "var(--text-ghost)",
                              paddingInline: "0.3rem",
                            }}
                          >
                            {activeRequest.createdAt
                              ? new Date(
                                  activeRequest.createdAt,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        animation: "fadeUp 0.25s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "0.6rem",
                          maxWidth: "72%",
                        }}
                      >
                        <Avatar
                          name={`${activeRequest.sender?.firstName} ${activeRequest.sender?.lastName}`}
                          size={28}
                          src={activeRequest.sender?.avatar || null}
                        />
                        <div
                          style={{
                            padding: "0.65rem 1rem",
                            borderRadius: "18px 18px 18px 4px",
                            background: "var(--bg-card-hover)",
                            border: "1px solid var(--border)",
                            color: "var(--text-muted)",
                            fontSize: "0.82rem",
                            fontStyle: "italic",
                            lineHeight: "1.5",
                          }}
                        >
                          No message — just wants to connect.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Locked reply area — shows what the input will look like but blocked */}
                  <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
                    <div
                      style={{
                        padding: "0.65rem 1rem",
                        background: "var(--bg-input)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        cursor: "not-allowed",
                        opacity: 0.45,
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-muted)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        style={{
                          flexShrink: 0,
                          animation: "lockPulse 2.5s ease-in-out infinite",
                        }}
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-muted)",
                          fontStyle: "italic",
                        }}
                      >
                        Accept the request to start chatting…
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Accept / Decline buttons ── */}
                <div
                  style={{
                    padding: "1rem 1.5rem 1.25rem",
                    borderTop: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", gap: "0.65rem" }}>
                    {/* Decline */}
                    <button
                      onClick={() =>
                        handleRespondRequest(activeRequest.id, "declined")
                      }
                      disabled={respondingId === activeRequest.id}
                      style={{
                        flex: 1,
                        padding: "0.78rem",
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-card)",
                        border: "1px solid rgba(255,107,107,0.28)",
                        color: "#ff8787",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        cursor:
                          respondingId === activeRequest.id
                            ? "not-allowed"
                            : "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.2s",
                        opacity: respondingId === activeRequest.id ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                      }}
                      onMouseEnter={(e) => {
                        if (respondingId !== activeRequest.id) {
                          e.currentTarget.style.background =
                            "rgba(255,107,107,0.10)";
                          e.currentTarget.style.borderColor =
                            "rgba(255,107,107,0.50)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg-card)";
                        e.currentTarget.style.borderColor =
                          "rgba(255,107,107,0.28)";
                      }}
                    >
                      {respondingId === activeRequest.id ? (
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            border: "2px solid rgba(255,107,107,0.3)",
                            borderTopColor: "#ff8787",
                            borderRadius: "50%",
                            animation: "spin 0.6s linear infinite",
                          }}
                        />
                      ) : (
                        <>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          Decline
                        </>
                      )}
                    </button>

                    {/* Accept */}
                    <button
                      onClick={() =>
                        handleRespondRequest(activeRequest.id, "accepted")
                      }
                      disabled={respondingId === activeRequest.id}
                      style={{
                        flex: 2,
                        padding: "0.78rem",
                        borderRadius: "var(--radius-md)",
                        background:
                          respondingId === activeRequest.id
                            ? "rgba(81,207,102,0.10)"
                            : "linear-gradient(135deg, #3ecf5a, #2b9e44)",
                        border: "none",
                        color: "white",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        cursor:
                          respondingId === activeRequest.id
                            ? "not-allowed"
                            : "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.2s",
                        boxShadow:
                          respondingId === activeRequest.id
                            ? "none"
                            : "0 4px 18px rgba(62,207,90,0.30)",
                        opacity: respondingId === activeRequest.id ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                      }}
                      onMouseEnter={(e) => {
                        if (respondingId !== activeRequest.id) {
                          e.currentTarget.style.filter = "brightness(1.08)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 22px rgba(62,207,90,0.42)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = "";
                        e.currentTarget.style.boxShadow =
                          respondingId === activeRequest.id
                            ? "none"
                            : "0 4px 18px rgba(62,207,90,0.30)";
                      }}
                    >
                      {respondingId === activeRequest.id ? (
                        <>
                          <div
                            style={{
                              width: "14px",
                              height: "14px",
                              border: "2px solid rgba(255,255,255,0.3)",
                              borderTopColor: "white",
                              borderRadius: "50%",
                              animation: "spin 0.6s linear infinite",
                            }}
                          />{" "}
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Accept Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : !activeConvo ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  color: "var(--text-ghost)",
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: 0.3 }}
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                  {sidebarTab === "requests"
                    ? "Select a request to review"
                    : "Select a conversation"}
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: "1rem 1.5rem 0.85rem",
                    borderBottom: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      marginBottom: "0.85rem",
                    }}
                  >
                    <button
                      className="msgs-hamburger"
                      onClick={() => setMobShowChat((prev) => !prev)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "9px",
                        border: "1px solid var(--border-hover)",
                        background: "var(--bg-card)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s",
                        gap: "0",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <line x1="2" y1="5" x2="18" y2="5" />
                        <line x1="2" y1="10" x2="14" y2="10" />
                        <line x1="2" y1="15" x2="18" y2="15" />
                      </svg>
                    </button>
                    <Avatar
                      name={activeConvo.other_user_name}
                      size={40}
                      src={activeConvo.other_user_avatar || null}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: "700",
                          color: "var(--text-primary)",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {activeConvo.other_user_name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          marginTop: "0.1rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          color: activeConvo.isNew
                            ? "var(--text-ghost)"
                            : otherUserTyping
                              ? "var(--accent)"
                              : otherUserOnline
                                ? "#4ade80"
                                : "var(--text-ghost)",
                        }}
                      >
                        {!activeConvo.isNew && (
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              flexShrink: 0,
                              background: otherUserTyping
                                ? "var(--accent)"
                                : otherUserOnline
                                  ? "#4ade80"
                                  : "var(--border-hover)",
                              boxShadow:
                                otherUserOnline && !otherUserTyping
                                  ? "0 0 6px #4ade80"
                                  : otherUserTyping
                                    ? "0 0 6px var(--accent)"
                                    : "none",
                              animation: otherUserTyping
                                ? "pulse 1s ease-in-out infinite"
                                : "none",
                            }}
                          />
                        )}
                        {activeConvo.isNew
                          ? "Start a new conversation"
                          : otherUserTyping
                            ? "typing..."
                            : otherUserOnline
                              ? "Online"
                              : "Offline"}
                      </div>
                    </div>
                    {!activeConvo.isNew && (
                      <button
                        onClick={() => setConfirmTarget(activeConvo)}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,107,107,0.2)",
                          background: "rgba(255,107,107,0.06)",
                          color: "#ff8787",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(255,107,107,0.18)";
                          e.currentTarget.style.borderColor =
                            "rgba(255,107,107,0.45)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(255,107,107,0.06)";
                          e.currentTarget.style.borderColor =
                            "rgba(255,107,107,0.2)";
                        }}
                        title="Delete conversation"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {activeConvo.item_id && (
                    <ItemCard
                      convo={activeConvo}
                      myId={myId}
                      onStatusChange={handleStatusChange}
                    />
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  {loadingMessages ? (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          border: "2.5px solid var(--border)",
                          borderTop: "2.5px solid var(--accent)",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                    </div>
                  ) : activeConvo.chat_request_status === "pending" &&
                    activeConvo.is_request_sender &&
                    messages.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.6rem",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          padding: "0.6rem 0.85rem",
                          borderRadius: "18px 18px 18px 4px",
                          background: "var(--bg-card-hover)",
                          border: "1px solid var(--border-hover)",
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontStyle: "italic",
                          maxWidth: "60%",
                        }}
                      >
                        {activeConvo.last_message || "No message attached."}
                      </div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.28rem 0.75rem",
                          background: "var(--accent-soft)",
                          border: "1px solid var(--accent-border)",
                          borderRadius: "20px",
                          fontSize: "0.65rem",
                          fontWeight: "700",
                          color: "var(--accent)",
                        }}
                      >
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Waiting for {activeConvo.other_user_name} to accept
                      </div>
                    </div>
                  ) : activeConvo.isNew && messages.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.75rem",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "16px",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: 0.5,
                        }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-secondary)"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "500",
                          color: "var(--text-muted)",
                          margin: 0,
                        }}
                      >
                        Say hello to{" "}
                        <span
                          style={{ color: "var(--accent)", fontWeight: "700" }}
                        >
                          {activeConvo.other_user_name}
                        </span>
                      </p>
                      {activeConvo.item_title && (
                        <p
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-ghost)",
                            margin: 0,
                          }}
                        >
                          about {activeConvo.item_title}
                        </p>
                      )}
                    </div>
                  ) : messages.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-ghost)",
                        fontSize: "0.82rem",
                      }}
                    >
                      No messages yet. Say hello!
                    </div>
                  ) : (
                    groupedMessages.map((msg, i) => {
                      const isGroup = msg.type === "image-group";
                      const isMe =
                        msg.senderId === myId || msg.sender_id === myId;
                      const time = msg.createdAt || msg.created_at || msg.timestamp;
                      return (
                        <div
                          key={msg.id || i}
                          style={{
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                            animation: "fadeUp 0.2s ease",
                            opacity: msg._optimistic ? 0.6 : 1,
                            transition: "opacity 0.3s ease"
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "62%",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.2rem",
                              alignItems: isMe ? "flex-end" : "flex-start",
                            }}
                          >
                            <div
                              style={{
                                padding: (msg.imageUrl || msg.fileUrl || msg.preview || msg.type === "image-group") && !msg.content ? "0" : "0.6rem 0.95rem",
                                borderRadius: isMe
                                  ? "18px 18px 4px 18px"
                                  : "18px 18px 18px 4px",
                                background: (msg.imageUrl || msg.fileUrl || msg.preview || msg.type === "image-group") && !msg.content 
                                  ? "transparent" 
                                  : isMe
                                    ? "linear-gradient(135deg, var(--accent), var(--accent-alt))"
                                    : "var(--bg-card-hover)",
                                border: (msg.imageUrl || msg.fileUrl || msg.preview || msg.type === "image-group") && !msg.content
                                  ? "none"
                                  : isMe
                                    ? "none"
                                    : "1px solid var(--border-hover)",
                                color: isMe ? "white" : "var(--text-primary)",
                                fontSize: "0.875rem",
                                lineHeight: "1.5",
                                boxShadow: isMe && !((msg.imageUrl || msg.fileUrl || msg.preview || msg.type === "image-group") && !msg.content)
                                  ? "0 4px 12px rgba(var(--accent-rgb),0.22)"
                                  : "none",
                                overflow: "hidden"
                              }}
                            >
                                {isGroup ? (
                                  <ImageGrid
                                    group={msg}
                                    isMe={isMe}
                                    onZoom={(images, index) => setFullImageGallery({ images, index })}
                                  />
                                ) : (
                                  <FileBubble
                                    msg={msg}
                                    isMe={isMe}
                                    onZoom={(src) => setFullImageGallery({ images: [src], index: 0 })}
                                  />
                                )}
                              {msg.content && (
                                <div style={{ padding: (msg.imageUrl || msg.fileUrl || msg.preview) ? "0 0.1rem 0.1rem" : "0" }}>
                                  {msg.content}
                                </div>
                              )}
                            </div>
                            {time && (
                              <span
                                style={{
                                  fontSize: "0.6rem",
                                  color: "var(--text-muted)",
                                  paddingInline: "0.3rem",
                                }}
                              >
                                {new Date(time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div
                  style={{
                    padding: "0.85rem 1.25rem 1.25rem",
                    borderTop: "1px solid var(--border)",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  {pendingFiles.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "1.25rem",
                        overflowX: "auto",
                        padding: "10px 10px 5px", // Added padding for the remove buttons
                        marginBottom: "0.25rem",
                        scrollbarWidth: "none",
                      }}
                      className="hide-scrollbar"
                    >
                      {pendingFiles.map((pf) => (
                        <div
                          key={pf.id}
                          style={{
                            position: "relative",
                            flexShrink: 0,
                            animation: "fadeUp 0.2s ease",
                          }}
                        >
                          {pf.type === "image" ? (
                            <img
                              src={pf.preview}
                              alt="Preview"
                              style={{
                                width: "120px",
                                height: "120px",
                                borderRadius: "14px",
                                border: "1px solid var(--border-hover)",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "120px",
                                height: "120px",
                                background: "var(--bg-card)",
                                borderRadius: "14px",
                                border: "1px solid var(--border-hover)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0.5rem",
                              }}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="var(--accent)"
                                strokeWidth="2.5"
                              >
                                {pf.type === "video" ? (
                                  <path d="M23 7l-7 5 7 5V7z" />
                                ) : (
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                )}
                                {pf.type === "video" ? (
                                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                ) : (
                                  <polyline points="14 2 14 8 20 8" />
                                )}
                              </svg>
                              <div
                                style={{
                                  fontSize: "0.6rem",
                                  color: "var(--text-secondary)",
                                  textAlign: "center",
                                  marginTop: "0.5rem",
                                  maxWidth: "110px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {pf.name}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => removeFile(pf.id)}
                            style={{
                              position: "absolute",
                              top: "-6px",
                              right: "-6px",
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              background: "rgba(255,107,107,0.9)",
                              border: "none",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                              zIndex: 1,
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {attachmentMenuOpen && (
                    <div
                      className="attachment-menu"
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "1.25rem",
                        marginBottom: "0.5rem",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-hover)",
                        borderRadius: "18px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
                        overflow: "hidden",
                        width: "220px",
                        zIndex: 100,
                        animation: "fadeUp 0.15s ease",
                      }}
                    >
                      {[
                        {
                          id: "file",
                          label: "Document",
                          icon: (
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          ),
                          extra: <polyline points="14 2 14 8 20 8" />,
                          color: "#3b82f6",
                          ref: fileInputRef,
                        },
                        {
                          id: "media",
                          label: "Photos & Videos",
                          icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />,
                          extra: (
                            <>
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </>
                          ),
                          color: "#e87722",
                          ref: imageInputRef,
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => opt.ref.current?.click()}
                          style={{
                            width: "100%",
                            padding: "1rem 1.25rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--bg-card-hover)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: opt.color + "15",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: opt.color,
                            }}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            >
                              {opt.icon}
                              {opt.extra}
                            </svg>
                          </div>
                          <span
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              color: "var(--text-primary)",
                            }}
                          >
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {activeConvo.chat_request_status === "pending" &&
                  activeConvo.is_request_sender ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                        padding: "0.7rem 1rem",
                        background: "var(--bg-input)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        cursor: "not-allowed",
                        opacity: 0.55,
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-muted)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        style={{
                          flexShrink: 0,
                          animation: "lockPulse 2.5s ease-in-out infinite",
                        }}
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-muted)",
                          fontStyle: "italic",
                        }}
                      >
                        Waiting for {activeConvo.other_user_name} to accept…
                      </span>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSend}
                      style={{
                        display: "flex",
                        gap: "0.65rem",
                        alignItems: "center",
                      }}
                    >
                      <input
                        ref={imageInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={(e) => handleFileSelect(e, "media")}
                        style={{ display: "none" }}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        onChange={(e) => handleFileSelect(e, "file")}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        className="attachment-btn"
                        onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "11px",
                          border: "1px solid var(--border-hover)",
                          background: attachmentMenuOpen ? "var(--bg-card-hover)" : "var(--bg-card)",
                          color: attachmentMenuOpen || pendingFiles.length > 0 ? "var(--accent)" : "var(--text-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          transform: attachmentMenuOpen ? "rotate(135deg)" : "rotate(0deg)",
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>

                      <div style={{ flex: 1 }}>
                        <input
                          ref={msgInputRef}
                          className="msg-input"
                          type="text"
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            const socket = getSocket();
                            if (socket && activeConvo?.other_user_id) {
                              if (!typingEmitRef.current) {
                                typingEmitRef.current = true;
                                socket.emit("typing-start", {
                                  toUserId: activeConvo.other_user_id,
                                  itemId: activeConvo.item_id,
                                });
                              }
                              clearTimeout(typingEmitTimeoutRef.current);
                              typingEmitTimeoutRef.current = setTimeout(() => {
                                typingEmitRef.current = false;
                                socket.emit("typing-stop", {
                                  toUserId: activeConvo.other_user_id,
                                  itemId: activeConvo.item_id,
                                });
                              }, 3000);
                            }
                          }}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          placeholder={
                            activeConvo.isNew
                              ? `Message ${activeConvo.other_user_name}...`
                              : "Type a message..."
                          }
                          disabled={sending}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "0.7rem 1rem",
                            borderRadius: "12px",
                            background: "var(--bg-card)",
                            border: inputFocused
                              ? "1px solid var(--accent-border)"
                              : "1px solid var(--border)",
                            color: "var(--text-primary)",
                            fontSize: "0.9rem",
                            fontFamily: "inherit",
                            transition: "all 0.18s ease",
                            outline: "none",
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={
                          sending || (!newMessage.trim() && pendingFiles.length === 0)
                        }
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "11px",
                          background:
                            sending || (!newMessage.trim() && pendingFiles.length === 0)
                              ? "var(--bg-card)"
                              : "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                          color:
                            sending || (!newMessage.trim() && pendingFiles.length === 0)
                              ? "var(--text-ghost)"
                              : "white",
                          border: "none",
                          cursor:
                            sending || (!newMessage.trim() && pendingFiles.length === 0)
                              ? "not-allowed"
                              : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.18s ease",
                          boxShadow:
                            sending || (!newMessage.trim() && pendingFiles.length === 0)
                              ? "none"
                              : "0 4px 12px rgba(var(--accent-rgb),0.3)",
                        }}
                      >
                        {sending ? (
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              border: "2px solid rgba(255,255,255,0.3)",
                              borderTopColor: "white",
                              borderRadius: "50%",
                              animation: "spin 0.6s linear infinite",
                            }}
                          />
                        ) : (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ transform: "translateX(1px)" }}
                          >
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <FullImageModal
        gallery={fullImageGallery}
        onClose={() => setFullImageGallery(null)}
      />
      {previewEditor && (
        <ImagePreviewEditor
          files={previewEditor}
          onSend={handlePreviewSend}
          onClose={() => setPreviewEditor(null)}
        />
      )}
    </div>
  );
}

export default Messages;