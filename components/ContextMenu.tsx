import React, { useState, useRef, useEffect } from 'react';
import { MenuItem } from '../types';
import { ChevronRightIcon } from './icons';

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
  menuClassName?: string;
}

const Menu: React.FC<{ items: MenuItem[]; onClose: () => void; className: string }> = ({ items, onClose, className }) => {
  const [activeSubMenuIndex, setActiveSubMenuIndex] = useState<number | null>(null);

  const handleItemClick = (action?: () => void) => {
    if (action) {
      action();
    }
    onClose();
  };

  return (
    <div className={`context-menu ${className}`} onMouseLeave={() => setActiveSubMenuIndex(null)}>
      {items.map((item, index) => {
        switch (item.type) {
          case 'divider':
            return <div key={index} className="menu-divider" />;
          case 'custom':
            return <div key={index}>{item.content}</div>;
          case 'toggle':
            return (
              <div key={index} onClick={() => handleItemClick(item.action)} className="menu-item">
                <div className="menu-item-content">
                  {item.icon && <span className="menu-item-icon">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                <div className={`toggle-switch ${item.checked ? 'toggled' : ''}`}>
                  <div className="toggle-switch-handle"></div>
                </div>
              </div>
            );
          case 'submenu':
            const isSubMenuOpen = activeSubMenuIndex === index;
            return (
              <div
                key={index}
                className={`menu-item ${isSubMenuOpen ? 'active' : ''}`}
                onMouseEnter={() => setActiveSubMenuIndex(index)}
              >
                <div className="menu-item-content">
                  {item.icon && <span className="menu-item-icon">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                <ChevronRightIcon />
                {isSubMenuOpen && (
                   <div className="submenu">
                     <Menu items={item.subMenu} onClose={onClose} className={className} />
                   </div>
                )}
              </div>
            );
          case 'item':
          default:
            return (
              <div
                key={index}
                onClick={item.disabled ? undefined : () => handleItemClick(item.action)}
                className={`menu-item ${item.disabled ? 'disabled' : ''}`}
              >
                <div className="menu-item-content">
                  {item.icon && <span className="menu-item-icon">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
              </div>
            );
        }
      })}
    </div>
  );
};

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose, menuClassName = 'context-menu-md' }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  return (
    <div ref={menuRef} style={{ position: 'fixed', top: y, left: x, zIndex: 10 }}>
      <Menu items={items} onClose={onClose} className={menuClassName} />
    </div>
  );
};

export default ContextMenu;
