import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const CustomCursor = () => {
  const dotRef = useRef(null);
  const outlineRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const outline = outlineRef.current;

    // 1. Movement Logic
    const moveCursor = (e) => {
      const { clientX, clientY } = e;

      // Move dot instantly
      gsap.set(dot, { x: clientX, y: clientY });

      // Animate outline with delay
      gsap.to(outline, {
        x: clientX,
        y: clientY,
        duration: 0.15,
        ease: "power2.out"
      });
    };

    // 2. Hover Logic (Event Delegation)
    const handleMouseOver = (e) => {
      const target = e.target;
      
      // Check for Inputs/Textareas
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Check for Clickables (Links, Buttons, or items with class 'pointer')
      const isClickable = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') ||
        target.style.cursor === 'pointer';

      if (isInput) {
        document.body.classList.add('hover-input');
        document.body.classList.remove('hover-interactive');
      } else if (isClickable) {
        document.body.classList.add('hover-interactive');
        document.body.classList.remove('hover-input');
      } else {
        document.body.classList.remove('hover-interactive', 'hover-input');
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot"></div>
      <div ref={outlineRef} className="cursor-outline"></div>
    </>
  );
};

export default CustomCursor;